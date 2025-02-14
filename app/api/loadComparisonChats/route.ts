import connectToDatabase from "@/app/lib/mongodb";
import ComparisonChat from "@/app/models/ComparisonChat";
import { ChatCollection, ChatInstance, Comparison, ComparisonChatCollection, ComparisonThread, MessageHistory } from "@/app/types/types";
import { getServerSession } from "next-auth";
import { options } from "../auth/options";

interface Props {
    user: string;
}

export async function POST(req: Request) {
    const body = await req.json();
    const session = await getServerSession(options); 
    let { user } = body as Props;
    
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

  const chats = await findComparisonChatsByUser(user);

  const threads:ComparisonThread[] = chats.map((thread) => {
    const comparisons: Comparison[] = thread.messages.map((msg: any) => {
      return {
        version1: msg.version1,
        version2: msg.version2,
      }
    })
    return {comparisons};    
  });
  const collection:ComparisonChatCollection = { threads };
  
  return Response.json(collection);
}

const findComparisonChatsByUser = async (user: string) => {
    try {
      const chats = await ComparisonChat.find({user});
      return chats;
    } catch (error: any) {
      console.error(error);
      throw new Error(error.message);
    }
  }