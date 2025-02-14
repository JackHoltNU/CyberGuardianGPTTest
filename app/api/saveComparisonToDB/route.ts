import { Comparison, MessageHistory, MessageRating } from "../../types/types";
import connectToDatabase from "@/app/lib/mongodb";
import { getServerSession } from "next-auth";
import { options } from "../auth/options";
import ComparisonChat from "@/app/models/ComparisonChat";

interface Props {
  threadID: string | undefined;
  user: string;
  messages: Comparison,
  timestamp: Date,  
}

export const POST = async (req: Request) => {
  const body = await req.json();
  const session = await getServerSession(options);
  let { messages, user, threadID, timestamp } = body as Props;


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

try {
await createOrContinueChat(
    threadID,
    user,
    messages,
    timestamp
);        

return new Response("Saved", {
    status: 200,
  });
  } catch (error: any) {
    console.error("Couldn't save", error);
    return new Response("Could not save to DB", {
      status: 500,
    });
  }
};

const createOrContinueChat = async (
  threadID: string,
  user: string,
  messages: Comparison,
  timestamp: Date  
) => {
  const chat = await ComparisonChat.findOne({ threadID });
  console.log(`title: ${messages.version1.title}`);

  try {
    if (chat) {
      chat.messages.push(messages);
      
      chat.latestTimestamp = timestamp;
      await chat.save();
    } else {
      await ComparisonChat.create({
        threadID,        
        user,
        messages: [messages],
      });
    }
  } catch (error: any) {
    console.error(`Couldn't save chat to database`);
    throw new Error(error.message);
  }
};
