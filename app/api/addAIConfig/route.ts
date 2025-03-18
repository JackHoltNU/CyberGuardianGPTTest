// app/api/addAIConfig/route.ts
import { getServerSession } from "next-auth";
import { options } from "../auth/options";
import connectToDatabase from "@/app/lib/mongodb";
import { AIConfigType } from "@/app/types/types";
import AIConfig from "@/app/models/AIConfig";

interface Props {
    config: AIConfigType;
}

export async function POST(req: Request) {
    const body = await req.json();
    const session = await getServerSession(options); 
    const { config } = body as Props;
    
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
        })
    }

    try {
        await addAIConfig(config);
    } catch (error) {
        return new Response(`Couldn't add config`, {
            status: 500,
        })
    }   

    return new Response(`Config added successfully`, {
        status: 201,
    });
}

const addAIConfig = async (config: AIConfigType) => {  
    try {     
        // If this is set as default, unset any existing defaults
        if (config.isDefault) {
            await AIConfig.updateMany({}, { isDefault: false });
        }
        
        await AIConfig.create({
            name: config.name,
            isDefault: config.isDefault || false,
            primary: config.primary,
            secondary: config.secondary,
            mainPrompt: config.mainPrompt,
            formatPrompt: config.formatPrompt
        });
    } catch (error: any) {
        console.error(`Couldn't create config`);
        throw new Error(error.message);
    }  
}