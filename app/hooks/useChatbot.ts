import { useState } from 'react';
import OpenAI from "openai";
import { sendMessageToBot } from '../pages/api/bot';

interface ChatResponses {
    messages: string[];
}

export const useChatbot = () => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot', text: string | Promise<string> }>>([]);
  const [threadId, setThreadID] = useState<string | undefined>();

  const sendMessage = async (text: string) => {
    setMessages(prev => [...prev, { sender: 'user', text }]);
    console.log("sending message");
    try {
      const response = await sendMessageToBot(text, threadId);
      let latest = "";

      latest = response.messages[response.messages.length - 1];

      setMessages(prev => [...prev, { sender: 'bot', text: latest }]);
      setThreadID(response.threadID);
         
    } catch (error) {
      console.error("Failed to send message:", error);
      // Handle error (e.g., show an error message)
    }
  };

  return {
    messages,
    sendMessage,
  };
};