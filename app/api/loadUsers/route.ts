import { getServerSession } from "next-auth";
import bcrypt from "bcrypt";
import User from "@/app/models/User";
import { options } from "../auth/options";
import { UserCollection, UserInstance } from "@/app/types/types";
import connectToDatabase from "@/app/lib/mongodb";


export async function GET() {
    
    const session = await getServerSession(options); 
    
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
        throw new Error(error.message)
      }

    const users = await findAllUsers();

    const userInstances = users.map((item) => {
        const user: UserInstance = {
            username: item.username,
            role: item.role
        }
        return user;
    })

    const usercollection:UserCollection = {
        users: userInstances,
      }
    
    return Response.json(usercollection);
}

const findAllUsers = async () => {  
    try {        
        const users = await User.find();
        // TODO prevent returning hashed password
        return users;
    } catch (error: any) {
      console.error(`Couldn't retrieve users`);
      throw new Error(error.message);
    }  
}