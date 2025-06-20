import React from "react";
import { getServerSession } from "next-auth";
import { options } from "../../api/auth/options";
import { redirect } from "next/navigation";
import AdminSidebar from "../../components/adminSidebar";
import SurveyForm from "./surveyForm";

interface Props {
  params: { id: string };
}

const SurveyFormPage = async ({ params }: Props) => {
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
        <AdminSidebar selected={7} />

        {/* Main content */}
        <SurveyForm surveyId={params.id} />
      </div>
    </div>
  );
};

export default SurveyFormPage;