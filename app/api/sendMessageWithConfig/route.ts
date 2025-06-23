// app/api/sendMessageWithConfig/route.ts
import { AIConfigType, MessageHistory, MessageRating } from "../../types/types";
import Chat from "@/app/models/Chat";
import connectToDatabase from "@/app/lib/mongodb";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { options } from "../auth/options";
import AIConfig from "@/app/models/AIConfig";

interface Props {
  messageHistory: MessageHistory[];
  user: string;
  threadID: string | undefined;
  dualChatID: string | undefined;
  configName: string;
  saveUserMsgToDB?: Boolean;
  saveResponseToDB?: Boolean;
}

interface ChatCompletionRequestMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export const POST = async (req: Request) => {
  const body = await req.json();
  const session = await getServerSession(options);
  let {
    messageHistory,
    user,
    threadID,
    dualChatID,
    configName,
    saveResponseToDB,
    saveUserMsgToDB,
  } = body as Props;

  if (!session) {
    return new Response(`User not authenticated`, {
      status: 401,
    });
  }

  if (session.user?.name != user) {
    return new Response(`Correct user not authenticated`, {
      status: 401,
    });
  }

  try {
    await connectToDatabase();
  } catch (error: any) {
    console.error("Couldn't connect to database");
    throw new Error(error.message);
  }

  if (threadID === undefined) {
    threadID = crypto.randomUUID();
  }

  // record user's message to database
  if (saveUserMsgToDB) {
    await createOrContinueChat(
      threadID,
      dualChatID,
      configName,
      "",
      user,
      messageHistory[messageHistory.length - 1],
      messageHistory
    );
  }

  // Get the specific AI configuration
  let config: AIConfigType | null;
  let messagesParam: ChatCompletionRequestMessage[] = [];

  try {
    config = await getSpecificAIConfig(configName);
    if (!config) {
      return new Response("Could not find AI configuration", {
        status: 404,
      });
    }
  } catch (error: any) {
    console.error("Error getting AI config:", error);
    return new Response("Could not retrieve AI configuration", {
      status: 500,
    });
  }

  messagesParam = [
    {
      role: "system",
      content: `${config.mainPrompt} ${config.formatPrompt}`,
    },
    ...messageHistory.map((item) => ({
      role: item.sender,
      content: item.text as string,
    })),
  ];

  // get bot response
  try {
    let completion = await getCompletion(messagesParam, config.primary);

    let response: string = "";
    let title: string | undefined = "";
    let tags: string[] | undefined = [];
    const emptyFeedback: MessageRating = {
      upvoted: false,
      downvoted: false,
      comments: [],
    };

    try {
      let responseMessage = completion.choices[0].message.content ?? "";
      console.log(responseMessage);
      let successfulResponse = false;
      let iterations = 0;
      let jsonResponse: any;

      // Initial attempt
      try {
        // Check if it's an OpenAI error message
        if (responseMessage.startsWith('An error') || responseMessage.startsWith('Error:')) {
          console.error(`OpenAI returned error: ${responseMessage}`);
          successfulResponse = false;
        } else {
          jsonResponse = JSON.parse(responseMessage);
          if (jsonResponse.response) {
            successfulResponse = true;
          }
        }
      } catch (error) {
        console.error(`Failed to parse JSON message`);
        successfulResponse = false;
      }

      // Retry logic for failed attempts
      while(!successfulResponse && iterations < 3){
        iterations++;
        console.log(`Retrying OpenAI request, attempt ${iterations}/3`);
        
        try {
          completion = await getCompletion(messagesParam, config.primary);
          responseMessage = completion.choices[0].message.content ?? "";
          console.log(`Retry ${iterations} response:`, responseMessage);
          
          // Check if it's an OpenAI error message
          if (responseMessage.startsWith('An error') || responseMessage.startsWith('Error:')) {
            console.error(`OpenAI returned error on retry ${iterations}: ${responseMessage}`);
            continue; // Try again
          }
          
          jsonResponse = JSON.parse(responseMessage);
          if(jsonResponse.response){
            successfulResponse = true;
          }
        } catch (error) {
          console.error(`Failed to parse JSON message on retry ${iterations}`);
          // Continue to next iteration or fail if max retries reached
        }
      }

      // If still not successful after retries, throw error
      if (!successfulResponse) {
        console.error("Failed to get valid response after 3 retries");
        throw new Error("OpenAI service temporarily unavailable - please try again");
      }

      title = jsonResponse.title;
      response = jsonResponse.response;
      const tagsRaw: string = jsonResponse.tags;
      if (tagsRaw) {
        tags = tagsRaw.split(",");
      }
    } catch (error: any) {
      console.error("Failed to get valid response from OpenAI:", error.message);
      return new Response(error.message || "Could not create chat completion", {
        status: 500,
      });
    }
    const responseId = crypto.randomUUID();

    if (saveResponseToDB) {
      await createOrContinueChat(
        threadID,
        dualChatID,
        configName,
        title,
        user,
        {
          sender: "assistant",
          text: response,
          id: responseId,
          messageRating: emptyFeedback,
          model: config.primary,
          mainPrompt: config.mainPrompt,
          formatPrompt: config.formatPrompt,
        },
        messageHistory,
        tags
      );
    }

    return Response.json({
      id: responseId,
      title: title,
      message: response,
      threadID: threadID,
      dualChatID: dualChatID,
      configName: configName,
      userTokens: completion.usage?.prompt_tokens,
      botTokens: completion.usage?.completion_tokens,
    });
  } catch (error: any) {
    console.error("Couldn't create chat completion", error);
    return new Response("Could not create chat completion", {
      status: 500,
    });
  }
};

const getCompletion = async (
  messagesParam: ChatCompletionRequestMessage[],
  model: string
) => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 60000,
  });

  return await openai.chat.completions.create({
    messages: messagesParam,
    model,
    response_format: { type: "json_object" },
  });
};

const getSpecificAIConfig = async (configName: string) => {
  const aiConfig: AIConfigType | null = await AIConfig.findOne({
    name: configName,
  });
  return aiConfig;
};

const createOrContinueChat = async (
  threadID: string,
  dualChatID: string | undefined,
  configName: string,
  title: string | undefined,
  user: string,
  newMessage: MessageHistory,
  messageHistory: MessageHistory[],
  tags?: String[]
) => {
  const chat = await Chat.findOne({ threadID });

  try {
    if (chat) {
      chat.messages.push(newMessage);
      if (title) {
        chat.title = title;
      }
      chat.latestTimestamp = Date.now();
      if (tags) {
        chat.tags = tags;
      }
      await chat.save();
    } else {
      await Chat.create({
        threadID,
        dualChatID,
        configName,
        title,
        user,
        messages: [...messageHistory],
      });
    }
  } catch (error: any) {
    console.error(`Couldn't save chat to database`);
    throw new Error(error.message);
  }
};
