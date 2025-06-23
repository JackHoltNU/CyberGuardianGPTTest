import { AIConfigType, MessageHistory, MessageRating, PromptConfiguration } from "../../types/types";
import Chat from "@/app/models/Chat";
import connectToDatabase from "@/app/lib/mongodb";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { options } from "../auth/options";
import { NextRequest, NextResponse } from "next/server";
import AIConfig from "@/app/models/AIConfig";

interface Props {
  messageHistory: MessageHistory[];
  user: string;
  threadID: string | undefined;
  model?: string;
  mainPrompt?: string;
  userPrompt?: string;
  formatPrompt?: string;
  saveUserMsgToDB?: Boolean;
  saveResponseToDB?: Boolean;
  promptConfig?: PromptConfiguration;
}

interface ChatCompletionRequestMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export const POST = async (req: Request) => {
  const body = await req.json();
  const session = await getServerSession(options);
  let { messageHistory, user, threadID, model, mainPrompt, userPrompt, formatPrompt, saveResponseToDB, saveUserMsgToDB, promptConfig } = body as Props;

  


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
  if(saveUserMsgToDB){
    await createOrContinueChat(
      threadID,
      "",
      user,
      messageHistory[messageHistory.length - 1],
      messageHistory
    );
  }  

  let config: AIConfigType | null;
  let messagesParam: ChatCompletionRequestMessage[] = [];

  if(!model || !mainPrompt == undefined || formatPrompt == undefined){
    if(userPrompt){
      config = await getAIConfig("Phase3PB");
    } else {
      config = await getAIConfig();
      console.log("no user prompt")
    }
    if(config){      
      model = config.primary;
      mainPrompt = mainPrompt ?? config.mainPrompt;
      if(userPrompt){
        mainPrompt += userPrompt;
      }
      formatPrompt = formatPrompt ?? config.formatPrompt;
    } else {
      return new Response("Could not create chat completion, missing AI config", {
        status: 500,
      });
    }    
  }  

  console.log(`Model: ${model}`);
  console.log(`Main: ${mainPrompt}`);
  console.log(`Format: ${formatPrompt}`);
   
  messagesParam = [
      {
        role: "system",
        content: `${mainPrompt} ${formatPrompt}`,
      },
      ...messageHistory.map((item) => ({
        role: item.sender,
        content: item.text as string,
      })),
      // {
      //   role: "user",
      //   content: formatPrompt
      // }
  ];  

  // get bot response
  try {    
    let completion = await getCompletion(messagesParam, model);

    let response: string = "";
    let title: string | undefined = "";
    let tags: string[] | undefined = [];
    let breakpoint: false;
    const emptyFeedback: MessageRating = {
      upvoted: false,
      downvoted: false,
      comments: [],
    };

    try {
      let responseMessage = completion.choices[0].message.content ?? "";
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
          completion = await getCompletion(messagesParam, model);
          responseMessage = completion.choices[0].message.content ?? "";
          
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
      breakpoint = jsonResponse.breakpoint;
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

    if(saveResponseToDB){
      await createOrContinueChat(
        threadID,
        title,
        user,
        {
          sender: "assistant",
          text: response,
          id: responseId,
          messageRating: emptyFeedback,
          model,
          mainPrompt,
          formatPrompt,
          promptConfig,
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
      userTokens: completion.usage?.prompt_tokens,
      botTokens: completion.usage?.completion_tokens,
      breakpoint
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
  // const model = "ft:gpt-3.5-turbo-1106:personal:test-finetune:9WLpJhZj";
  // const model = "gpt-4o-mini";

  return await openai.chat.completions.create({
    messages: messagesParam,
    model,
    response_format: { type: "json_object" },
  });
};

const getAIConfig = async (config?: string) => {
  let aiConfig: AIConfigType | null;
  if(config){
    aiConfig = await AIConfig.findOne({ name: config });
  } else {
    aiConfig = await AIConfig.findOne({ isDefault: true });
  }
  return aiConfig;
};

const createOrContinueChat = async (
  threadID: string,
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
