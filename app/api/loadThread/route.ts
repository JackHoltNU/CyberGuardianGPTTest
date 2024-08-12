import connectToDatabase from "@/app/lib/mongodb";
import Chat from "@/app/models/Chat";
import { ChatCollection, ChatInstance, MessageHistory } from "@/app/types/types";
import { getServerSession } from "next-auth";
import { options } from "../auth/options";

interface Props {
    threadID: string;
}

export async function POST(req: Request) {
    const body = await req.json();
    const session = await getServerSession(options); 
    let { threadID } = body as Props;
    
    if(!session){
      return new Response(`User not authenticated`, {
        status: 401,
      })
    }
    
    if (session.user?.role !== "admin") {
        console.error(`Session user is not authorised`);
        return new Response(`User not authorised`, { status: 403 });
    }
  
    try {
        await connectToDatabase();
    } catch (error: any) {
        console.error("Couldn't connect to database");
        throw new Error(error.message);
    }

  const chat = await findChatByThreadID(threadID);

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

  return Response.json(messages);
}

const findChatByThreadID = async (threadID: string) => {
    try {
      const chat = await Chat.findOne({threadID});
      return chat;
    } catch (error: any) {
      console.error(error);
      throw new Error(error.message);
    }
  }