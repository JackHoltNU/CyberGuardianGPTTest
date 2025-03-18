// app/api/updateAIConfig/route.ts
import { getServerSession } from "next-auth";
import { options } from "../auth/options";
import connectToDatabase from "@/app/lib/mongodb";
import { AIConfigType } from "@/app/types/types";
import AIConfig from "@/app/models/AIConfig";

interface Props {
    configName: string;
    newConfig: AIConfigType;
}

export async function PUT(req: Request) {
    const body = await req.json();
    const session = await getServerSession(options); 
    const { configName, newConfig } = body as Props;
    
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
        await updateAIConfig(configName, newConfig);
    } catch (error) {
        return new Response(`Couldn't update config`, {
            status: 500,
        })
    }   

    return new Response(`Config updated successfully`, {
        status: 200,
    });
}

const updateAIConfig = async (configName: string, newConfig: AIConfigType) => {  
    try {     
        const config = await AIConfig.findOne({ name: configName });
        
        if(!config){
            throw new Error(`Configuration with name ${configName} not found`);
        }
        
        // If this config is being set as default, unset all others
        if (newConfig.isDefault && !config.isDefault) {
            await AIConfig.updateMany({ _id: { $ne: config._id } }, { isDefault: false });
        }
        
        config.name = newConfig.name;
        config.isDefault = newConfig.isDefault || false;
        config.primary = newConfig.primary;
        config.secondary = newConfig.secondary;
        config.mainPrompt = newConfig.mainPrompt;
        config.formatPrompt = newConfig.formatPrompt;
        
        await config.save();
    } catch (error: any) {
        console.error(`Couldn't update config`);
        throw new Error(error.message);
    }  
}