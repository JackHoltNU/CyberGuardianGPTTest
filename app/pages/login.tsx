'use client'
import React, { useState } from "react"
import { useChatbot } from "../context/useChatbot";

interface Props {
    toggleDisplayChatCallback: (state: boolean) => void;
}

const LogIn = ({toggleDisplayChatCallback} :Props) => {
    const [username, setUsername] = useState("");
    const {setUser} = useChatbot();

    const logIn = () => {
        console.log(`Settings username to: ${username}`);
        setUser(username);
        toggleDisplayChatCallback(true);
    };

    return (
      <div className="flex flex-col h-dvh w-4/5">
        <header className="text-center p-2 mt-4 text-xl font-bold">
          CyberGuardian GPT
        </header>
        <div className="flex flex-col h-full justify-center">
          <div className="p-4 md:p-8 flex w-full items-center justify-center">
            <label htmlFor="chat-input">Participant Number</label>
            <input
              type="text"
              className="w-2/5 mx-4 p-2 border border-gray-300 rounded-lg"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  logIn();
                }
              }}
            />
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
              onClick={() => logIn()}
            >
              Set
            </button>
          </div>
        </div>
      </div>
    );

}

export default LogIn