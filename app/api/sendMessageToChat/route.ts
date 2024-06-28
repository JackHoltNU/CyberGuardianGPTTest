import { NextApiRequest, NextApiResponse } from "next";
import { MessageHistory, MessageRating } from "../../types/types";
import Chat from "@/app/models/Chat";
import connectToDatabase from "@/app/lib/mongodb";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { options } from "../auth/options";
import { NextRequest, NextResponse } from "next/server";

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
  
  try {
    await connectToDatabase();
  } catch (error: any) {
    console.error("Couldn't connect to database");
    throw new Error(error.message)
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  if(threadID === undefined){
    threadID = crypto.randomUUID();
  }

  // record user's message to database
  await createOrContinueChat(threadID,"", user, messageHistory[messageHistory.length - 1], messageHistory);

  const messagesParam: ChatCompletionRequestMessage[] = [
    {
      role: "system",
      content:
        "You assist users with online safety, emphasizing essential security practices such as strong password creation, scam identification, and software updates, in clear, simple UK English. In particular, you help with overcoming technological difficulties. Many of your users will be older adults who aren't heavy technology users and aren't confident with technology. You avoid technical jargon, sometimes using analogies to help yourself be understood when talking about complex matters. You never use analogies for things that are already easy to understand. In both urgent and non-urgent situations, you provide guidance in a conversational style, avoiding long lists of instructions unless explicitly instructed. Instead, you offer step-by-step advice one step at a time, allowing for back-and-forth interaction to ensure clarity and support. This approach helps users feel more comfortable and supported, making the guidance more accessible and effective. You discourage users from disclosing personal details to you. In cases of high risk, you suggest that the user contact a friend or family member, or suggest they contact a cyberguardian, whose contact details should be available on the cyberguardians website.",
    },
    ...messageHistory.map((item) => ({
      role: item.sender,
      content: item.text as string,
    })),
    {
      role: "user",
      content: `Please respond in the following JSON format: {"title": "Suggested chat title that captures the full conversation", "response": "Your response here", "tags": "One or more comma-separated tags chosen from this list: [Scams, Passwords, Protective Software, Safe Shopping, AI, Miscellaneous]"}`
    }
  ];

  // get bot response
  try {
    const completion = await openai.chat.completions.create({
      messages: messagesParam,
      model: "ft:gpt-3.5-turbo-1106:personal:test-finetune:9WLpJhZj",
    });

    let response = "";
    let title = "";
    let tags: string[] = [];
    const emptyFeedback:MessageRating = {
      upvoted: false,
      downvoted: false,
      comments: []
    }

    try {
      const responseMessage = completion.choices[0].message.content ?? "";
      console.log(`Raw response ${responseMessage}`);
      const jsonResponse = JSON.parse(responseMessage);
      title = jsonResponse.title;
      response = jsonResponse.response;
      const tagsRaw: string = jsonResponse.tags;
      tags = tagsRaw.split(",");
      console.log(tags);
    } catch (error: any) {
      console.error("Failed to parse JSON message, returning raw response");
      response = completion.choices[0].message.content ?? "";;
      title = "";
      // throw new Error(error.message);
    }
    const responseId = crypto.randomUUID();

    await createOrContinueChat(threadID, title, user, {sender: "assistant", text: response, id: responseId, messageRating: emptyFeedback},messageHistory, tags);

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
    // throw new Error(`Failed to create chat completion: ${error.message}`);
  }
};

const createOrContinueChat = async (threadID: string, title: string, user: string, newMessage: MessageHistory, messageHistory: MessageHistory[], tags?: String[]) => {
    const chat = await Chat.findOne({ threadID });
    console.log(newMessage.messageRating);
  
    try {
      if (chat) {
          chat.messages.push(newMessage);
          chat.title = title;
          chat.latestTimestamp = Date.now();
          if(tags){
            chat.tags = tags;
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