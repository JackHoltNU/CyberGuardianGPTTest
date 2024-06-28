import { getServerSession } from "next-auth";
import { options } from "../auth/options";
import connectToDatabase from "@/app/lib/mongodb";
import Chat from "@/app/models/Chat";

interface Props {
    user: string,
    threadId: string,
    messageId: string,
    comment: string
}

export const POST = async (req: Request) => {
  const body = await req.json();
  const session = await getServerSession(options); 
  let { user, threadId, messageId, comment } = body as Props;
  
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

  await connectToDatabase();

  try {
    addMessage(threadId, messageId, comment);
  } catch (error) {
    return new Response("Could not update feedback", {
      status: 500,
    })
  }

  return new Response("Feedback update successful",{
    status: 200
  })
}

const addMessage = async (threadID: string, messageID: string, comment: string) => {  
    try {
        console.log(`Adding message: ${comment}`);
      await Chat.updateOne(
        {threadID: threadID, 'messages.id': messageID },
        { $push: {
          'messages.$.feedback.comments': comment,
        }}
      )
    } catch (error: any) {
      console.error(`Couldn't update feedback on database`)
      throw new Error(error.message);
    }  
}