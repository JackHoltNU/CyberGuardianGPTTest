// app/api/exportAllChats/route.ts
import { getServerSession } from "next-auth";
import { options } from "../auth/options";
import connectToDatabase from "@/app/lib/mongodb";
import Chat from "@/app/models/Chat";
import {
  ChatCollection,
  ChatInstance,
  MessageHistory,
} from "@/app/types/types";

interface Props {
  user: string;
}

export async function POST(req: Request) {
  const body = await req.json();
  const session = await getServerSession(options);
  let { user } = body as Props;

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

  await connectToDatabase();

  const chats = await findAllChatsByUser(user, session.user?.role === "admin");

  const chatInstances: ChatInstance[] = chats.map((chat) => {
    const messages = chat.messages.map((message: any) => {
      const messageHistory: MessageHistory = {
        id: message.id ?? "",
        sender: message.sender,
        text: message.text,
        timestamp: message.timestamp,
        messageRating: message.feedback,
        model: message.model,
        mainPrompt: message.mainPrompt,
        formatPrompt: message.formatPrompt,
      };
      return messageHistory;
    });

    const chatInstance: ChatInstance = {
      threadID: chat.threadID,
      title: chat.title || "Untitled Chat",
      latestTimestamp: new Date(
        chat.latestTimestamp ||
          chat.messages[chat.messages.length - 1]?.timestamp
      ),
      messages,
      user: chat.user,
    };
    return chatInstance;
  });

  const collection: ChatCollection = {
    chats: chatInstances,
  };

  return Response.json(collection);
}

const findAllChatsByUser = async (user: string, isAdmin: boolean) => {
  try {
    // If admin, they can export all chats
    const query = isAdmin ? {} : { user };
    const chats = await Chat.find(query).sort({ latestTimestamp: -1 });
    return chats;
  } catch (error: any) {
    console.error(error);
    throw new Error(error.message);
  }
};
