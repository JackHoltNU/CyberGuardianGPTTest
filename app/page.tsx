import Image from "next/image";
import Chat from "./pages/chat";

export default function Home() {
  return (
    <main className="flex flex-col w-screen h-screen items-center">
      <Chat />
    </main>
  );
}
