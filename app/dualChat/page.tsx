// app/dualChat/page.tsx
import { options } from "@/app/api/auth/options";
import AdminSidebar from "@/app/components/adminSidebar";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import React from "react";
import DualChat from "../components/dualChat";
import { DualChatProvider } from "../context/useDualChat";

export default async function Page() {
  const session = await getServerSession(options);

  if (!session) {
    redirect("../api/auth/signin?callbackUrl=%2F");
  }

  if (session.user.role !== "admin") {
    redirect("../api/auth/signin?callbackUrl=%2F");
  }

  return (
    <DualChatProvider>
      <div className="flex flex-col w-screen h-screen items-center">
        <div className="flex flex-col-reverse md:flex-row w-full">
          {/* Sidebar */}
          <AdminSidebar selected={5} />

          {/* Main content */}
          <main className="dashboard flex-grow overflow-y-auto">
            <DualChat session={session} />
          </main>
        </div>
      </div>
    </DualChatProvider>
  );
}