import Chat from "./pages/chat";
import { getServerSession } from "next-auth";
import { options } from "./api/auth/options";
import { redirect } from "next/navigation";
import Sidebar from "./components/sidebar";

const Home = async () => {
  const session = await getServerSession(options);

  console.log(`Name: ${session?.user?.name}`);

  if (!session) {
    redirect('api/auth/signin?callbackUrl=%2F')
  }

  return (
      <main className="flex flex-col w-screen h-screen items-center">
        {session && (
          <div className = "flex flex-row w-full">
            <Sidebar session={session} />
            <Chat session={session}/>
          </div>
        )}
      </main>
  );
};

export default Home;
