import { useState } from 'react';
import OpenAI from "openai";
import { sendMessageToAssistant, sendMessageToChat } from '../pages/api/bot';

interface ChatResponses {
    messages: string[];
}

export type MessageHistory = {
  sender: 'system' | 'user' | 'assistant',
  text: string | Promise<string>
}

export const useChatbot = () => {
  const [messages, setMessages] = useState<Array<MessageHistory>>([]);
  const [threadId, setThreadID] = useState<string | undefined>();
  const [userTokens, setUserTokens] = useState(0);
  const [userCost, setUserCost] = useState(0);
  const [botTokens, setBotTokens] = useState(0);
  const [botCost, setBotCost] = useState(0);


  const sendMessage = async (text: string) => {
    const updatedMessages:MessageHistory[] = [...messages, { sender: 'user', text }];
    setMessages(prev => [...prev, { sender: 'user', text }]);
    console.log("sending message");
    try {
      // const response = await sendMessageToAssistant(text, threadId);

      const response = await sendMessageToChat(updatedMessages);
      let latest = "";

      latest = response.messages[response.messages.length - 1];

      setMessages(prev => [...prev, { sender: 'assistant', text: latest }]);
      setThreadID(response.threadID);
      if(response.userTokens){
        setUserTokens(response.userTokens);
        const userCost = (response.userTokens / 1000) * 0.0005;
        setUserCost(userCost);
      }
      if(response.botTokens){
        setBotTokens(response.botTokens);
        const botCost = (response.botTokens / 1000) * 0.0015;
        setBotCost(botCost);
      }
         
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return {
    messages,
    sendMessage,
    userTokens,
    botTokens,
    userCost,
    botCost
  };
};