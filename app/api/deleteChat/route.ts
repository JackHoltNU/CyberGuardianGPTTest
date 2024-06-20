import { getServerSession } from "next-auth";
import { options } from "../auth/options";
import Chat from "@/app/models/Chat";

interface Props {
    user: string;
    threadID: string;
}

export async function PUT(req: Request) {
    const body = await req.json();
    const session = await getServerSession(options); 

    const { user, threadID } = body as Props;
    
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

    try {
        console.log("calling deleteChat");
        await deleteChat(user, threadID);
    } catch (error) {
        console.error("Couldn't delete chat");
        return new Response("Could not delete chat", {
            status: 500
        })
    } finally {
        return new Response("Deletion successful",{
            status: 200
        })
    }
}

const deleteChat = async (user: string, threadID: string) => {
    try {
        const chats = await Chat.deleteOne({user, threadID});        
      } catch (error: any) {
        console.error(error);
        throw new Error(error.message);
      }
}