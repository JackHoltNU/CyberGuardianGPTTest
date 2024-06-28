import { getServerSession } from "next-auth";
import { options } from "../auth/options";
import connectToDatabase from "@/app/lib/mongodb";
import Chat from "@/app/models/Chat";

interface Props {
    user: string,
    threadId: string,
    messageId: string,
    upvote: boolean,
    downvote: boolean
}

export const POST = async (req: Request) => {
  const body = await req.json();
  const session = await getServerSession(options); 
  let { user, threadId, messageId, upvote, downvote } = body as Props;
  
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

  if(upvote && downvote){
    return new Response("Message cannot be both upvoted and downvoted", {
      status: 403,
    })
  }

  await connectToDatabase();

  try {
    updateMessageVote(threadId, messageId, upvote, downvote);
  } catch (error) {
    return new Response("Could not update feedback", {
      status: 500,
    })
  }

  return new Response("Feedback update successful",{
    status: 200
  })
}

const updateMessageVote = async (threadID: string, messageID: string, upvote: boolean, downvote: boolean) => {  
    try {
      await Chat.updateOne(
        {threadID: threadID, 'messages.id': messageID },
        { $set: {
          'messages.$.feedback.upvoted': upvote,
          'messages.$.feedback.downvoted': downvote 
        }}
      )
    } catch (error: any) {
      console.error(`Couldn't update feedback on database`)
      throw new Error(error.message);
    }  
}