// app/components/dualChat.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useDualChat } from "../context/useDualChat";
import LoadingDots from "./loadingdots";
import exportChatAsPdf from "../utils/exportpdf";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import Message from "./message";
import { useRouter } from "next/navigation";
import Modal from "./modal";
import DualChatConfigModal from "./dualChatConfigModal";
import { AIConfigType } from "../types/types";

interface ChatSideProps {
  title: string;
  messages: any[];
  threadId: string | undefined;
  loading: boolean;
  inputText: string;
  onInputChange: (text: string) => void;
  onSendMessage: () => void;
  showError: boolean;
}

const ChatSide: React.FC<ChatSideProps> = ({
  title,
  messages,
  threadId,
  loading,
  inputText,
  onInputChange,
  onSendMessage,
  showError,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-full w-full border-r">
      <div className="text-center p-2 font-bold border-b">{title}</div>
      <div className="flex-grow overflow-y-auto p-4 space-y-2" ref={scrollRef}>
        {messages.map((msg, index) => (
          <Message
            messageHistory={msg}
            key={msg.id !== "" ? msg.id : `Message${threadId}${index}`}
          />
        ))}
        {loading && (
          <div key={"loading"} className={"message--loading"}>
            <LoadingDots />
          </div>
        )}
        {showError && (
          <p className="message--error">
            There has been an error, please try again
          </p>
        )}
      </div>
      <div className="p-2 border-t">
        <div className="flex">
          <input
            type="text"
            className="flex-grow p-2 border rounded-l"
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSendMessage();
              }
            }}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-r"
            onClick={onSendMessage}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

interface Props {
  session: Session;
}

const DualChat = ({ session }: Props) => {
  const {
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
    setUser,
    showError,
    setShowError,
    resetDualChat,
    availableConfigs,
    loadAllConfigs,
    createNewDualChat,
  } = useDualChat();

  const [leftInputText, setLeftInputText] = useState("");
  const [rightInputText, setRightInputText] = useState("");
  const [leftLoading, setLeftLoading] = useState(false);
  const [rightLoading, setRightLoading] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (session.user?.name) {
      setUser(session.user.name);
    }
    
    // Load available configs
    loadAllConfigs();
  }, [session]);

  // If no configs are set, show the config modal on load
  useEffect(() => {
    if (availableConfigs.length >= 2 && !leftConfig && !rightConfig) {
      setShowConfigModal(true);
    }
  }, [availableConfigs, leftConfig, rightConfig]);

  const handleLeftSendMessage = async () => {
    const text = leftInputText.trim();
    if (text === "") return;
    
    setLeftInputText("");
    setLeftLoading(true);
    
    try {
      await sendLeftMessage(text);
    } catch (error) {
      console.error("Failed to send message:", error);
      setShowError(true);
    } finally {
      setLeftLoading(false);
    }
  };

  const handleRightSendMessage = async () => {
    const text = rightInputText.trim();
    if (text === "") return;
    
    setRightInputText("");
    setRightLoading(true);
    
    try {
      await sendRightMessage(text);
    } catch (error) {
      console.error("Failed to send message:", error);
      setShowError(true);
    } finally {
      setRightLoading(false);
    }
  };

  const handleNewDualChat = () => {
    resetDualChat();
    setShowConfigModal(true);
  };

  const handleConfigSelect = (configA: AIConfigType, configB: AIConfigType, randomize: boolean) => {
    createNewDualChat(configA, configB, randomize);
  };

  return (
    <div className="flex flex-col h-dvh w-full px-4">
      <div className="flex justify-between items-center py-4 border-b">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={handleNewDualChat}
        >
          New Dual Chat
        </button>
        <h1 className="text-xl font-bold">Dual Chat Mode</h1>
        <div className="flex space-x-2">
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded"
            onClick={() => setShowMoreOptions(!showMoreOptions)}
          >
            ...
          </button>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded"
            onClick={() => signOut()}
          >
            Log Out
          </button>
        </div>
      </div>

      {showMoreOptions && (
        <div className="chat__more-options">
          <ul className="more-options__list">
            <li>
              <button
                className="more-options__item button--dashboard"
                onClick={() => router.push("/dashboard")}
              >
                Back to Dashboard
              </button>
            </li>
            <li>
              <button
                className="more-options__item button--cancel"
                onClick={() => setShowMoreOptions(false)}
              >
                Cancel
              </button>
            </li>
          </ul>
        </div>
      )}

      <div className="flex-grow flex">
        <div className="w-1/2">
          <ChatSide
            title={leftTitle}
            messages={leftMessages}
            threadId={leftThreadId}
            loading={leftLoading}
            inputText={leftInputText}
            onInputChange={setLeftInputText}
            onSendMessage={handleLeftSendMessage}
            showError={showError}
          />
        </div>
        <div className="w-1/2">
          <ChatSide
            title={rightTitle}
            messages={rightMessages}
            threadId={rightThreadId}
            loading={rightLoading}
            inputText={rightInputText}
            onInputChange={setRightInputText}
            onSendMessage={handleRightSendMessage}
            showError={showError}
          />
        </div>
      </div>

      <div className="py-2 text-center text-gray-500 text-sm">
        Output is AI generated and can include inaccuracies
      </div>

      {showConfigModal && (
        <DualChatConfigModal
          closeModal={() => setShowConfigModal(false)}
          availableConfigs={availableConfigs}
          onConfigSelect={handleConfigSelect}
        />
      )}
    </div>
  );
};

export default DualChat;