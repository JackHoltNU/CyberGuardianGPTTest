'use client'

import Image from "next/image";
import Chat from "./pages/chat";
import { useCallback, useState } from "react";
import LogIn from "./pages/login";

export default function Home() {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);

  const toggleChat = useCallback((state: boolean) => {
    setLoggedIn(state);
  },[])

  return (
    <main className="flex flex-col w-screen h-screen items-center">
      {loggedIn ? <Chat /> : <LogIn toggleDisplayChatCallback = {toggleChat} />}
    </main>
  );
}
