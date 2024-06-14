import Chat from "./pages/chat";
import { getServerSession } from "next-auth";
import { options } from "./api/auth/options";
import { redirect } from "next/navigation";



const Home = async () => {
  const session = await getServerSession(options);

  console.log(`Name: ${session?.user?.name}`);

  if (!session) {
    redirect('api/auth/signin?callbackUrl=%2F')
  }

  return (
      <main className="flex flex-col w-screen h-screen items-center">
        {session && <Chat session={session}/>}
      </main>
  );
};

export default Home;
