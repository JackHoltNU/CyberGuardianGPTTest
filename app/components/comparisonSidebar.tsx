'use client'

import React, { useEffect, useState } from "react";
import { ChatInstance, ComparisonInstance, ComparisonThread, MessageHistory } from "../types/types";
import { useChatbot } from "../context/useChatbot";
import { Session } from 'next-auth';
import { useComparisonChatbot } from "../context/useComparisonChatbot";

interface Props {
    session: Session;
}

const Sidebar = ({session}: Props) => {
    const { comparisonCollection, selectedChat, isNewChat, loadUserChats, openChat, setSelectedChat, resetChat } = useComparisonChatbot();   
  
    
    const [chats, setChats] = useState<ComparisonThread[]>([]);

    const changeChat = (chat: ComparisonThread) => {        
        setSelectedChat(chat.comparisons[0].version1.threadID);
        openChat(chat);
    }

    useEffect(() => {
        if(comparisonCollection){
            setChats(comparisonCollection.threads);
        }
    },[comparisonCollection])
    

    useEffect(() => {if(comparisonCollection === undefined && session.user?.name) {
        loadUserChats();
    }},);

    const formatDate = (date: Date | string): string => {
        const dateObj = new Date(date);
        const nowObj = new Date();
        const yesterdayObj = new Date();
        yesterdayObj.setDate(nowObj.getDate() - 1);

        const isSameDay = (d1: Date, d2: Date): boolean => 
        d1.getDate() === d2.getDate() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getFullYear() === d2.getFullYear();

        let formattedDate = "";
        // if today, show as today, time
        // else if yesterday, show yesterday, time
        // else show date, time
        if(isSameDay(dateObj, nowObj)){
            formattedDate = `Today, ${dateObj.toLocaleTimeString()}`;
        } else if(isSameDay(dateObj, yesterdayObj)){
            formattedDate = `Yesterday, ${dateObj.toLocaleTimeString()}`;
        } else {
            formattedDate = `${dateObj.toDateString()},${dateObj.toLocaleTimeString()}`;
        }

        return formattedDate
    }

    return (
        <section className="sidebar">
            <h1 className="sidebar__title">Your Conversations</h1>
            <div className="sidebar__items">
                <ul>
                    {isNewChat ? (
                        <li className={'item item--selected'} key="newchat">
                            <button className="item__button">
                                <h3 className="conversation__title">New Chat</h3>
                            </button>
                        </li>
                    ) : (
                        <li className="item">
                            <button className="item__button">
                                <h3 className="conversation__title" onClick={() => resetChat()}>Start New Chat</h3>
                            </button>
                        </li>
                    )}
                    {chats.map((chat) => {                        
                        if(chat){
                            const lastItem = chat.comparisons[chat.comparisons.length - 1];
                            // console.log(lastItem.version1);
                        let lastSelected = lastItem.version1;
                        if(lastItem.version2 && lastItem.version2.selected){
                            lastSelected = lastItem.version2;
                        }
                        if(lastItem.version1.title === undefined || lastItem.version1.title == ""){
                            return null;
                        }
                        return (
                            <li className={`item ${lastSelected.threadID === selectedChat && "item--selected"}`} key={lastSelected.threadID}>
                                <button className="item__button" onClick={() => changeChat(chat)}>
                                    <h3 className="conversation__title">{lastSelected.title}</h3>
                                    { lastSelected.timestamp && (<p className="conversation__timestamp">Latest: {formatDate(lastSelected.timestamp)}</p>)}
                                </button>
                            </li>
                        )
                        }
                        
                    })}                    
                </ul>
            </div>
        </section>
    )
}

export default Sidebar;