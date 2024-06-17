'use client'

import React, { useEffect } from "react";
import { MessageHistory } from "../types/types";
import { useChatbot } from "../context/useChatbot";
import { Session } from 'next-auth';

interface Props {
    session: Session;
}

const Sidebar = ({session}: Props) => {
    const { chatCollection, loadUserChats, openChat } = useChatbot();    

    // useEffect(() => {
    //     if(session.user?.name){
    //       loadUserChats();
    //     }
    //   },[session])

    useEffect(() => {if(chatCollection === undefined && session.user?.name) {
        loadUserChats();
    }},);

    return (
        <section className="flex flex-col w-1/5 h-dvh bg-gray-200">
            <h1 className="w-full text-center mt-2">Chats</h1>
            <div className="w-4/5 ml-4 my-4 h-content">
                <ul>
                    {chatCollection && chatCollection.chats.map((chat) => {
                        if(chat.title === undefined || chat.title == ""){
                            return null;
                        }
                        return (
                            <li className="m-2 rounded-md p-2 bg-gray-100 hover:bg-gray-300 hover:cursor-pointer" key={chat.threadID}>
                                <button onClick={() => openChat(chat)}>
                                    <h3 className="text-sm">{chat.title}</h3>
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