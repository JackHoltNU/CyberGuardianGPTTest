// app/api/loadDualChats/route.ts
import connectToDatabase from "@/app/lib/mongodb";
import Chat from "@/app/models/Chat";
import { ChatCollection, ChatInstance, MessageHistory } from "@/app/types/types";
import { getServerSession } from "next-auth";
import { options } from "../auth/options";

interface Props {
    user: string;
    dualChatID: string;
}

export async function POST(req: Request) {
    const body = await req.json();
    const session = await getServerSession(options); 
    let { user, dualChatID } = body as Props;
    
    if(!session){
      return new Response(`User not authenticated`, {
        status: 401,
      })
    }

    if(session.user?.name != user){
      return new Response(`Correct user not authenticated`, {
          status: 401,
      })
    }

    await connectToDatabase();

    const chats = await findChatsByDualChatID(user, dualChatID);

    const chatInstances: ChatInstance[] = chats.map((chat) => {
      const messages = chat.messages.map((message: any) => {
        const messageHistory: MessageHistory = {
          id: message.id ?? "",
          sender: message.sender,
          text: message.text,
          timestamp: message.timestamp,
          messageRating: message.feedback
        }
        return messageHistory
      })

      const chatInstance: ChatInstance = {
        threadID: chat.threadID,
        dualChatID: chat.dualChatID,
        configName: chat.configName,
        title: chat.title,
        latestTimestamp: new Date(chat.latestTimestamp),
        messages
      }
      return chatInstance;
    })

    const collection: ChatCollection = {
      chats: chatInstances,
    }

    return Response.json(collection);
}

const findChatsByDualChatID = async (user: string, dualChatID: string) => {
    try {
      const chats = await Chat.find({user, dualChatID});
      return chats;
    } catch (error: any) {
      console.error(error);
      throw new Error(error.message);
    }
}