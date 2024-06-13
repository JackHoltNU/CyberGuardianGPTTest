import Chat from "./pages/chat";
import { useCallback, useState } from "react";
import LogIn from "./pages/login";
import { getServerSession } from "next-auth";
import { options } from "./api/auth/options";
import { redirect } from "next/navigation";



const Home = async () => {
  // const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const session = await getServerSession(options);

  if (!session) {
    redirect('api/auth/signin?callbackUrl=%2F')
  }

  // const toggleChat = useCallback((state: boolean) => {
  //   // setLoggedIn(state);
  // }, []);

  return (
      <main className="flex flex-col w-screen h-screen items-center">
        {session && <Chat />}
      </main>
  );
};

export default Home;
