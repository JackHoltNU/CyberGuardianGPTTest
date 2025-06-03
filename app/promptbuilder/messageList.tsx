import React, { useRef, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LoadingDots from "../components/loadingdots";
import MessageSkeleton from "../components/MessageSkeleton";
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
  onExitComparisonMode: () => void;
  onConfigurationChange: (config: PromptConfiguration) => void;
  currentPanelConfig: PromptConfiguration;
  configColorMap: Map<string, string>;
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
  onExitComparisonMode,
  onConfigurationChange,
  currentPanelConfig,
  configColorMap,
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

  // Helper to get config hash
  const getConfigHash = (config: PromptConfiguration | undefined) => {
    if (!config) return "";
    return `${config.personality}-${config.languageDifficulty}-${config.answerLength}-${config.technicalDifficulty}-${config.instructionFormat}`;
  };

  // Helper to get color name for a config
  const getConfigColorName = (config: PromptConfiguration | undefined) => {
    const hash = getConfigHash(config);
    return configColorMap?.get(hash) || "gray";
  };

  const isLastMessage = (index: number) => index === messages.length - 1;
  const isAssistantMessage = (message: MessageHistory) =>
    message.sender === "assistant";

  const renderMessageContent = (message: MessageHistory, index: number) => {
    if (
      comparisonMode &&
      comparisonCounter <= comparisonMessages.length - 1 &&
      isLastMessage(index) &&
      isAssistantMessage(message)
    ) {
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
    return (
      comparisonMode &&
      comparisonMessages.length > 0 &&
      isAssistantMessage(message) &&
      isLastMessage(index)
    );
  };

  const showRefreshButton = (message: MessageHistory, index: number) => {
    if (!isLastMessage(index) || !isAssistantMessage(message)) return false;

    const currentConfigHash = getConfigHash(currentPanelConfig);
    const comparisonHashes = comparisonMessages.map((msg) =>
      getConfigHash(msg.promptConfig)
    );
    console.log("currentPanelConfig hash:", currentConfigHash);
    console.log("comparisonMessages hashes:", comparisonHashes);

    const found = comparisonHashes.includes(currentConfigHash);
    return !found;
  };

  const showContinueButton = (message: MessageHistory, index: number) => {
    // Only show for assistant messages
    if (!isAssistantMessage(message)) return false;

    // Only show if we're in comparison mode (meaning user has choices to make)
    if (!comparisonMode) return false;

    // Only show on the last message when there are actual comparisons
    return isLastMessage(index) && comparisonMessages.length > 0;
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
    if (
      comparisonMode &&
      comparisonCounter <= comparisonMessages.length - 1 &&
      isLastMessage(index) &&
      isAssistantMessage(message)
    ) {
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
          <span>
            <strong>Personality:</strong> {config.personalityLabel}
          </span>
          <span>
            <strong>Language:</strong> {config.languageDifficultyLabel}
          </span>
          <span>
            <strong>Length:</strong> {config.answerLengthLabel}
          </span>
          <span>
            <strong>Technical:</strong> {config.technicalDifficultyLabel}
          </span>
          <span className="col-span-2">
            <strong>Format:</strong> {config.instructionFormatLabel}
          </span>
        </div>
      </div>
    );
  };

  // Check if current panel config differs from message config
  const configsAreDifferent = (
    config1: PromptConfiguration | undefined,
    config2: PromptConfiguration
  ): boolean => {
    if (!config1) return true;

    return (
      config1.personality !== config2.personality ||
      config1.languageDifficulty !== config2.languageDifficulty ||
      config1.answerLength !== config2.answerLength ||
      config1.technicalDifficulty !== config2.technicalDifficulty ||
      config1.instructionFormat !== config2.instructionFormat
    );
  };

  // Color class map for Tailwind
  const colorClassMap: Record<string, string> = {
    blue: "border-blue-500",
    green: "border-green-500",
    orange: "border-orange-500",
    purple: "border-purple-500",
    red: "border-red-500",
    yellow: "border-yellow-500",
    pink: "border-pink-500",
    indigo: "border-indigo-500",
    gray: "border-gray-500",
  };

  return (
    <div ref={chatRef} className="flex-1 p-5 overflow-y-auto">
      <div className="flex flex-col gap-4">
        {messages.map((message, index) => {
          // Render system/info messages in a distinct style
          if (message.sender === "system") {
            return (
              <div
                key={message.id}
                className={`flex justify-center ${fontSizes.chat}`}
              >
                <div
                  className={`bg-gray-200 text-gray-600 rounded px-3 py-1 my-2 max-w-lg text-center border border-gray-300 ${fontSizes.chat}`}
                >
                  {typeof message.text === "string" ? message.text : ""}
                </div>
              </div>
            );
          }
          const config = getCurrentConfig(message, index);
          const hash = getConfigHash(config);
          const color = getConfigColorName(config);
          console.log(
            `[MessageList] Message id: ${message.id}, hash: ${hash}, color: ${color}`
          );
          return (
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
                  onClick={() =>
                    handleComparisonNavigation(comparisonCounter - 1)
                  }
                >
                  <ChevronLeft />
                </button>
              )}

              {/* Message content */}
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg ${
                  fontSizes.chat
                } ${
                  message.sender === "user"
                    ? "bg-indigo-100 text-gray-800 border border-indigo-200"
                    : `bg-gray-100 text-gray-800 border-l-4 ${
                        colorClassMap[
                          getConfigColorName(getCurrentConfig(message, index))
                        ]
                      }`
                } rounded-lg overflow-hidden`}
              >
                <div className="p-4">
                  {renderMessageContent(message, index)}
                </div>

                {/* Show config summary and continue button for assistant messages */}
                {isAssistantMessage(message) && (
                  <div className="px-4 pb-4">
                    {renderConfigSummary(getCurrentConfig(message, index))}

                    {/* Continue with this configuration button */}
                    {showContinueButton(message, index) && (
                      <div className="mt-3">
                        <button
                          className="w-full p-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors duration-200"
                          onClick={onExitComparisonMode}
                        >
                          Continue with this configuration
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right comparison arrow */}
              {showComparisonControls(message, index) && (
                <button
                  className={`max-w-xs md:max-w-md lg:max-w-lg p-4 rounded-lg border-2 ${
                    comparisonCounter >= comparisonMessages.length - 1
                      ? "invisible"
                      : "bg-blue-200"
                  } ml-2 ${fontSizes.chat}`}
                  disabled={comparisonCounter >= comparisonMessages.length - 1}
                  onClick={() =>
                    handleComparisonNavigation(comparisonCounter + 1)
                  }
                >
                  <ChevronRight />
                </button>
              )}

              {/* Refresh button - only show when config has changed */}
              {showRefreshButton(message, index) && (
                <button
                  className={`max-w-xs md:max-w-md lg:max-w-lg p-4 rounded-lg border-2 bg-blue-200 ml-2 ${fontSizes.chat}`}
                  onClick={onRefreshLatestMessage}
                  title="Try different style"
                >
                  <RefreshCcw />
                </button>
              )}
            </div>
          );
        })}

        {/* Loading indicator */}
        {loading && (
          <div key="loading" className="flex justify-start">
            <MessageSkeleton fontSize={fontSizes.chat} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageList;
