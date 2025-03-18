// app/api/getAIConfig/route.ts
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

    // if(session.user?.role !== "admin"){
    //     console.error(`Session user is not authorised`);

    //     return new Response(`User not authorised`, {
    //         status: 403,
    //     })
    // }

    try {
        await connectToDatabase();
    } catch (error: any) {
        console.error("Couldn't connect to database");        
        return new Response(`Couldn't connect to database`, {
            status: 500,
        })
    }

    let config: AIConfigType | null;
    try {
        config = await getAIConfig();
    } catch (error) {
        return new Response(`Couldn't update config`, {
            status: 500,
        })
    }   

    if(config){
        return Response.json({ config });
    } else {
        return new Response(`Couldn't get config`, {
            status: 500,
        });
    }    
}

const getAIConfig = async () => {
    // First try to get the default config
    let aiConfig: AIConfigType | null = await AIConfig.findOne({ isDefault: true }).lean();
    
    // If no default config is found, get the first one available
    if (!aiConfig) {
        aiConfig = await AIConfig.findOne().lean();
        
        // If we found a config but it's not marked as default, mark it
        if (aiConfig) {
            await AIConfig.updateOne({ _id: aiConfig._id }, { isDefault: true });
            aiConfig.isDefault = true;
        }
    }
    
    return aiConfig;
}