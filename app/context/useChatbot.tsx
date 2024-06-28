'use client'

import React, { useEffect } from 'react';
import { ReactNode, createContext, useContext, useState } from 'react';
import { ChatCollection, ChatInstance, ChatResponses, MessageHistory, MessageRating } from '../types/types';
import { debounce } from '../utils/debounce';

interface ChatbotContextType {
  threadId: string | undefined,
  messages: Array<MessageHistory>;
  title: string;
  sendMessage: (text: string) => Promise<void>;
  user?: string;
  setUser: (user: string) => void;
  loadUserChats: () => void;
  chatCollection: ChatCollection | undefined;
  openChat: (chat:ChatInstance) => void;
  resetChat: () => void;
  deleteChat: () => void;
  submitFeedback: (messageId: string, text: string) => void;
  submitVote: (messageId: string, upvote: boolean, downvote: boolean) => void;
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
    if(user){
      const responseString = await fetch('/api/loadChats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({user: user}),
      });
      const response: ChatCollection = await responseString.json();
      const sortedResponse = await sortChatCollectionByDate(response);
      setChatCollection(sortedResponse);
      // renameChat(threadId, title);
    }
  },200);

  const sortChatCollectionByDate = (collection: ChatCollection): ChatCollection => {
    const sortedChats = collection.chats.sort((a, b) => {
      if(a.messages && b.messages){
        const latestA = a.messages[a.messages.length - 1];
        const latestB = b.messages[b.messages.length - 1];

        if(latestA.timestamp && latestB.timestamp){
          if(latestA.timestamp > latestB.timestamp){
            return -1;
          } else {
            return 1;
          }
        }
        return 0;
      }
      return 0;      
    })
    return { chats: sortedChats }
  }

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

  useEffect(() => {
    renameChat(threadId, title);
  },[title]);

  const renameChat = (threadID: string | undefined, newTitle: string) => {
    if(chatCollection){
      setChatCollection({chats: [...chatCollection.chats.map((chat) => {
        if(chat.threadID == threadID){
          chat.title = newTitle;
        }
        return chat
      })]});
    }
  }

  const deleteChat = async () => {
    // TODO are you sure modal
    try {
      await fetch('/api/deleteChat', {
        method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({user: user, threadID: threadId}),
      })
    } catch (error: any) {
      console.error(`Could not delete chat`);
      throw new Error(error.message);
    }
    
    // TODO message deleted alert

    resetChat()
  }

  const sendMessage = async (text: string) => {
    
    const updatedMessages:MessageHistory[] = [...messages, { sender: 'user', text, id: crypto.randomUUID()}];
    setMessages(prev => [...prev, { sender: 'user', text }]);
    if(user === undefined){
      return;
    }

    let response: ChatResponses;
    try {
      // const response: ChatResponses = await sendMessageToChat(updatedMessages, user, threadId);
      const responseString = await fetch('/api/sendMessageToChat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({messageHistory: updatedMessages, user: user, threadID: threadId}),
      });
      response = await responseString.json();

    } catch (error:any) {
        console.error("Failed to send message:", error);
        throw new Error(`Failed to send message to chat ${error.message}`)
      }
    
      
      setThreadID(response.threadID);
      let latest = response.message;

      setMessages(prev => [...prev, { id: response.id, sender: 'assistant', text: latest }]);
      setThreadID(response.threadID);
      if(response.title != ""){
        setTitle(response.title);
      }
      setIsNewChat(false);
      setSelectedChat(threadId);
      loadUserChats();

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
  };

  const submitFeedback = async (messageId: string, text: string) => {
    try {
      console.log(`Submitting: ${text}`);
      await fetch('/api/addFeedbackMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user, threadId, messageId, comment: text }),
      });
    } catch (error) {
      console.error("Couldn't update feedback comments");
    }
  }

  const submitVote = async (messageId: string, upvote: boolean, downvote: boolean) => {
    try {
      await fetch('/api/toggleVoteOnMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user, threadId, messageId, upvote, downvote }),
      });
    } catch (error) {
      console.error("Couldn't update vote status for message");
    }
    
  }

  return (
    <ChatbotContext.Provider value={{
        threadId,
        messages,
        title,
        sendMessage,
        user,
        setUser,
        loadUserChats,
        chatCollection,
        openChat,
        resetChat,
        deleteChat,
        submitFeedback,
        submitVote,
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