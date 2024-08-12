import { getServerSession } from "next-auth";
import bcrypt from "bcrypt";
import User from "@/app/models/User";
import { options } from "../auth/options";

interface Props {
    username: string;
    password: string;
    role: string;
}

export async function POST(req: Request) {
    const body = await req.json();
    const session = await getServerSession(options); 

    const { username, password, role } = body as Props;
    
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

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await addUser(username, hashedPassword, role);

    return new Response(`User added successfully`, {
        status: 201,
    });
}

const addUser = async (username: string, password: string, role: string) => {  
    try {        
        await User.create({
            username,
            password,
            role
          });
    } catch (error: any) {
      console.error(`Couldn't add user to database`);
      throw new Error(error.message);
    }  
}