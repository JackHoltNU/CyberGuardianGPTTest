'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useChatbot } from '../context/useChatbot';
import LoadingDots from '../components/loadingdots';
import exportChatAsPdf from '../utils/exportpdf';
import { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import Message from '../components/message';

interface Props {
  session: Session;
}

const Chat = ({session}: Props) => {
  const { messages, title, userTokens, botTokens, userCost, botCost, threadId, showError, sendMessage, setUser, resetChat, deleteChat, setShowError } = useChatbot();
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showDeletedAlert, setShowDeletedAlert] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if(session.user?.name){
      setUser(session.user.name)
    }
  },[session]);

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
      return;
    } finally {
      setLoading(false);
    }   
    if(showError){
      setShowError(false);
    }        
  };

  const deleteChatAndShowDeleted = () => {
    deleteChat();
    showDeleted();
  }

  const showDeleted = () => {
    setShowDeletedAlert(true);
    setShowMoreOptions(false);
    setTimeout(() => setShowDeletedAlert(false), 3000);
  }  

  return (
    <div className="chat">
      <div className='chat__header'>
        <div className='chat__header-empty-space'></div>
        <header className="chat__title">CyberGuardian GPT</header>
        <button className='button--logout' onClick={() => signOut()}>Log Out</button>
      </div>
      <div className="chat__actions">                
        <div className="chat__action">        
          <button
            className="button--new-chat"
            onClick={() => resetChat()}
          >
            Start new chat
          </button>
        </div>
        <div className="chat__action">        
          <button
            className="button--more-options"
            onClick={() => {
              setShowMoreOptions(!showMoreOptions)
            }
            }
          >
            ...
          </button>
        </div>
      </div>

      {showMoreOptions && (
        <div className="chat__more-options">
          <ul className="more-options__list">
            <li>
              <button className="more-options__item button--save-pdf-full" onClick={() => exportChatAsPdf(messages, title)}>Save as PDF</button>
            </li>          
            <li>
              <button className="more-options__item button--delete-chat" onClick={() => deleteChatAndShowDeleted()}>Delete chat</button>
            </li>
            <li>
              <button className="more-options__item button--cancel" onClick={() => setShowMoreOptions(false)}>Cancel</button>
            </li>
          </ul>
        </div>
      )}

      {showDeletedAlert && (
        <div className='chat__alert'>Chat deleted</div>
      )}
      
      <div className="chat__messages" ref={scrollRef} aria-live="polite">
        {messages.map((msg, index) => (
          <Message messageHistory={msg} key={msg.id !== "" ? msg.id : `Message${threadId}${index}`}/>
        ))}
        {loading && (
          <div key={"loading"} className={'message--loading'}>
            <LoadingDots />
        </div>
        )}
        {showError && (
          <p className="message--error">There has been an error, please try again</p>
        )}
      </div>
      <div className="chatinput">
        <label htmlFor="chat-input" className="sr-only">Type your message</label>
        <input
          type="text"
          className="chatinput__field"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if(e.key === 'Enter'){
              sendMessages();
            }
          }}
        />
        <button
          className="button--send"
          onClick={sendMessages}
        >
          Send
        </button>
      </div>      
    </div>
  );
};

export default Chat;