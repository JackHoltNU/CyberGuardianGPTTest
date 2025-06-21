import React, { useRef, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCcw, Sliders, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LoadingDots from "../components/loadingdots";
import MessageSkeleton from "../components/MessageSkeleton";
import { MessageHistory, PromptConfiguration } from "../types/types";
import styles from "../styles/promptbuilder.module.css";

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
  onOpenCustomisePanel: () => void;
  isCustomisePanelOpen: boolean;
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
  onOpenCustomisePanel,
  isCustomisePanelOpen,
}): React.ReactElement => {
  const chatRef = useRef<HTMLDivElement>(null);
  
  // State for config summary collapse/expand per message - default to expanded (true)
  const [configSummaryStates, setConfigSummaryStates] = useState<Record<string, boolean>>({});

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
    return [
      config.tone,
      config.languageDifficulty,
      config.answerLength,
      config.technicalDifficulty,
      config.instructionFormat,
      config.specifyDevices ? "1" : "0",
      (config.selectedDevices || []).join(","),
      config.computerType || "",
      config.tabletType || "",
      config.mobileType || "",
      config.browser || "",
      config.additionalInstructions || "",
    ].join("|");
  };

  // Helper to get color name for a config
  const getConfigColorName = (config: PromptConfiguration | undefined) => {
    const hash = getConfigHash(config);

    return configColorMap?.get(hash) || "gray";
  };

  const isLastMessage = (index: number) => index === messages.length - 1;
  const isAssistantMessage = (message: MessageHistory) =>
    message.sender === "assistant";
  const isLastAssistantMessage = (index: number) => {
    // Check if this is the last assistant message in the conversation
    for (let i = messages.length - 1; i > index; i--) {
      if (messages[i].sender === "assistant") {
        return false; // Found a later assistant message
      }
    }
    return isAssistantMessage(messages[index]);
  };

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
  const renderConfigSummary = (config: PromptConfiguration | undefined, messageId: string, messageIndex: number) => {
    if (!config) return null;

    // Get the current state for this message, default to true (expanded)
    const isExpanded = configSummaryStates[messageId] ?? true;
    const showCustomiseButton = isLastAssistantMessage(messageIndex);

    const toggleConfigSummary = () => {
      setConfigSummaryStates(prev => ({
        ...prev,
        [messageId]: !isExpanded
      }));
    };

    return (
      <div className={styles["pb-config-summary"]}>
        {/* Header with toggle button */}
        <div className={styles["pb-config-summary-header"]}>
          <button
            className={styles["pb-config-summary-toggle"]}
            onClick={toggleConfigSummary}
            title={isExpanded ? "Collapse configuration" : "Expand configuration"}
            aria-label={isExpanded ? "Collapse configuration" : "Expand configuration"}
          >
            <ChevronDown
              size={24}
              className={`${styles["pb-config-summary-chevron"]} ${
                isExpanded ? styles["pb-config-summary-chevron-expanded"] : ""
              }`}
            />
          </button>
        </div>
        
        {/* Collapsible content */}
        <div
          className={`${styles["pb-config-summary-content"]} ${
            isExpanded
              ? styles["pb-config-summary-content-expanded"]
              : styles["pb-config-summary-content-collapsed"]
          }`}
        >
          {/** Determine if we are in single column mode */}
          {/** Single column on mobile/narrow screens or largest font size */}
          {/** Used to conditionally apply col-span-2 */}
          {/** This ensures no col-span-2 in single column mode */}
          {/** and keeps two-column layout on larger screens/font sizes */}
          {/** for better readability */}
          <div className={styles["pb-config-summary-details"]}>
            <div
              className={`grid grid-cols-1 md:grid-cols-2 gap-x-1 gap-y-2`}
            >
              <span className="break-normal">
                <strong>Tone:</strong> {config.toneLabel}
              </span>
              <span className="break-normal">
                <strong>Language:</strong> {config.languageDifficultyLabel}
              </span>
              <span className="break-normal">
                <strong>Length:</strong> {config.answerLengthLabel}
              </span>
              <span className="break-normal">
                <strong>Technical:</strong> {config.technicalDifficultyLabel}
              </span>
              <span
                className="md:col-span-2 break-words"
              >
                <strong>Format:</strong> {config.instructionFormatLabel}
              </span>
              {/* New fields for device/browser/instructions */}
              {config.specifyDevices &&
                (config.selectedDevices?.length || 0) > 0 && (
                  <span
                    className="md:col-span-2 break-words"
                  >
                    <strong>Devices:</strong>{" "}
                    {config.selectedDevices?.join(", ")}
                    {config.computerType &&
                      config.selectedDevices?.includes("computer") && (
                        <> | Computer: {config.computerType}</>
                      )}
                    {config.tabletType &&
                      config.selectedDevices?.includes("tablet") && (
                        <> | Tablet: {config.tabletType}</>
                      )}
                    {config.mobileType &&
                      config.selectedDevices?.includes("mobile") && (
                        <> | Mobile: {config.mobileType}</>
                      )}
                  </span>
                )}
              {config.browser && (
                <span
                  className="md:col-span-2 break-words"
                >
                  <strong>Browser:</strong> {config.browser}
                </span>
              )}
              {config.additionalInstructions && (
                <span
                  className="md:col-span-2 break-words"
                >
                  <strong>Additional:</strong> {config.additionalInstructions}
                </span>
              )}
            </div>
          </div>
          
          {/* Settings cog button moved to bottom right - only show on last assistant message */}
          {showCustomiseButton && (
            <div className={styles["pb-config-summary-button"]}>
              <button
                className={`${styles["pb-cog-btn"]} ${
                  isCustomisePanelOpen
                    ? styles["pb-cog-btn-active"]
                    : styles["pb-cog-btn-inactive"]
                }`}
                title={
                  isCustomisePanelOpen ? "Hide Customise Chat" : "Show Customise Chat"
                }
                onClick={onOpenCustomisePanel}
              >
                <Sliders size={16} />
                <span className="ml-1">Customise</span>
              </button>
            </div>
          )}
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
      config1.tone !== config2.tone ||
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
                className={`${styles["pb-message-row"]} ${styles["pb-message-row-assistant"]} ${fontSizes.chat}`}
              >
                <div
                  className={`${styles["pb-message-system"]} ${fontSizes.chat}`}
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
              className={`${styles["pb-message-row"]} ${
                message.sender === "user"
                  ? styles["pb-message-row-user"]
                  : styles["pb-message-row-assistant"]
              }`}
            >
              {/* Left comparison arrow */}
              {showComparisonControls(message, index) && (
                <button
                  className={`${styles["pb-arrow-btn"]} ${
                    comparisonCounter < 1
                      ? styles["pb-arrow-btn-invisible"]
                      : ""
                  } ${styles["pb-arrow-btn-margin-right"]} ${fontSizes.chat}`}
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
                className={`${styles["pb-message-bubble"]} ${fontSizes.chat} ${
                  message.sender === "user"
                    ? styles["pb-message-user"]
                    : `${styles["pb-message-assistant"]} ${
                        colorClassMap[
                          getConfigColorName(getCurrentConfig(message, index))
                        ]
                      }`
                }`}
              >
                <div className="p-4">
                  {renderMessageContent(message, index)}
                </div>

                {/* Show config summary and continue button for assistant messages */}
                {isAssistantMessage(message) && (
                  <div className="px-4 pb-4">
                    {renderConfigSummary(getCurrentConfig(message, index), message.id || "", index)}

                    {/* Continue with this configuration button */}
                    {showContinueButton(message, index) && (
                      <div className="mt-3">
                        <div>
                          <button
                            className={styles["pb-continue-btn"]}
                            onClick={onExitComparisonMode}
                          >
                            Continue with this configuration
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right comparison arrow */}
              {showComparisonControls(message, index) && (
                <button
                  className={`${styles["pb-arrow-btn"]} ${
                    comparisonCounter >= comparisonMessages.length - 1
                      ? styles["pb-arrow-btn-invisible"]
                      : ""
                  } ${styles["pb-arrow-btn-margin-left"]} ${fontSizes.chat}`}
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
                  className={`${styles["pb-refresh-btn"]} ${fontSizes.chat}`}
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
