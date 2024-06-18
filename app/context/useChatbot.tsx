'use client'

import React from 'react';
import { ReactNode, createContext, useContext, useState } from 'react';
import { loadChats, sendMessageToChat } from '../api/bot';
import { ChatCollection, ChatInstance, ChatResponses, MessageHistory } from '../types/types';
import { debounce } from '../utils/debounce';

interface ChatbotContextType {
  messages: Array<MessageHistory>;
  title: string;
  sendMessage: (text: string) => Promise<void>;
  user?: string;
  setUser: (user: string) => void;
  loadUserChats: () => void;
  chatCollection: ChatCollection | undefined;
  openChat: (chat:ChatInstance) => void;
  resetChat: () => void;
  selectedChat: string | undefined;
  setSelectedChat: (chat: string) => void;
  isNewChat: boolean;
  setIsNewChat: (newState: boolean) => void;
  userTokens: number;
  botTokens: number;
  userCost: number;
  botCost: number;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

interface ChatbotProviderProps {
  children: ReactNode;
}

export const ChatbotProvider = ({ children }:ChatbotProviderProps) => {
  const [messages, setMessages] = useState<Array<MessageHistory>>([]);
  const [threadId, setThreadID] = useState<string | undefined>();
  const [chatCollection, setChatCollection] = useState<ChatCollection>();
  const [title, setTitle] = useState<string>("");
  const [user, setUser] = useState<string>();
  const [userTokens, setUserTokens] = useState(0);
  const [userCost, setUserCost] = useState(0);
  const [botTokens, setBotTokens] = useState(0);
  const [botCost, setBotCost] = useState(0);
  const [selectedChat, setSelectedChat] = useState<string>();
  const [isNewChat, setIsNewChat] = useState<boolean>(true);

  const loadUserChats = debounce(async () => {
    console.log(`loadUserChats run`);
    if(user){
      const chats:ChatCollection = await loadChats(user);
      setChatCollection(chats);
    }
  },200);

  const openChat = (chat:ChatInstance) => {
    setMessages(chat.messages);
    setThreadID(chat.threadID);
    setTitle(chat.title);
    setIsNewChat(false);
    loadUserChats();
  }

  const resetChat = () => {
    setMessages([]);
    setThreadID(undefined);
    setTitle("New Chat");
    setSelectedChat(undefined);
    setIsNewChat(true);
    loadUserChats(); 
  }

  const sendMessage = async (text: string) => {
    const updatedMessages:MessageHistory[] = [...messages, { sender: 'user', text }];
    setMessages(prev => [...prev, { sender: 'user', text }]);
    console.log("sending message");
    console.log(`User: ${user}`);
    if(user === undefined){
      return;
    }
    try {
      const response: ChatResponses = await sendMessageToChat(updatedMessages, user, threadId);
      setThreadID(response.threadID);
      let latest = response.messages[response.messages.length - 1];

      setMessages(prev => [...prev, { sender: 'assistant', text: latest }]);
      setThreadID(response.threadID);
      setTitle(response.title);
      setIsNewChat(false);

      if(response.userTokens !== undefined){
        setUserTokens(response.userTokens);
        const userCost = (response.userTokens / 1000) * 0.0005;
        setUserCost(parseFloat(userCost.toFixed(4)));
      }
      if(response.botTokens){
        setBotTokens(response.botTokens);
        const botCost = (response.botTokens / 1000) * 0.0015;
        setBotCost(parseFloat(botCost.toFixed(4)));
      }
         
    } catch (error:any) {
      console.error("Failed to send message:", error);
      throw new Error(`Failed to send message to chat ${error.message}`)
    }
  };

  return (
    <ChatbotContext.Provider value={{
        messages,
        title,
        sendMessage,
        user,
        setUser,
        loadUserChats,
        chatCollection,
        openChat,
        resetChat,
        selectedChat,
        setSelectedChat,
        isNewChat,
        setIsNewChat,
        userTokens,
        botTokens,
        userCost,
        botCost,
      }}>
      {children}
    </ChatbotContext.Provider>
  );
};

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
}