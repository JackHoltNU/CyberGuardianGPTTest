import { useState } from 'react';
import { sendMessageToChat } from '../pages/api/bot';
import { ChatResponses, MessageHistory } from '../types/types';

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
      const response: ChatResponses = await sendMessageToChat(updatedMessages, threadId);
      setThreadID(response.threadID);
      let latest = response.messages[response.messages.length - 1];

      setMessages(prev => [...prev, { sender: 'assistant', text: latest }]);
      setThreadID(response.threadID);

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

  return {
    messages,
    sendMessage,
    userTokens,
    botTokens,
    userCost,
    botCost
  };
};