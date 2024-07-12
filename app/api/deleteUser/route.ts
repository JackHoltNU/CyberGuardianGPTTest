import { getServerSession } from "next-auth";
import { options } from "../auth/options";
import User from "@/app/models/User";
import connectToDatabase from "@/app/lib/mongodb";

interface Props {
    user: string;
}

export async function PUT(req: Request) {
    const body = await req.json();
    const session = await getServerSession(options); 

    const { user } = body as Props;
    
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

    try {
        await deleteUser(user);
    } catch (error) {
        console.error("Couldn't delete user");
        return new Response("Could not delete user", {
            status: 500
        })
    } finally {
        return new Response("Deletion successful",{
            status: 200
        })
    }
}

const deleteUser = async (user: string) => {
    try {
        await User.deleteOne({username: user});        
      } catch (error: any) {
        console.error(error);
        throw new Error(error.message);
      }
}