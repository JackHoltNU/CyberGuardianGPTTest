"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  Settings,
  RotateCcw,
  Type,
  MinusCircle,
  PlusCircle,
  Sliders,
} from "lucide-react";
import { debounce } from "../utils/debounce";
import { useChatbot } from "../context/useChatbot";
import { Session } from "next-auth";
import { usePromptBuilder } from "../context/usePromptBuilder";
import PromptBuilder from "./promptBuilder";
import { signOut } from "next-auth/react";
import ChatHistorySidebar from "./chatHistorySidebar";
import ChatPanel from "./chatPanel";
import { PromptConfiguration } from "../types/types";
import styles from "../styles/promptbuilder.module.css";

// Define font size options
type FontSizeOption = "small" | "medium" | "large" | "largest";

interface FontSizes {
  chat: string;
  input: string;
  header: string;
}

interface FontSizeMapping {
  [key: string]: FontSizes;
}

interface Props {
  session: Session;
}

// Define color palette for comparison configs
const CONFIG_COLOR_NAMES = [
  "blue",
  "green",
  "orange",
  "purple",
  "red",
  "yellow",
  "pink",
  "indigo",
];

const PromptBuilderChat = ({ session }: Props) => {
  // Get states and functions from context
  const {
    messages,
    sendMessage,
    title,
    setUser,
    showError,
    setShowError,
    resetChat,
    chatCollection,
    loadUserChats,
    openChat,
    breakpoint,
    setBreakpoint,
    comparisonMessages,
    setComparisonMessages,
  } = useChatbot();

  const {
    systemPrompt,
    getCurrentConfiguration,
    applyConfiguration,
    getPromptConfigHash,
  } = usePromptBuilder();

  // Local state for chat UI
  const [userInput, setUserInput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fontSize, setFontSize] = useState<FontSizeOption>("medium");
  const [confirmMessage, setConfirmMessage] = useState<string>("");
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const [headerCollapsed, setHeaderCollapsed] = useState<boolean>(false);
  const [promptBuilderOpen, setPromptBuilderOpen] = useState<boolean>(false);
  const [comparisonMode, setComparisonMode] = useState<boolean>(false);
  const [comparisonCounter, setComparisonCounter] = useState(0);

  // History sidebar state
  const [historySidebarOpen, setHistorySidebarOpen] = useState<boolean>(false);
  const [feedbackInput, setFeedbackInput] = useState("");
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);

  // Refs
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Font sizes
  const fontSizes: FontSizeMapping = {
    small: {
      chat: "text-base",
      input: "text-base",
      header: "text-xl",
    },
    medium: {
      chat: "text-lg",
      input: "text-lg",
      header: "text-2xl",
    },
    large: {
      chat: "text-xl",
      input: "text-xl",
      header: "text-3xl",
    },
    largest: {
      chat: "text-2xl",
      input: "text-2xl",
      header: "text-4xl",
    },
  };

  // Stable color assignment using useRef
  const configColorMapRef = useRef<Map<string, string>>(new Map());
  const colorIndexRef = useRef(0);

  // Track previous config for change detection
  const previousConfigRef = useRef<PromptConfiguration | null>(null);

  // Helper to get changed config fields
  const getConfigChanges = (
    prev: PromptConfiguration,
    curr: PromptConfiguration
  ) => {
    const changes: string[] = [];
    if (prev.personality !== curr.personality) {
      changes.push(
        `personality from "${prev.personalityLabel}" to "${curr.personalityLabel}"`
      );
    }
    if (prev.languageDifficulty !== curr.languageDifficulty) {
      changes.push(
        `language from "${prev.languageDifficultyLabel}" to "${curr.languageDifficultyLabel}"`
      );
    }
    if (prev.answerLength !== curr.answerLength) {
      changes.push(
        `length from "${prev.answerLengthLabel}" to "${curr.answerLengthLabel}"`
      );
    }
    if (prev.technicalDifficulty !== curr.technicalDifficulty) {
      changes.push(
        `technical difficulty from "${prev.technicalDifficultyLabel}" to "${curr.technicalDifficultyLabel}"`
      );
    }
    if (prev.instructionFormat !== curr.instructionFormat) {
      changes.push(
        `format from "${prev.instructionFormatLabel}" to "${curr.instructionFormatLabel}"`
      );
    }
    return changes;
  };

  // Set the user when session is available
  useEffect(() => {
    if (session.user?.name) {
      setUser(session.user.name);
    }
    loadUserChats();
  }, [session]);

  // Get all unique configurations from comparisonMessages only
  const getComparisonMessageConfigs = (): PromptConfiguration[] => {
    const configs: PromptConfiguration[] = [];
    const configHashes = new Set<string>();
    comparisonMessages.forEach((msg) => {
      if (msg.promptConfig) {
        const hash = getPromptConfigHash(msg.promptConfig);
        if (!configHashes.has(hash)) {
          configHashes.add(hash);
          configs.push(msg.promptConfig);
        }
      }
    });
    return configs;
  };

  // Update the color map only for new configs
  useEffect(() => {
    const allConfigs = getComparisonMessageConfigs();
    const map = configColorMapRef.current;
    allConfigs.forEach((config) => {
      const hash = getPromptConfigHash(config);
      if (!map.has(hash)) {
        map.set(
          hash,
          CONFIG_COLOR_NAMES[colorIndexRef.current % CONFIG_COLOR_NAMES.length]
        );
        colorIndexRef.current += 1;
      }
    });
    // No setState needed, map is stable in ref
  }, [comparisonMessages]);

  // For downstream components, pass a stable copy
  const configColorMap = configColorMapRef.current;

  // Debug logging for color map and message configs
  console.log(
    "[ColorMap] Config hashes in color map:",
    Array.from(configColorMap.keys())
  );
  console.log(
    "[ColorMap] All configs in color map:",
    Array.from(configColorMap.entries())
  );

  // Modified handleSendMessage to insert config change message if needed
  const handleSendMessage = async () => {
    const text = userInput.trim();
    if (text === "") return;

    const currentConfig = getCurrentConfiguration();
    const prevConfig = previousConfigRef.current;
    let configChangeMessages: string[] = [];
    if (prevConfig) {
      const changes = getConfigChanges(prevConfig, currentConfig);
      if (changes.length > 0) {
        configChangeMessages = changes.map(
          (change) => `You changed the ${change}`
        );
      }
    }
    previousConfigRef.current = { ...currentConfig };

    setUserInput("");
    setLoading(true);

    try {
      setComparisonMessages([]);
      setComparisonMode(false);
      setComparisonCounter(0);
      // If config changed, insert a system/info message for each change before user message
      for (const msg of configChangeMessages) {
        messages.push({
          id: `system-${Date.now()}-${Math.random()}`,
          sender: "system",
          text: msg,
          timestamp: new Date(),
        });
      }
      await sendMessage(text, systemPrompt, currentConfig);
    } catch (error) {
      console.error("Failed to send message:", error);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigurationChange = (config: PromptConfiguration) => {
    applyConfiguration(config);
  };

  // Get the configuration that should be displayed in the panel
  const getCurrentDisplayConfig = (): PromptConfiguration => {
    // if (
    //   comparisonMode &&
    //   comparisonMessages.length > 0 &&
    //   comparisonCounter < comparisonMessages.length
    // ) {
    //   return (
    //     comparisonMessages[comparisonCounter].promptConfig ||
    //     getCurrentConfiguration()
    //   );
    // }
    return getCurrentConfiguration();
  };

  const refreshLatestMessage = async () => {
    setLoading(true);
    setComparisonMode(true);
    console.log("refreshing");

    try {
      await sendMessage("", systemPrompt, getCurrentConfiguration(), true);
    } catch (error) {
      console.error("Failed to send message:", error);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  // Ensure we always show the latest (rightmost) comparison message after refresh
  useEffect(() => {
    if (comparisonMode && comparisonMessages.length > 0) {
      setComparisonCounter(comparisonMessages.length - 1);
    }
  }, [comparisonMessages, comparisonMode]);

  const handleExitComparisonMode = () => {
    // If in comparison mode and a comparison message is selected, apply its config
    if (
      comparisonMode &&
      comparisonMessages.length > 0 &&
      comparisonCounter < comparisonMessages.length
    ) {
      const selectedConfig = comparisonMessages[comparisonCounter].promptConfig;
      if (selectedConfig) {
        applyConfiguration(selectedConfig);
      }
      // Keep only the accepted message in comparisonMessages
      const acceptedMessage = comparisonMessages[comparisonCounter];
      setComparisonMessages([acceptedMessage]);
      setComparisonCounter(0);
    } else {
      setComparisonMessages([]);
      setComparisonCounter(0);
    }
    setComparisonMode(false);
  };

  const handlePositiveFeedback = () => {
    setBreakpoint(false);
  };

  const handleNegativeFeedback = () => {
    setBreakpoint(false);
    setShowFeedbackInput(true);
  };

  const handleFeedbackText = () => {
    console.log(feedbackInput);
    setFeedbackInput("");
    setShowFeedbackInput(false);
  };

  // Show confirmation message and automatically hide it
  const showConfirmation = (message: string): void => {
    setConfirmMessage(message);
    setTimeout(() => setConfirmMessage(""), 3000);
  };

  // Font size controls
  const increaseFontSize = (): void => {
    if (fontSize === "small") {
      setFontSize("medium");
      showConfirmation("Text size increased to Medium");
    }
    if (fontSize === "medium") {
      setFontSize("large");
      showConfirmation("Text size increased to Large");
    }
    if (fontSize === "large") {
      setFontSize("largest");
      showConfirmation("Text size increased to Largest");
    }
  };

  const decreaseFontSize = (): void => {
    if (fontSize === "largest") {
      setFontSize("large");
      showConfirmation("Text size decreased to Large");
    }
    if (fontSize === "large") {
      setFontSize("medium");
      showConfirmation("Text size decreased to Medium");
    }
    if (fontSize === "medium") {
      setFontSize("small");
      showConfirmation("Text size decreased to Small");
    }
  };

  // Keyboard detection effect
  useEffect(() => {
    const initialViewportHeight = window.innerHeight;

    if (window.visualViewport) {
      const handleVisualViewportResize = debounce((): void => {
        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current);
          resizeTimeoutRef.current = null;
        }

        const currentHeight = window.visualViewport!.height;
        const heightDifference = initialViewportHeight - currentHeight;
        const percentageHeightReduction =
          heightDifference / initialViewportHeight;

        const keyboardLikelyVisible =
          percentageHeightReduction > 0.2 && heightDifference > 100;
        const keyboardLikelyClosing =
          isFullScreen &&
          keyboardVisible &&
          currentHeight >= initialViewportHeight - 20;

        if (isFullScreen) {
          if (keyboardLikelyVisible && !keyboardVisible) {
            setKeyboardVisible(true);
            setKeyboardHeight(heightDifference > 0 ? heightDifference : 0);
            setHeaderCollapsed(true);
          } else if (keyboardLikelyClosing) {
            resizeTimeoutRef.current = setTimeout(() => {
              setKeyboardVisible(false);
              setKeyboardHeight(0);
              setHeaderCollapsed(false);
              resizeTimeoutRef.current = null;
            }, 100);
          } else if (!keyboardLikelyVisible && keyboardVisible) {
            setKeyboardVisible(false);
            setKeyboardHeight(0);
            setHeaderCollapsed(false);
          }
        }
      }, 150);

      window.visualViewport.addEventListener(
        "resize",
        handleVisualViewportResize
      );

      return () => {
        window.visualViewport?.removeEventListener(
          "resize",
          handleVisualViewportResize
        );
      };
    }
  }, [isFullScreen, keyboardVisible]);

  return (
    <div className={styles["pb-main-layout"]}>
      {/* History Sidebar */}
      <ChatHistorySidebar
        isOpen={historySidebarOpen}
        onToggle={() => setHistorySidebarOpen(!historySidebarOpen)}
        chatCollection={chatCollection}
        onChatSelect={openChat}
      />

      {/* Main content */}
      <div className={styles["pb-main-content"]}>
        {/* Header with title, text size controls, and other controls */}
        <header
          className={`${styles["pb-header"]} ${
            headerCollapsed
              ? styles["pb-header-collapsed"]
              : styles["pb-header-padding"]
          }`}
        >
          <div className="flex items-center">
            {!historySidebarOpen && (
              <button
                onClick={() => setHistorySidebarOpen(true)}
                className={styles["pb-sidebar-btn"]}
                aria-label="Open menu"
              >
                <Menu size={28} />
              </button>
            )}
            <h1 className="font-medium text-3xl">CyberGuardian Chat</h1>
          </div>

          {/* Text size adjustment controls */}
          <div className={styles["pb-textsize-controls"]}>
            <button
              onClick={decreaseFontSize}
              className={`${styles["pb-textsize-btn"]} ${
                fontSize === "small"
                  ? styles["pb-textsize-btn-disabled"]
                  : styles["pb-textsize-btn-enabled"]
              }`}
              disabled={fontSize === "small"}
              aria-label="Decrease text size"
            >
              <MinusCircle size={24} />
              <span className="sr-only">Smaller Text</span>
            </button>
            <div className={styles["pb-textsize-label"]}>
              <Type size={24} />
              <span className="font-medium">
                Text Size:{" "}
                {fontSize.charAt(0).toUpperCase() + fontSize.slice(1)}
              </span>
            </div>
            <button
              onClick={increaseFontSize}
              className={`${styles["pb-textsize-btn"]} ${
                fontSize === "largest"
                  ? styles["pb-textsize-btn-disabled"]
                  : styles["pb-textsize-btn-enabled"]
              }`}
              disabled={fontSize === "largest"}
              aria-label="Increase text size"
            >
              <PlusCircle size={24} />
              <span className="sr-only">Larger Text</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              className={styles["pb-header-action-btn"]}
              onClick={() => setPromptBuilderOpen(!promptBuilderOpen)}
            >
              <Sliders size={24} />
              <span>
                {promptBuilderOpen
                  ? "Hide Customise Chat"
                  : "Show Customise Chat"}
              </span>
            </button>
            <button
              className={styles["pb-header-action-btn"]}
              onClick={resetChat}
            >
              <RotateCcw size={24} />
              <span>Reset Chat</span>
            </button>
            <button
              className={styles["pb-header-action-btn"]}
              onClick={() => signOut()}
            >
              <span>Log out</span>
            </button>
          </div>
        </header>

        {/* Confirmation message toast */}
        {confirmMessage && (
          <div className={styles["pb-toast-success"]}>{confirmMessage}</div>
        )}

        {/* Error message toast */}
        {showError && (
          <div className={styles["pb-toast-error"]}>
            An error occurred. Please try again.
            <button
              onClick={() => setShowError(false)}
              className={styles["pb-toast-dismiss"]}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Chat and Prompt Builder content area */}
        <div className={styles["pb-chat-area"]}>
          {/* Chat Panel */}
          <ChatPanel
            title={title}
            messages={messages}
            loading={loading}
            userInput={userInput}
            onInputChange={setUserInput}
            onSendMessage={handleSendMessage}
            fontSizes={fontSizes[fontSize]}
            keyboardHeight={keyboardHeight}
            keyboardVisible={keyboardVisible}
            isFullScreen={isFullScreen}
            comparisonMode={comparisonMode}
            comparisonMessages={comparisonMessages}
            comparisonCounter={comparisonCounter}
            onComparisonCounterChange={setComparisonCounter}
            onRefreshLatestMessage={refreshLatestMessage}
            onExitComparisonMode={handleExitComparisonMode}
            onConfigurationChange={handleConfigurationChange}
            currentPanelConfig={getCurrentDisplayConfig()}
            configColorMap={configColorMap}
            onOpenCustomisePanel={() => setPromptBuilderOpen((open) => !open)}
            isCustomisePanelOpen={promptBuilderOpen}
          />

          {/* Prompt Builder Sidebar */}
          <div
            className={`${styles["pb-promptbuilder-sidebar"]} ${
              promptBuilderOpen
                ? styles["pb-promptbuilder-sidebar-open"]
                : styles["pb-promptbuilder-sidebar-closed"]
            }`}
            style={{
              height:
                keyboardVisible && isFullScreen
                  ? `calc(100vh - ${keyboardHeight}px - 180px)`
                  : "auto",
            }}
          >
            <div className={styles["pb-promptbuilder-sidebar-header"]}>
              <div className="flex items-center justify-between">
                <h2
                  className={`${styles["pb-promptbuilder-sidebar-title"]} ${fontSizes[fontSize].header}`}
                >
                  Customise Chat Style
                </h2>
              </div>
            </div>

            <div
              className={styles["pb-promptbuilder-sidebar-content"]}
              style={{ maxHeight: "calc(100vh - 250px)" }}
            >
              <PromptBuilder
                comparisonConfigs={getComparisonMessageConfigs()}
                currentConfig={getCurrentDisplayConfig()}
                comparisonMessages={comparisonMessages}
                comparisonMode={comparisonMode}
                comparisonCounter={comparisonCounter}
                totalComparisons={comparisonMessages.length}
                fontSizes={fontSizes[fontSize]}
                configColorMap={configColorMap}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptBuilderChat;
