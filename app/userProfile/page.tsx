import { getServerSession } from "next-auth";
import { options } from "../api/auth/options";
import { redirect } from "next/navigation";
import UserProfile from "./userProfile";

export default async function UserProfilePage() {
  const session = await getServerSession(options);

  if (!session) {
    redirect("/api/auth/signin");
  }

  return <UserProfile session={session} />;
}