// app/api/deleteAIConfig/route.ts
import { getServerSession } from "next-auth";
import { options } from "../auth/options";
import connectToDatabase from "@/app/lib/mongodb";
import AIConfig from "@/app/models/AIConfig";

interface Props {
    configName: string;
}

export async function DELETE(req: Request) {
    const body = await req.json();
    const session = await getServerSession(options); 
    const { configName } = body as Props;
    
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
        // Check if there is only one config - don't allow deletion of the last config
        const count = await AIConfig.countDocuments();
        if (count <= 1) {
            return new Response(`Cannot delete the only configuration`, {
                status: 400,
            });
        }

        // Check if this is the default config
        const config = await AIConfig.findOne({ name: configName });
        if (config && config.isDefault) {
            // If deleting the default config, set another one as default
            const anotherConfig = await AIConfig.findOne({ name: { $ne: configName } });
            if (anotherConfig) {
                anotherConfig.isDefault = true;
                await anotherConfig.save();
            }
        }

        await deleteAIConfig(configName);
    } catch (error) {
        return new Response(`Couldn't delete config`, {
            status: 500,
        })
    }   

    return new Response(`Config deleted successfully`, {
        status: 200,
    });
}

const deleteAIConfig = async (configName: string) => {  
    try {
        await AIConfig.deleteOne({ name: configName });
    } catch (error: any) {
        console.error(`Couldn't delete config`);
        throw new Error(error.message);
    }  
}