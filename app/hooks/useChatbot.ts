import { useState } from 'react';
import OpenAI from "openai";
import { sendMessageToBot } from '../pages/api/bot';

interface ChatResponses {
    messages: string[];
}

export const useChatbot = () => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot', text: string | Promise<string> }>>([]);
  const [threadId, setThreadID] = useState<string | undefined>();
  const [userTokens, setUserTokens] = useState(0);
  const [userCost, setUserCost] = useState(0);
  const [botTokens, setBotTokens] = useState(0);
  const [botCost, setBotCost] = useState(0);


  const sendMessage = async (text: string) => {
    setMessages(prev => [...prev, { sender: 'user', text }]);
    console.log("sending message");
    try {
      const response = await sendMessageToBot(text, threadId);
      let latest = "";

      latest = response.messages[response.messages.length - 1];

      setMessages(prev => [...prev, { sender: 'bot', text: latest }]);
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