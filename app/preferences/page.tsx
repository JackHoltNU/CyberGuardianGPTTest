import { getServerSession } from "next-auth";
import { options } from "../api/auth/options";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import PreferencesSetup from "../components/preferencesSetup";

function PreferencesPageContent({ session }: { session: any }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><div>Loading...</div></div>}>
      <PreferencesSetup session={session} />
    </Suspense>
  );
}

export default async function PreferencesPage() {
  const session = await getServerSession(options);

  if (!session) {
    redirect("/api/auth/signin");
  }

  return <PreferencesPageContent session={session} />;
}