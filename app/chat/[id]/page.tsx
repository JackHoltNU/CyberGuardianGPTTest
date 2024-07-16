import { options } from '@/app/api/auth/options';
import AdminSidebar from '@/app/components/adminSidebar';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import React from 'react'
import Chat from './chat';
 
export default async function Page({ params }: { params: { id: string } }) {
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
        <Chat threadID={params.id}/>
      </main>
    </div>
  </div>
  )
}