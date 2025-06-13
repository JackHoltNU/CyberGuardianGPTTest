import { getServerSession } from "next-auth";
import { options } from "../api/auth/options";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import PromptBuilderChat from "./promptBuilderChat";

export default async function PromptBuilderPage() {
  const session = await getServerSession(options);

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PromptBuilderChat session={session} />
    </Suspense>
  );
}