import { getServerSession } from "next-auth";
import bcrypt from "bcrypt";
import User from "@/app/models/User";
import { options } from "../auth/options";
import { UserCollection, UserInstance } from "@/app/types/types";


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

    const users = await findAllUsers();
    console.log(users[0]);

    const userInstances = users.map((item) => {
        console.log(item);
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