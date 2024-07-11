import React from "react";
import { getServerSession } from "next-auth";
import { options } from "../api/auth/options";
import { redirect } from "next/navigation";
import AdminSidebar from "../components/adminSidebar";
import { useAdmin } from "../context/useAdmin";
import Users from "./users";

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
        {/* Sidebar */}
        <AdminSidebar selected={1} />

        {/* Main content */}
        <Users />
      </div>
    </div>
  );
};

export default ManageUsers;