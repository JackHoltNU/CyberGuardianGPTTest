'use client'


import React, { useEffect, useRef, useState } from 'react';
import { useChatbot } from '../hooks/useChatbot';
import LoadingDots from '../components/loadingdots';
import ReactMarkdown from 'react-markdown';


const Chat: React.FC = () => {
  const { messages, userTokens, botTokens, userCost, botCost, sendMessage } = useChatbot();
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      // scroll to the bottom with each new message
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
    <div className="flex flex-col h-screen w-4/5">
      <header className="text-center p-4 text-large font-bold">CyberGuardian GPT</header>
      <p className="text-center p-3">{userTokens + botTokens} total tokens used (${userCost + botCost})</p>
      <div className="flex-grow overflow-y-auto p-4 space-y-2 " ref={scrollRef} style={{ whiteSpace: 'pre-wrap' }}>
        {messages.map((msg, index) => (
          <div key={index} className={`w-fit max-w-prose p-2 m-2 rounded-lg ${msg.sender === 'user' ? 'ml-auto bg-blue-500 text-white' : 'mr-auto bg-gray-200'}`}>
            { typeof msg.text == "string" ? <ReactMarkdown>{msg.text}</ReactMarkdown> : <>{msg.text}</>}
          </div>
        ))}
        {loading && (
          <div key={"loading"} className={`flex items-center justify-center w-1/5 px-2 py-4 rounded-lg mr-auto bg-gray-200`}>
            <LoadingDots />
        </div>
        )}
      </div>
      <div className="p-12 md:p-8 flex">
        <input
          type="text"
          className="flex-grow w-2/5 sm:w-3/5 mr-4 p-2 border border-gray-300 rounded-lg"
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