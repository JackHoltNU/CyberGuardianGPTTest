import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectToDatabase from "@/app/lib/mongodb";
import Users from "@/app/models/User";
import bcrypt from "bcrypt";

export const options: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: {
          label: "Username:",
          type: "text",
        },
        password: {
          label: "Password:",
          type: "password",
        },
      },
      authorize: async (credentials) => {
        await connectToDatabase();
        const user = await Users.findOne({ username: credentials?.username });

        if (
          user &&
          (await bcrypt.compare(
            credentials?.password as string,
            user?.password
          ))
        ) {
          return { id: user._id.toString(), name: user.username, role: user.role};
        } else {
          return null;
        }
      }, 
    }),
  ],
  callbacks: {
    jwt({token, user}){
        if(user){
            token.name = user.name;
            token.id = user.id;
            token.role = user.role;
        }        
        return token;
    },
    session({session, token}){
      session.user = {name: token.name, role: token.role};
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  jwt: {
    secret: process.env.JWT_SECRET,
  },
};
