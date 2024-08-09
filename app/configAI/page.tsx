import React from "react";
import { getServerSession } from "next-auth";
import { options } from "../api/auth/options";
import { redirect } from "next/navigation";
import AdminSidebar from "../components/adminSidebar";
import ConfigAI from "./configAI";

const ManageUsers = async () => {
  const session = await getServerSession(options);

  if (!session) {
    redirect('api/auth/signin?callbackUrl=%2F');
  }

  if(session.user.role !== "admin"){
    redirect('api/auth/signin?callbackUrl=%2F');
  }

  return (
    <div className="flex flex-col w-screen h-screen items-center">
      <div className="flex flex-col-reverse md:flex-row w-full">      
        <AdminSidebar selected={2} />       
        <main className="dashboard flex-grow overflow-y-auto">    
            <ConfigAI />
        </main> 
      </div>
    </div>
  );
};

export default ManageUsers;