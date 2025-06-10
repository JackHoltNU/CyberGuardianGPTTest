import connectToDatabase from "@/app/lib/mongodb";
import Chat from "@/app/models/Chat";
import { getServerSession } from "next-auth";
import { options } from "../auth/options";

interface Props {
  user: string;
  threadID: string;
  selectedMessageId: string;
}

export async function POST(req: Request) {
  const body = await req.json();
  const session = await getServerSession(options);
  const { user, threadID, selectedMessageId } = body as Props;

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

    const chat = await Chat.findOne({ threadID });
    if (!chat) {
      return new Response("Chat not found", {
        status: 404,
      });
    }

    // Find the selected message and mark it as selected
    const messageIndex = chat.messages.findIndex((msg: any) => msg.id === selectedMessageId);
    if (messageIndex === -1) {
      return new Response("Message not found", {
        status: 404,
      });
    }

    // Update the selected message
    chat.messages[messageIndex].isSelected = true;
    chat.messages[messageIndex].selectionTimestamp = new Date();

    // Unmark any other assistant messages that might have been previously selected
    // (in case user changes their selection)
    chat.messages.forEach((msg: any, index: number) => {
      if (index !== messageIndex && msg.sender === "assistant" && msg.isSelected) {
        msg.isSelected = false;
        msg.selectionTimestamp = undefined;
      }
    });

    await chat.save();

    return Response.json({
      success: true,
      message: "Selection recorded successfully"
    });

  } catch (error: any) {
    console.error("Error recording selection:", error);
    return new Response("Could not record selection", {
      status: 500,
    });
  }
}