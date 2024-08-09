import { getServerSession } from "next-auth";
import bcrypt from "bcrypt";
import User from "@/app/models/User";
import { options } from "../auth/options";
import connectToDatabase from "@/app/lib/mongodb";

interface Props {
    username: string;
    password?: string;
    role?: string;
}

export async function PUT(req: Request) {
    const body = await req.json();
    const session = await getServerSession(options); 

    const { username, password, role } = body as Props;
    
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

    if(password){
        console.log("updating password");
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        await updateUser(username, hashedPassword);
    } 
    if(role){
        console.log("updating role");

        await updateUser(username, undefined, role);
    }   

    return new Response(`User added successfully`, {
        status: 201,
    });
}

const updateUser = async (username: string, password?: string, role?: string) => {  
    try {      
        const user = await User.findOne({username: username});
        if(!user){
            return;
        }
        if(role){
            user.role = role;
        }
        if(password){
            user.password = password;
        }
        await user.save();
    } catch (error: any) {
      console.error(`Couldn't update user`);
      throw new Error(error.message);
    }  
}