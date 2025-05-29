import React from "react";
import ChatHeader from "./chatHeader";
import MessageList from "./messageList";
import MessageInput from "./messageInput";
import { MessageHistory, PromptConfiguration } from "../types/types";

interface FontSizes {
  chat: string;
  input: string;
  header: string;
}

interface ChatPanelProps {
  title: string;
  messages: MessageHistory[];
  loading: boolean;
  userInput: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  fontSizes: FontSizes;
  keyboardHeight: number;
  keyboardVisible: boolean;
  isFullScreen: boolean;
  comparisonMode: boolean;
  comparisonMessages: MessageHistory[];
  comparisonCounter: number;
  onComparisonCounterChange: (counter: number) => void;
  onRefreshLatestMessage: () => void;
  onExitComparisonMode: () => void;
  onConfigurationChange: (config: PromptConfiguration) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  title,
  messages,
  loading,
  userInput,
  onInputChange,
  onSendMessage,
  fontSizes,
  keyboardHeight,
  keyboardVisible,
  isFullScreen,
  comparisonMode,
  comparisonMessages,
  comparisonCounter,
  onComparisonCounterChange,
  onRefreshLatestMessage,
  onExitComparisonMode,
  onConfigurationChange
}) => {
  const chatStyle = {
    height:
      keyboardVisible && isFullScreen
        ? `calc(100vh - ${keyboardHeight}px - 180px)`
        : "auto",
    transition: "all 0.3s ease",
  };

  return (
    <div
      className="w-1/2 flex flex-col bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-300"
      style={chatStyle}
    >
      <ChatHeader title={title} fontSizes={fontSizes} />
      
      <MessageList
        messages={messages}
        loading={loading}
        fontSizes={fontSizes}
        comparisonMode={comparisonMode}
        comparisonMessages={comparisonMessages}
        comparisonCounter={comparisonCounter}
        onComparisonCounterChange={onComparisonCounterChange}
        onRefreshLatestMessage={onRefreshLatestMessage}
        onConfigurationChange={onConfigurationChange}
      />
      
      <MessageInput
        userInput={userInput}
        onInputChange={onInputChange}
        onSendMessage={onSendMessage}
        fontSizes={fontSizes}
        comparisonMode={comparisonMode}
        onExitComparisonMode={onExitComparisonMode}
      />
    </div>
  );
};

export default ChatPanel;