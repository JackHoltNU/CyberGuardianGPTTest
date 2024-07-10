import { getServerSession } from "next-auth";
import { options } from "../api/auth/options";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import AdminSidebar from "../components/adminSidebar";

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
        <main className="dashboard">
          Manage users content to go here
        </main>
      </div>
    </div>
  );
};

export default ManageUsers;