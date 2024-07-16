'use client'

import MessageStatic from "@/app/components/messageStatic";
import { useAdmin } from "@/app/context/useAdmin";
import { MessageHistory } from "@/app/types/types";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

interface Props {
    threadID: string,
}

const Chat = ({ threadID }: Props) => {
    const { getThread } = useAdmin();
    const router = useRouter();
    const [messages, setMessages] = useState<Array<MessageHistory>>([]);

    useEffect(() => {
        loadThread();
    },[])

    const loadThread = async() => {
        const threadMessages = await getThread(threadID);
        setMessages(threadMessages);
    }
    
    return (
      <>
        <button onClick={() => router.push("/dashboard")}>Back</button>
        <div className="chat__messages" aria-live="polite">
          {messages.map((msg, index) => (
            <MessageStatic
              messageHistory={msg}
              key={msg.id !== "" ? msg.id : `Message${threadID}${index}`}
            />
          ))}
        </div>
      </>
    );

}

export default Chat;