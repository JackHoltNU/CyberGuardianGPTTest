import React, { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LoadingDots from "../components/loadingdots";
import { MessageHistory, PromptConfiguration } from "../types/types";

interface FontSizes {
  chat: string;
  input: string;
  header: string;
}

interface MessageListProps {
  messages: MessageHistory[];
  loading: boolean;
  fontSizes: FontSizes;
  comparisonMode: boolean;
  comparisonMessages: MessageHistory[];
  comparisonCounter: number;
  onComparisonCounterChange: (counter: number) => void;
  onRefreshLatestMessage: () => void;
  onConfigurationChange: (config: PromptConfiguration) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  loading,
  fontSizes,
  comparisonMode,
  comparisonMessages,
  comparisonCounter,
  onComparisonCounterChange,
  onRefreshLatestMessage,
  onConfigurationChange
}) => {
  const chatRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom of chat when new message arrives
  const scrollToBottom = (): void => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const isLastMessage = (index: number) => index === messages.length - 1;
  const isAssistantMessage = (message: MessageHistory) => message.sender === "assistant";

  const renderMessageContent = (message: MessageHistory, index: number) => {
    if (comparisonMode && 
        comparisonCounter <= comparisonMessages.length - 1 && 
        isLastMessage(index) && 
        isAssistantMessage(message)) {
      return (
        <ReactMarkdown className="markdown-content" remarkPlugins={[remarkGfm]}>
          {comparisonMessages[comparisonCounter].text as string}
        </ReactMarkdown>
      );
    }
    
    return (
      <ReactMarkdown className="markdown-content" remarkPlugins={[remarkGfm]}>
        {typeof message.text === "string" ? message.text : "Loading..."}
      </ReactMarkdown>
    );
  };

  const showComparisonControls = (message: MessageHistory, index: number) => {
    return comparisonMode && 
           comparisonMessages.length > 0 && 
           isAssistantMessage(message) && 
           isLastMessage(index);
  };

  const showRefreshButton = (message: MessageHistory, index: number) => {
    return isLastMessage(index) && isAssistantMessage(message);
  };

  const handleComparisonNavigation = (newCounter: number) => {
    onComparisonCounterChange(newCounter);
    
    // Apply the configuration from the current comparison message
    if (comparisonMessages[newCounter]?.promptConfig) {
      onConfigurationChange(comparisonMessages[newCounter].promptConfig!);
    }
  };

  // Helper to get current message config for display
  const getCurrentConfig = (message: MessageHistory, index: number) => {
    if (comparisonMode && 
        comparisonCounter <= comparisonMessages.length - 1 && 
        isLastMessage(index) && 
        isAssistantMessage(message)) {
      return comparisonMessages[comparisonCounter].promptConfig;
    }
    return message.promptConfig;
  };

  // Helper to render config summary
  const renderConfigSummary = (config: PromptConfiguration | undefined) => {
    if (!config) return null;
    
    return (
      <div className="mt-2 text-xs text-gray-600 border-t pt-2">
        <div className="grid grid-cols-2 gap-1">
          <span><strong>Personality:</strong> {config.personalityLabel}</span>
          <span><strong>Language:</strong> {config.languageDifficultyLabel}</span>
          <span><strong>Length:</strong> {config.answerLengthLabel}</span>
          <span><strong>Technical:</strong> {config.technicalDifficultyLabel}</span>
          <span className="col-span-2"><strong>Format:</strong> {config.instructionFormatLabel}</span>
        </div>
      </div>
    );
  };

  return (
    <div ref={chatRef} className="flex-1 p-5 overflow-y-auto">
      <div className="flex flex-col gap-4">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {/* Left comparison arrow */}
            {showComparisonControls(message, index) && (
              <button
                className={`max-w-xs md:max-w-md lg:max-w-lg p-4 rounded-lg border-2 ${
                  comparisonCounter < 1 ? "invisible" : "bg-blue-200"
                } mr-2 ${fontSizes.chat}`}
                disabled={comparisonCounter < 1}
                onClick={() => onComparisonCounterChange(comparisonCounter - 1)}
              >
                <ChevronLeft />
              </button>
            )}

            {/* Message content */}
            <div className={`max-w-xs md:max-w-md lg:max-w-lg ${fontSizes.chat} ${
              message.sender === "user"
                ? "bg-indigo-100 text-gray-800 border border-indigo-200"
                : "bg-gray-100 text-gray-800 border border-gray-300"
            } rounded-lg overflow-hidden`}>
              
              <div className="p-4">
                {renderMessageContent(message, index)}
              </div>
              
              {/* Show config summary for assistant messages */}
              {isAssistantMessage(message) && (
                <div className="px-4 pb-4">
                  {renderConfigSummary(getCurrentConfig(message, index))}
                </div>
              )}
            </div>

            {/* Right comparison arrow */}
            {showComparisonControls(message, index) && (
              <button
                className={`max-w-xs md:max-w-md lg:max-w-lg p-4 rounded-lg border-2 ${
                  comparisonCounter >= comparisonMessages.length ? "invisible" : "bg-blue-200"
                } ml-2 ${fontSizes.chat}`}
                disabled={comparisonCounter >= comparisonMessages.length}
                onClick={() => onComparisonCounterChange(comparisonCounter + 1)}
              >
                <ChevronRight />
              </button>
            )}

            {/* Refresh button */}
            {showRefreshButton(message, index) && (
              <button
                className={`max-w-xs md:max-w-md lg:max-w-lg p-4 rounded-lg border-2 bg-blue-200 ml-2 ${fontSizes.chat}`}
                onClick={onRefreshLatestMessage}
              >
                <RefreshCcw />
              </button>
            )}
          </div>
        ))}
        
        {/* Loading indicator */}
        {loading && (
          <div key="loading" className="flex justify-start">
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg p-4 rounded-lg ${fontSizes.chat} bg-gray-100 text-gray-800 border border-gray-300`}
            >
              <LoadingDots />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageList;