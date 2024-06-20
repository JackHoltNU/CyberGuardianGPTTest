'use client'

import React, { useEffect, useState } from "react";
import { ChatInstance, MessageHistory } from "../types/types";
import { useChatbot } from "../context/useChatbot";
import { Session } from 'next-auth';

interface Props {
    session: Session;
}

const Sidebar = ({session}: Props) => {
    const { chatCollection, selectedChat, isNewChat, title, loadUserChats, openChat, setSelectedChat } = useChatbot();   
    const [chats, setChats] = useState<ChatInstance[]>([]);

    const changeChat = (chat: ChatInstance) => {
        setSelectedChat(chat.threadID);
        openChat(chat);
    }

    useEffect(() => {
        if(chatCollection){
            setChats(chatCollection.chats);
            console.log(chats);
        }
    },[chatCollection])
    

    useEffect(() => {if(chatCollection === undefined && session.user?.name) {
        loadUserChats();
    }},);

    return (
        <section className="flex-grow overflow-y-auto flex-col w-full h-2/5 md:w-1/5 md:h-dvh bg-blue-50 border-r-2 border-gray-400 items-center">
            <h1 className="w-full text-center mt-4 p-2 font-bold">Your Previous Chats</h1>
            <div className="w-11/12 my-4 h-content">
                <ul>
                    {isNewChat && (
                        (<li className={`mx-2 my-1 rounded-md p-2 hover:bg-blue-300 hover:cursor-pointer bg-blue-300`} key="newchat">
                            <button className="w-full">
                                <h3 className="text-sm text-left">New Chat</h3>
                            </button>
                        </li>)
                    )}
                    {chats.map((chat) => {
                        if(chat.title === undefined || chat.title == ""){
                            return null;
                        }
                        return (
                            <li className={`mx-2 my-1 rounded-md p-2 hover:bg-blue-300 hover:cursor-pointer ${chat.threadID === selectedChat && "bg-blue-300"}`} key={chat.threadID}>
                                <button className="w-full" onClick={() => changeChat(chat)}>
                                    <h3 className="text-sm text-left">{chat.title}</h3>
                                </button>
                            </li>
                        )
                    })}                    
                </ul>
            </div>
        </section>
    )
}

export default Sidebar;