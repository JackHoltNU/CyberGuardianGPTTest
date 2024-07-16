import { getServerSession } from "next-auth";
import { options } from "../api/auth/options";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import AdminSidebar from "../components/adminSidebar";
import { AdminProvider } from "../context/useAdmin";
import Chatlist from "./chatlist";
import Dash from "./dash";

const Dashboard = async () => {
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
        {/* Sidebar */}
        <AdminSidebar selected={0} />

        {/* Main content */}
        <main className="dashboard flex-grow overflow-y-auto">        
        <Dash />
{/*         
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-bold mb-4">Chart 1</h2>
              <div className="h-32 bg-gray-200">Chart content goes here</div>
            </div>


            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-bold mb-4">Chart 2</h2>
              <div className="h-32 bg-gray-200">Chart content goes here</div>
            </div>


            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-bold mb-4">Chart 3</h2>
              <div className="h-32 bg-gray-200">Chart content goes here</div>
            </div>

          </div> */}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;