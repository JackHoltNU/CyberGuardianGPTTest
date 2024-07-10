import { getServerSession } from "next-auth";
import { options } from "../auth/options";
import Chat from "@/app/models/Chat";

interface Props {
    user: string;
    threadID: string;
}

export async function POST(req: Request) {
    const body = await req.json();
    const session = await getServerSession(options); 

    const { user, threadID } = body as Props;
    
    if(!session){
        return new Response(`User not authenticated`, {
          status: 401,
        })
    }

    if(session.user?.role !== "admin"){
        console.log(`Session user is not authorised`);

        return new Response(`User not authorised`, {
            status: 403,
        })
    }

    // add user functionality to go here
}