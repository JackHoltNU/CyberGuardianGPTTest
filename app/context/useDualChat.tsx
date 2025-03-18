// app/context/useDualChat.tsx
"use client";

import React from "react";
import { ReactNode, createContext, useContext, useState } from "react";
import {
  AIConfigType,
  ChatCollection,
  ChatInstance,
  ChatResponses,
  MessageHistory,
  MessageRating,
} from "../types/types";
import { signOut } from "next-auth/react";

interface DualChatContextType {
  leftThreadId: string | undefined;
  rightThreadId: string | undefined;
  dualChatID: string | undefined;
  leftMessages: Array<MessageHistory>;
  rightMessages: Array<MessageHistory>;
  leftTitle: string;
  rightTitle: string;
  leftConfig: AIConfigType | undefined;
  rightConfig: AIConfigType | undefined;
  sendLeftMessage: (text: string) => Promise<void>;
  sendRightMessage: (text: string) => Promise<void>;
  user?: string;
  setUser: (user: string) => void;
  showError: boolean;
  setShowError: (bool: boolean) => void;
  loadDualChat: (dualChatID: string) => Promise<void>;
  resetDualChat: () => void;
  setLeftConfig: (config: AIConfigType) => void;
  setRightConfig: (config: AIConfigType) => void;
  isRandomized: boolean;
  setIsRandomized: (value: boolean) => void;
  configA: AIConfigType | undefined;
  configB: AIConfigType | undefined;
  availableConfigs: AIConfigType[];
  loadAllConfigs: () => Promise<void>;
  createNewDualChat: (configA: AIConfigType, configB: AIConfigType, randomize: boolean) => void;
}

const DualChatContext = createContext<DualChatContextType | undefined>(undefined);

interface DualChatProviderProps {
  children: ReactNode;
}

export const DualChatProvider = ({ children }: DualChatProviderProps) => {
  const [leftMessages, setLeftMessages] = useState<Array<MessageHistory>>([]);
  const [rightMessages, setRightMessages] = useState<Array<MessageHistory>>([]);
  const [leftThreadId, setLeftThreadId] = useState<string | undefined>();
  const [rightThreadId, setRightThreadId] = useState<string | undefined>();
  const [dualChatID, setDualChatID] = useState<string | undefined>();
  const [leftTitle, setLeftTitle] = useState<string>("Chat A");
  const [rightTitle, setRightTitle] = useState<string>("Chat B");
  const [leftConfig, setLeftConfig] = useState<AIConfigType>();
  const [rightConfig, setRightConfig] = useState<AIConfigType>();
  const [user, setUser] = useState<string>();
  const [showError, setShowError] = useState(false);
  const [isRandomized, setIsRandomized] = useState(false);
  const [configA, setConfigA] = useState<AIConfigType>();
  const [configB, setConfigB] = useState<AIConfigType>();
  const [availableConfigs, setAvailableConfigs] = useState<AIConfigType[]>([]);

  const loadAllConfigs = async () => {
    try {
      const response = await fetch("/api/getAIConfigs", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error loading configs: ${response.statusText}`);
      }
      
      const data = await response.json();
      setAvailableConfigs(data.configs);
      return data.configs;
    } catch (error) {
      console.error("Failed to load configs:", error);
      setShowError(true);
      return [];
    }
  };

  const createNewDualChat = (configA: AIConfigType, configB: AIConfigType, randomize: boolean) => {
    setConfigA(configA);
    setConfigB(configB);
    setIsRandomized(randomize);
    
    // Generate a new dualChatID
    const newDualChatID = crypto.randomUUID();
    setDualChatID(newDualChatID);
    
    // Reset the messages
    setLeftMessages([]);
    setRightMessages([]);
    
    // Reset thread IDs
    setLeftThreadId(undefined);
    setRightThreadId(undefined);
    
    // Assign configurations based on randomization
    if (randomize) {
      // Randomly decide which config goes where
      if (Math.random() > 0.5) {
        setLeftConfig(configA);
        setRightConfig(configB);
      } else {
        setLeftConfig(configB);
        setRightConfig(configA);
      }
    } else {
      // Fixed assignment
      setLeftConfig(configA);
      setRightConfig(configB);
    }
    
    // Reset titles
    setLeftTitle("Chat A");
    setRightTitle("Chat B");
  };

  const loadDualChat = async (chatDualID: string) => {
    if (!user) return;
    
    try {
      const response = await fetch("/api/loadDualChats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          user, 
          dualChatID: chatDualID 
        }),
      });
      
      if (!response.ok) {
        await handleResponseError(response);
        return;
      }
      
      const collection: ChatCollection = await response.json();
      if (!collection.chats || collection.chats.length !== 2) {
        throw new Error("Expected exactly two chats for dual chat");
      }
      
      // Get the correct configs for the chats
      await loadAllConfigs();
      
      // Set the dualChatID
      setDualChatID(chatDualID);
      
      // Process each chat
      for (const chat of collection.chats) {
        const configName = chat.configName;
        if (!configName) continue;
        
        // Find the config from availableConfigs
        const config = availableConfigs.find(c => c.name === configName);
        if (!config) continue;
        
        // Determine which side this chat belongs to
        if (!leftThreadId) {
          setLeftThreadId(chat.threadID);
          setLeftMessages(chat.messages);
          setLeftConfig(config);
          setLeftTitle(chat.title);
        } else {
          setRightThreadId(chat.threadID);
          setRightMessages(chat.messages);
          setRightConfig(config);
          setRightTitle(chat.title);
        }
      }
    } catch (error) {
      console.error("Failed to load dual chat:", error);
      setShowError(true);
    }
  };

  const resetDualChat = () => {
    setLeftMessages([]);
    setRightMessages([]);
    setLeftThreadId(undefined);
    setRightThreadId(undefined);
    setDualChatID(undefined);
    setLeftTitle("Chat A");
    setRightTitle("Chat B");
    setLeftConfig(undefined);
    setRightConfig(undefined);
    setIsRandomized(false);
    setConfigA(undefined);
    setConfigB(undefined);
  };

  const sendLeftMessage = async (text: string) => {
    if (!leftConfig) {
      setShowError(true);
      return;
    }
    
    await sendMessageToChat(text, leftConfig, leftMessages, setLeftMessages, leftThreadId, setLeftThreadId, setLeftTitle);
  };

  const sendRightMessage = async (text: string) => {
    if (!rightConfig) {
      setShowError(true);
      return;
    }
    
    await sendMessageToChat(text, rightConfig, rightMessages, setRightMessages, rightThreadId, setRightThreadId, setRightTitle);
  };

  const sendMessageToChat = async (
    text: string,
    config: AIConfigType,
    messages: MessageHistory[],
    setMessages: React.Dispatch<React.SetStateAction<MessageHistory[]>>,
    threadId: string | undefined,
    setThreadId: React.Dispatch<React.SetStateAction<string | undefined>>,
    setTitle: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const newID = crypto.randomUUID();
    const updatedMessages: MessageHistory[] = [
      ...messages,
      { sender: "user", text, id: newID },
    ];
    
    setMessages((prev) => [...prev, { sender: "user", text, id: newID }]);
    
    if (user === undefined) {
      return;
    }

    let response;
    try {
      const responseString = await fetch("/api/sendMessageWithConfig", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageHistory: updatedMessages,
          user: user,
          threadID: threadId,
          dualChatID: dualChatID,
          configName: config.name,
          saveUserMsgToDB: true,
          saveResponseToDB: true
        }),
      });
      
      if (!responseString.ok) {
        await handleResponseError(responseString);
      }
      
      response = await responseString.json();
    } catch (error: any) {
      console.error("Failed to send message:", error);
      setShowError(true);
      return;
    }

    setThreadId(response.threadID);
    let latest = response.message;

    setMessages((prev) => [
      ...prev,
      { id: response.id, sender: "assistant", text: latest },
    ]);
    
    if (response.title && response.title !== "") {
      setTitle(response.title);
    }
  };

  const handleResponseError = async (response: Response) => {
    if (response.status === 401) {
      await signOut();
    }
  };

  return (
    <DualChatContext.Provider
      value={{
        leftThreadId,
        rightThreadId,
        dualChatID,
        leftMessages,
        rightMessages,
        leftTitle,
        rightTitle,
        leftConfig,
        rightConfig,
        sendLeftMessage,
        sendRightMessage,
        user,
        setUser,
        showError,
        setShowError,
        loadDualChat,
        resetDualChat,
        setLeftConfig,
        setRightConfig,
        isRandomized,
        setIsRandomized,
        configA,
        configB,
        availableConfigs,
        loadAllConfigs,
        createNewDualChat,
      }}
    >
      {children}
    </DualChatContext.Provider>
  );
};

export const useDualChat = () => {
  const context = useContext(DualChatContext);
  if (context === undefined) {
    throw new Error("useDualChat must be used within a DualChatProvider");
  }
  return context;
};