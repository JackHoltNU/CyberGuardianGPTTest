// app/api/getAIConfigs/route.ts
import { getServerSession } from "next-auth";
import { options } from "../auth/options";
import connectToDatabase from "@/app/lib/mongodb";
import { AIConfigType } from "@/app/types/types";
import AIConfig from "@/app/models/AIConfig";

export async function GET() {
    const session = await getServerSession(options); 
    
    if(!session){
        return new Response(`User not authenticated`, {
          status: 401,
        })
    }

    if(session.user?.role !== "admin"){
        console.error(`Session user is not authorised`);

        return new Response(`User not authorised`, {
            status: 403,
        })
    }

    try {
        await connectToDatabase();
    } catch (error: any) {
        console.error("Couldn't connect to database");        
        return new Response(`Couldn't connect to database`, {
            status: 500,
        });
    }

    let configs: AIConfigType[] | null;
    try {
        configs = await getAllAIConfigs();
    } catch (error) {
        return new Response(`Couldn't retrieve configs`, {
            status: 500,
        });
    }   

    if(configs){
        return Response.json({ configs });
    } else {
        return new Response(`Couldn't get configs`, {
            status: 500,
        });
    }    
}

const getAllAIConfigs = async () => {
    const aiConfigs = await AIConfig.find();
    return aiConfigs;
};