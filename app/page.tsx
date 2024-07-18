import Chat from "./pages/chat";
import { getServerSession } from "next-auth";
import { options } from "./api/auth/options";
import Sidebar from "./components/sidebar";

const Home = async () => {
  const session = await getServerSession(options);

  return (
      <div className="flex flex-col w-screen h-screen items-center">
        {session && (
          <div className = "flex flex-col-reverse md:flex-row w-full">
            <Sidebar session={session} />
            <Chat session={session}/>
          </div>
        )}
      </div>
  );
};

export default Home;
