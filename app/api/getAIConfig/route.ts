import { getServerSession } from "next-auth";
import { options } from "../auth/options";
import connectToDatabase from "@/app/lib/mongodb";
import { AIConfigType } from "@/app/types/types";
import AIConfig from "@/app/models/AIConfig";


export async function GET() {
    const session = await getServerSession(options); 

    console.log("test")
    
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
        console.log(config);
    } catch (error) {
        return new Response(`Couldn't update config`, {
            status: 500,
        })
    }   

    if(config){
        console.log(config);
        return Response.json({ config });
    } else {
        return new Response(`Couldn't get config`, {
            status: 500,
        });
    }    
}

const getAIConfig = async () => {
    const aiConfig: AIConfigType | null = await AIConfig.findOne();
    console.log("test");
    return aiConfig;
  }