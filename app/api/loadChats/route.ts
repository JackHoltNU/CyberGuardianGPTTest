import connectToDatabase from "@/app/lib/mongodb";
import Chat from "@/app/models/Chat";
import { ChatCollection, ChatInstance, MessageHistory } from "@/app/types/types";
import { NextApiRequest } from "next";
import { getServerSession } from "next-auth";
import { options } from "../auth/options";

interface Props {
    user: string;
}

export async function POST(req: Request) {
    const body = await new Response(req.body).json();
    const session = await getServerSession(options); 
    let { user } = body as Props;
    
    if(!session){
      return new Response(`User not authenticated`, {
        status: 401,
      })
    }

  await connectToDatabase();

  const chats = await findChatsByUser(user);

  const chatInstances:ChatInstance[] = chats.map((chat) => {
    const messages = chat.messages.map((message: any) => {
      const messageHistory: MessageHistory = {
        sender: message.sender,
        text: message.text
      }
      return messageHistory
    })

    const chatInstance:ChatInstance = {
      threadID: chat.threadID,
      title: chat.title,
      messages
    }
    return chatInstance;
  })

  const collection:ChatCollection = {
    chats: chatInstances,
  }

  return Response.json(collection);
}

const findChatsByUser = async (user: string) => {
    try {
      const chats = await Chat.find({user});
      return chats;
    } catch (error: any) {
      console.error(error);
      throw new Error(error.message);
    }
  }