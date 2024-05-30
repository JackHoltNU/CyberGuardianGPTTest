'use client'


import React, { useEffect, useRef, useState } from 'react';
import { useChatbot } from '../hooks/useChatbot';
import LoadingDots from '../components/loadingdots';


const Chat: React.FC = () => {
  const { messages, userTokens, botTokens, userCost, botCost, sendMessage } = useChatbot();
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessages = async () => {
    let sendText = inputText;
    setInputText("");
    setLoading(true);
    if (sendText.trim()) {      
      await sendMessage(sendText);  
      setLoading(false);    
    }
  };

  return (
    <div className="flex flex-col h-3/4 w-1/2 my-16">
      <header className="text-center p-4 ">CyberGuardian GPT</header>
      <p className="text-center p-3">{userTokens + botTokens} total tokens used (${userCost + botCost})</p>
      <div className="flex-grow overflow-y-auto p-4 space-y-2" ref={scrollRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`w-2/5 p-2 rounded-lg ${msg.sender === 'user' ? 'ml-auto bg-blue-500 text-white' : 'mr-auto bg-gray-200'}`}>
            {msg.text}
          </div>
        ))}
        {loading && (
          <div key={"loading"} className={`flex items-center justify-center w-2/5 px-2 py-4 rounded-lg mr-auto bg-gray-200`}>
            <LoadingDots />
        </div>
        )}
      </div>
      <div className="p-4 flex">
        <input
          type="text"
          className="flex-grow mr-4 p-2 border border-gray-300 rounded-lg"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if(e.key === 'Enter'){
              sendMessages();
            }
          }}
        />
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
          onClick={sendMessages}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;