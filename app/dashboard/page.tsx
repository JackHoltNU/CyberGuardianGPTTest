import { getServerSession } from "next-auth";
import { options } from "../api/auth/options";
import { redirect } from "next/navigation";

const Dashboard = async () => {
  const session = await getServerSession(options);

  if (!session) {
    redirect('api/auth/signin?callbackUrl=%2F')
  }

  return (
      <main className="flex flex-col w-screen h-screen items-center">
        {session && (
          <div>Test</div>
        )}
      </main>
  );
};

export default Dashboard;