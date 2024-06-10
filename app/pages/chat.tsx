'use client'


import React, { useEffect, useRef, useState } from 'react';
import { useChatbot } from '../hooks/useChatbot';
import LoadingDots from '../components/loadingdots';
import ReactMarkdown from 'react-markdown';
import exportChatAsText from '../utils/exporttxt';
import exportChatAsPdf from '../utils/exportpdf';


const Chat: React.FC = () => {
  const { messages, userTokens, botTokens, userCost, botCost, sendMessage } = useChatbot();
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      // scroll to the bottom with each new message
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    console.log(`User tokens: ${userTokens}`);
    console.log(`User cost: ${userCost}`);
    console.log(`Bot tokens: ${botTokens}`);
    console.log(`Bot cost: ${botCost}`);

  }, [messages, userTokens, botTokens, userCost, botCost]);

  const sendMessages = async () => {
    let sendText = inputText.trim();
    setInputText("");    
    if(sendText == ""){
      return;
    }
    setLoading(true);
    try {
      await sendMessage(sendText);  
    } catch (error: any) {
      console.error("Failed to send message:", error);
      setShowError(true);
    } finally {
      setLoading(false);
      if(showError){
        setShowError(false);
      }
    }          
  };

  return (
    <div className="flex flex-col h-dvh w-4/5">
      <header className="text-center p-2 mt-4 text-xl font-bold">CyberGuardian GPT</header>
      <div className="flex w-full items-center justify-center">
        {/* <p className="text-center p-3">{userTokens + botTokens} total tokens used (${userCost + botCost})</p> */}
        <div className="p-1 flex w-fit">        
          <button
            className="bg-gray-500 hover:bg-gray-700 text-white p-2 rounded-lg"
            onClick={() => exportChatAsPdf(messages)}
          >
            Save as PDF
          </button>
        </div>
        <div className="p-1 md:p-4 flex w-fit">        
          <button
            className="bg-gray-500 hover:bg-gray-700 text-white p-2 rounded-lg"
            onClick={() => exportChatAsText(messages)}
          >
            Save as TXT
          </button>
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto p-4 space-y-2 " ref={scrollRef} aria-live="polite">
        {messages.map((msg, index) => (
          <div key={index} className={`w-fit p-2 rounded-lg ${msg.sender === 'user' ? 'ml-auto -mr-2 bg-blue-500 text-white' : 'mr-auto -ml-2 bg-yellow-200'}`}>
            { typeof msg.text == "string" ? <ReactMarkdown className="markdown">{msg.text}</ReactMarkdown> : <>{msg.text}</>}
          </div>
        ))}
        {loading && (
          <div key={"loading"} className={`flex items-center justify-center w-1/5 px-2 py-4 rounded-lg mr-auto -ml-2 bg-yellow-200`}>
            <LoadingDots />
        </div>
        )}
        {showError && (
          <p className="w-fit p-2 rounded-lg ml-auto -mr-2 bg-red-500 text-white">There has been an error, please try again</p>
        )}
      </div>
      <div className="p-4 md:p-8 flex w-full">
        <label htmlFor="chat-input" className="sr-only">Type your message</label>
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