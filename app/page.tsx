import Chat from "./pages/chat";
import { getServerSession } from "next-auth";
import { options } from "./api/auth/options";
import Sidebar from "./components/sidebar";
import User from "./models/User";
import ComparisonSidebar from "./components/comparisonSidebar";
import ComparisonChat from "./components/comparisonchat";

const Home = async () => {
  const session = await getServerSession(options);
  

  return (
      <div className="flex flex-col w-screen h-screen items-center">
        {session && (session.user.role == "user" || session.user.role == "admin") && (
          <div className = "flex flex-col-reverse md:flex-row w-full">
            <Sidebar session={session} />
            <Chat session={session}/>
          </div>
        )}
        {session && (session.user.role == "comparison") && (
          <div className = "flex flex-col-reverse md:flex-row w-full">
            <ComparisonSidebar session={session} />
            <ComparisonChat session={session}/>
          </div>
        )}
      </div>
  );
};

export default Home;
