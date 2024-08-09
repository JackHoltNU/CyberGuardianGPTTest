import { AIConfigType, MessageHistory, MessageRating } from "../../types/types";
import Chat from "@/app/models/Chat";
import connectToDatabase from "@/app/lib/mongodb";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { options } from "../auth/options";
import { NextRequest, NextResponse } from "next/server";
import AIConfig from "@/app/models/AIConfig";

interface Props {
    messageHistory: MessageHistory[], 
    user: string, 
    threadID: string | undefined
}

interface ChatCompletionRequestMessage {
    role: "system" | "user" | "assistant";
    content: string;
}


export const POST = async (req: Request) => {
  const body = await req.json();
  const session = await getServerSession(options); 
  let { messageHistory, user, threadID } = body as Props;

  if(!session){
    return new Response(`User not authenticated`, {
      status: 401,
    })
  }

  if(session.user?.name != user){
    console.log(`Session user is ${session.user?.name}, requesting user is ${user}`);

    return new Response(`Correct user not authenticated`, {
        status: 401,
    })
  }

  console.log(`User role: ${session.user.role}`);
  
  try {
    await connectToDatabase();
  } catch (error: any) {
    console.error("Couldn't connect to database");
    throw new Error(error.message)
  }

  if(threadID === undefined){
    threadID = crypto.randomUUID();
  }

  // record user's message to database
  await createOrContinueChat(threadID,"", user, messageHistory[messageHistory.length - 1], messageHistory);

  const config = await getAIConfig();
  let model: string;
  let mainPrompt: string;
  let formatPrompt: string;

  let messagesParam: ChatCompletionRequestMessage[] = [];

  if(config){
    model = config.primary;
    mainPrompt = config.mainPrompt;
    formatPrompt = config.formatPrompt;
    messagesParam = [
      {
        role: "system",
        content: `${mainPrompt} ${formatPrompt}`
      },
      ...messageHistory.map((item) => ({
        role: item.sender,
        content: item.text as string,
      })),
      // {
      //   role: "user",
      //   content: formatPrompt
      // }
    ]
    console.log(messagesParam);
  } else {    
    return new Response("Could not create chat completion", {
      status: 500,
    })
  }

  

  // get bot response
  try {    
    if(!config?.primary){
      return new Response("Could not create chat completion due to missing model information", {
        status: 500,
      })
    }
    let completion = await getCompletion(messagesParam, config.primary);

    let response: string = "";
    let title: string | undefined = "";
    let tags: string[] | undefined = [];
    const emptyFeedback:MessageRating = {
      upvoted: false,
      downvoted: false,
      comments: []
    }

    try {
      let responseMessage = completion.choices[0].message.content ?? "";
      console.log(`Raw response ${responseMessage}`);
      let successfulResponse = false;
      let iterations = 0;
      let jsonResponse: any;

      try {
        jsonResponse = JSON.parse(responseMessage);
        if(jsonResponse.response){
          successfulResponse = true;
        }
      } catch (error) {
        console.error(`Failed to parse JSON message`);
        successfulResponse = false;
      }

      while(!successfulResponse && iterations < 3){
        try {          
          completion = await getCompletion(messagesParam, config.primary);
          responseMessage = completion.choices[0].message.content ?? "";
          jsonResponse = JSON.parse(responseMessage);
          if(jsonResponse.response){
            successfulResponse = true;
          } else {
            iterations ++;
          }
        } catch (error) {
          console.error(`Failed to parse JSON message`);
          iterations ++;
        }                
      }
      
      title = jsonResponse.title;
      response = jsonResponse.response;      
      const tagsRaw: string = jsonResponse.tags;
      if(tagsRaw){
        tags = tagsRaw.split(",");
        console.log(tags);
      }      
    } catch (error: any) {
      console.error("Failed to parse JSON message, returning raw response");
      return new Response("Could not create chat completion", {
        status: 500,
      })
    }
    const responseId = crypto.randomUUID();

    await createOrContinueChat(threadID, title, user, {sender: "assistant", text: response, id: responseId, messageRating: emptyFeedback},messageHistory, tags, model, mainPrompt, formatPrompt);

    return Response.json({
        id: responseId,
        title: title,
        message: response,
        threadID: threadID,        
        userTokens: completion.usage?.prompt_tokens,
        botTokens: completion.usage?.completion_tokens,
      })
    
  } catch (error: any) {
    console.error("Couldn't create chat completion", error);
    return new Response("Could not create chat completion", {
      status: 500,
    })
  }
};

const getCompletion = async (messagesParam: ChatCompletionRequestMessage[], model: string) => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  // const model = "ft:gpt-3.5-turbo-1106:personal:test-finetune:9WLpJhZj";
  // const model = "gpt-4o-mini";

  return await openai.chat.completions.create({
    messages: messagesParam,
    model,
    response_format: { type: "json_object" },
  });
}

const getAIConfig = async () => {
  const aiConfig: AIConfigType | null = await AIConfig.findOne();
  return aiConfig;
}

const createOrContinueChat = async (threadID: string, title: string | undefined, user: string, newMessage: MessageHistory, messageHistory: MessageHistory[], tags?: String[], model? : string, mainPrompt?: string, formatPrompt?: string) => {
    const chat = await Chat.findOne({ threadID });
    console.log(newMessage.messageRating);
  
    try {
      if (chat) {
          chat.messages.push(newMessage);
          if(title){
            chat.title = title;
          }
          chat.latestTimestamp = Date.now();
          if(tags){
            chat.tags = tags;
          }
          if(model){
            chat.model = model;
          }
          if(mainPrompt){
            chat.mainPrompt = mainPrompt;
          }
          if(formatPrompt){
            chat.formatPrompt = formatPrompt;
          }
          await chat.save();
        } else {
          console.log(`creating chat, ${threadID}, ${user}, ${newMessage}`);
          await Chat.create({
            threadID,
            title,
            user,
            messages: [...messageHistory],
          });
        }
    } catch (error: any) {
      console.error(`Couldn't save chat to database`)
      throw new Error(error.message);
    }  
  }