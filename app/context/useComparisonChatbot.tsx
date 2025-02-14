"use client";

import React, { useEffect } from "react";
import { ReactNode, createContext, useContext, useState } from "react";
import {
  AIConfigType,
  ChatCollection,
  ChatInstance,
  ChatResponses,
  Comparison,
  ComparisonChatCollection,
  ComparisonInstance,
  ComparisonThread,
  MessageHistory,
  MessageRating,
} from "../types/types";
import { debounce } from "../utils/debounce";
import { signOut } from "next-auth/react";
import { timeStamp } from "console";

interface ComparisonChatbotContextType {
  threadId: string | undefined;
  comparisonMessages: Array<MessageHistory>;
  comparisonCollection: ComparisonChatCollection | undefined;
  title: string;
  setTitle: (title: string) => void;
  sendMessageComparison: (
    text: string,
    config: AIConfigType
  ) => Promise<Comparison | undefined>;
  user?: string;
  setUser: (user: string) => void;
  loadUserChats: () => void;
  showError: boolean;
  setShowError: (bool: boolean) => void;
  openChat: (chat: ComparisonThread) => void;
  resetChat: () => void;
  resetComparisonChat: () => void;
  deleteChat: () => void;
  submitFeedback: (messageId: string, text: string) => void;
  submitVote: (messageId: string, upvote: boolean, downvote: boolean) => void;
  selectedChat: string | undefined;
  setSelectedChat: (chat: string) => void;
  isNewChat: boolean;
  setIsNewChat: (newState: boolean) => void;
  setComparisonMessages: (newMessageHistory: Array<MessageHistory>) => void;
  saveComparisonToDB: (messages: Comparison) => void;
  userTokens: number;
  botTokens: number;
  userCost: number;
  botCost: number;
}

const ComparisonChatbotContext = createContext<ComparisonChatbotContextType | undefined>(undefined);

interface ComparisonChatbotProviderProps {
  children: ReactNode;
}

export const ComparisonChatbotProvider = ({ children }: ComparisonChatbotProviderProps) => {
  const [comparisonMessages, setComparisonMessages] = useState<Array<MessageHistory>>([]);
  const [comparisonCollection, setComparisonCollection] = useState<ComparisonChatCollection>();
  const [threadId, setThreadId] = useState<string | undefined>();
  const [chatCollection, setChatCollection] = useState<ChatCollection>();
  const [title, setTitle] = useState<string>("New Chat");
  const [user, setUser] = useState<string>();
  const [userTokens, setUserTokens] = useState(0);
  const [userCost, setUserCost] = useState(0);
  const [botTokens, setBotTokens] = useState(0);
  const [botCost, setBotCost] = useState(0);
  const [selectedChat, setSelectedChat] = useState<string>();
  const [isNewChat, setIsNewChat] = useState<boolean>(true);
  const [showError, setShowError] = useState(false);

  const loadUserChats = debounce(async () => {
    if (user) {
      const responseString = await fetch("/api/loadComparisonChats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user: user }),
      });
      const response: ComparisonChatCollection = await responseString.json();
      console.log(response);
      const sortedResponse = await sortChatCollectionByDate(response);
      setComparisonCollection(sortedResponse);
    }
  }, 200);

  const sortChatCollectionByDate = (
    collection: ComparisonChatCollection
  ): ComparisonChatCollection => {
    const sortedChats = collection.threads.sort((a, b) => {
      if (a.comparisons && b.comparisons) {
        const latestA = a.comparisons[a.comparisons.length - 1];
        const latestB = b.comparisons[b.comparisons.length - 1];

        if (latestA?.version1.timestamp && latestB?.version1.timestamp) {
          if (latestA.version1.timestamp > latestB.version1.timestamp) {
            return -1;
          } else {
            return 1;
          }
        }
        return 0;
      }
      return 0;
    });
    return { threads: sortedChats };
  };

  const openChat = (chat: ComparisonThread) => {
    const messageHistory: MessageHistory[] = chat.comparisons.map((comparison) => {
      return getMessageHistoryFromComparison(comparison);
    })
    setComparisonMessages(messageHistory);
    setThreadId(chat.comparisons[0].version1.threadID);
    setTitle(chat.comparisons[chat.comparisons.length - 1].version1.threadID);
    setIsNewChat(false);
    setShowError(false);
    loadUserChats();
  };

  const getMessageHistoryFromComparison = ((comparison: Comparison) => {
    let messageThread:MessageHistory;
    
      if(!comparison.version2 || comparison.version1.selected){
        messageThread = {
          sender: comparison.version1.sender,
          text: comparison.version1.text,
          timestamp: comparison.version1.timestamp,
        }
      } else {
        messageThread = {
          sender: comparison.version2.sender,
          text: comparison.version2.text,
          timestamp: comparison.version2.timestamp,
        }
      }      
    return messageThread;
  })

  const resetChat = () => {
    setComparisonMessages([]);
    setComparisonMessages([]);
    setThreadId(undefined);
    setTitle("New Chat");
    setSelectedChat(undefined);
    setIsNewChat(true);
    setShowError(false);
    loadUserChats();
  };

  const resetComparisonChat = () => {
    setComparisonMessages([]);
  }

  useEffect(() => {
    renameChat(threadId, title);
  }, [title]);

  const renameChat = (threadID: string | undefined, newTitle: string) => {
    if (chatCollection) {
      setChatCollection({
        chats: [
          ...chatCollection.chats.map((chat) => {
            if (chat.threadID == threadID) {
              chat.title = newTitle;
            }
            return chat;
          }),
        ],
      });
    }
  };

  const deleteChat = async () => {
    try {
      const response = await fetch("/api/deleteComparisonChat", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user: user, threadID: threadId }),
      });

      if (!response.ok) {
        await handleResponseError(response);
      }
    } catch (error: any) {
      console.error(`Could not delete chat`);
      throw new Error(error.message);
    }

    resetChat();
  };  

  const sendMessageComparison = async (text: string, config: AIConfigType) => {
    const newID = crypto.randomUUID();
    const timestamp = new Date(Date.now());
    const updatedMessages: MessageHistory[] = [
      ...comparisonMessages,
      { sender: "user", text, id: newID },
    ];
    setComparisonMessages((prev) => [...prev, { sender: "user", text, id: newID }]);
    

    if (user === undefined) {
      return;
    }

    let response1: ChatResponses;
    let response2: ChatResponses;
    const config1: AIConfigType = {
      primary: config.primary,
      mainPrompt: config.mainPrompt,
      formatPrompt: config.formatPrompt,
    };
    const config2: AIConfigType = {
      primary: config.primary,
      mainPrompt: "",
      formatPrompt: config.formatPrompt,
    };

    try {
      const responseString = await fetch("/api/sendMessageToChat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageHistory: updatedMessages,
          user: user,
          threadID: threadId,
          model: config1.primary,
          mainPrompt: config1.mainPrompt,
          formatPrompt: config1.formatPrompt,
          saveUserMsgToDB: false,
          saveResponseToDB: false
        }),
      });
      if (!responseString.ok) {
        await handleResponseError(responseString);
      }
      response1 = await responseString.json();
      console.log(`Response 1: ${response1}`);
      
      setThreadId(response1.threadID);
      
    } catch (error: any) {
      console.error("Failed to send message:", error);
      throw new Error(`Failed to send message to chat ${error.message}`);
    }

    try {
      const responseString = await fetch("/api/sendMessageToChat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageHistory: updatedMessages,
          user: user,
          threadID: response1.threadID,
          model: config2.primary,
          mainPrompt: config2.mainPrompt,
          formatPrompt: config2.formatPrompt,
          saveUserMsgToDB: false,
          saveResponseToDB: false
        }),
      });
      if (!responseString.ok) {
        await handleResponseError(responseString);
      }
      response2 = await responseString.json();
    } catch (error: any) {
      console.error("Failed to send message:", error);
      throw new Error(`Failed to send message to chat ${error.message}`);
    }

    const version1: ComparisonInstance = {
      threadID: response1.threadID ?? "test",
      title: response1.title,
      sender: "assistant",
      id: response1.id,
      text: response1.message,
      timestamp: new Date(Date.now()),
      config: config1,
    };
    const version2: ComparisonInstance = {
      threadID: response1.threadID ?? "test",
      title: response2.title,
      sender: "assistant",
      id: response2.id,
      text: response2.message,
      timestamp: new Date(Date.now()),
      config: config2,
    };

    const comparison: Comparison = {
      version1,
      version2,
    };

    const userComparisonInstance: ComparisonInstance = {
      id: newID,
      threadID: response1.threadID ?? "test",
      title,
      text,
      timestamp,
      sender: "user"
    }
    const userComparison: Comparison = {
      version1: userComparisonInstance
    }
    await saveComparisonToDB(userComparison);
    
    return comparison;
  };

  const saveComparisonToDB = async(messages: Comparison) => {
    try{
      console.log(messages.version1.sender);
      await fetch("/api/saveComparisonToDB", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: messages,
          user: user,
          threadID: messages.version1.threadID,
          timeStamp: messages.version1.timestamp         
        }),
    });    
  } catch (error){
    console.error("Couldn't save comparison to database");
  }
  loadUserChats();
}

  const handleResponseError = async (response: Response) => {
    if (response.status === 401) {
      await signOut();
    }
  };

  const submitFeedback = async (messageId: string, text: string) => {
    try {
      const response = await fetch("/api/addFeedbackMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user, threadId, messageId, comment: text }),
      });
      if (!response.ok) {
        await handleResponseError(response);
      }
    } catch (error) {
      console.error("Couldn't update feedback comments");
    }
  };

  const submitVote = async (
    messageId: string,
    upvote: boolean,
    downvote: boolean
  ) => {
    try {
      const response = await fetch("/api/toggleVoteOnMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user, threadId, messageId, upvote, downvote }),
      });
      if (!response.ok) {
        await handleResponseError(response);
      }
    } catch (error) {
      console.error("Couldn't update vote status for message");
    }
  };

  return (
    <ComparisonChatbotContext.Provider
      value={{
        threadId,        
        comparisonMessages,
        title,
        setTitle,        
        sendMessageComparison,
        setComparisonMessages,
        user,
        setUser,
        loadUserChats,
        comparisonCollection,
        showError,
        setShowError,
        openChat,
        resetChat,
        resetComparisonChat,
        deleteChat,
        submitFeedback,
        submitVote,
        selectedChat,
        setSelectedChat,
        isNewChat,
        setIsNewChat,
        saveComparisonToDB,
        userTokens,
        botTokens,
        userCost,
        botCost,
      }}
    >
      {children}
    </ComparisonChatbotContext.Provider>
  );
};

export const useComparisonChatbot = () => {
  const context = useContext(ComparisonChatbotContext);
  if (context === undefined) {
    throw new Error("useComparisonChatbot must be used within a ComparisonChatbotProvider");
  }
  return context;
};
