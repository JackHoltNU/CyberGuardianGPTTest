import connectToDatabase from "@/app/lib/mongodb";
import Chat from "@/app/models/Chat";
import { ChatCollection, ChatInstance, MessageHistory } from "@/app/types/types";
import { NextApiRequest } from "next";

interface Props {
    user: string;
}

export async function POST(req: NextApiRequest) {
    const body = await new Response(req.body).json();
    let { user } = body as Props;

    console.log("Loading chats...");
  

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