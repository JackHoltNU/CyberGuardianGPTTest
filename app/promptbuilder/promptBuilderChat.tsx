"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronRight,
  Settings,
  RotateCcw,
  Type,
  MinusCircle,
  PlusCircle,
  Sliders,
  ZoomIn,
  ZoomOut,
  LogOut,
  X as CloseIcon,
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
    user,
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
      chat: "0.95rem",
      input: "0.95rem",
      header: "1.1rem",
    },
    medium: {
      chat: "1.05rem",
      input: "1.05rem",
      header: "1.25rem",
    },
    large: {
      chat: "1.15rem",
      input: "1.15rem",
      header: "1.4rem",
    },
    largest: {
      chat: "1.3rem",
      input: "1.3rem",
      header: "1.6rem",
    },
  };

  // Stable color assignment using useRef
  const configColorMapRef = useRef<Map<string, string>>(new Map());
  const colorIndexRef = useRef(0);

  // Track previous config for change detection
  const previousConfigRef = useRef<PromptConfiguration | null>(null);

  // State to detect vertical tablet (portrait, width 600-1024px)
  const [isTabletPortrait, setIsTabletPortrait] = useState(false);
  // State to detect mobile (width <= 600px)
  const [isMobile, setIsMobile] = useState(false);
  // State to detect compact header (width <= 1200px)
  const [isCompactHeader, setIsCompactHeader] = useState(false);

  // State to detect if title should be shown (width >= 900px)
  const [isShowTitle, setIsShowTitle] = useState(true);

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
  }, [session]);

  // Load chats after user is set
  useEffect(() => {
    if (user) {
      loadUserChats();
    }
  }, [user]);

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

  useEffect(() => {
    const checkTabletPortrait = () => {
      const mq = window.matchMedia(
        "(max-width: 1024px) and (min-width: 600px) and (orientation: portrait)"
      );
      setIsTabletPortrait(mq.matches);
    };
    checkTabletPortrait();
    window.addEventListener("resize", checkTabletPortrait);
    return () => window.removeEventListener("resize", checkTabletPortrait);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 600px)").matches);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const checkCompactHeader = () => {
      setIsCompactHeader(window.matchMedia("(max-width: 1200px)").matches);
    };
    checkCompactHeader();
    window.addEventListener("resize", checkCompactHeader);
    return () => window.removeEventListener("resize", checkCompactHeader);
  }, []);

  useEffect(() => {
    if (isMobile && promptBuilderOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, promptBuilderOpen]);

  useEffect(() => {
    const checkShowTitle = () => {
      setIsShowTitle(window.matchMedia("(min-width: 900px)").matches);
    };
    checkShowTitle();
    window.addEventListener("resize", checkShowTitle);
    return () => window.removeEventListener("resize", checkShowTitle);
  }, []);

  return (
    <div
      className={styles["pb-main-layout"]}
      style={
        {
          // Set CSS variable for font size
          "--pb-font-size": fontSizes[fontSize].chat,
        } as React.CSSProperties
      }
    >
      {/* History Sidebar */}
      <ChatHistorySidebar
        isOpen={historySidebarOpen}
        onToggle={() => setHistorySidebarOpen(!historySidebarOpen)}
        chatCollection={chatCollection}
        onChatSelect={openChat}
      />

      {/* Main content */}
      <div className={styles["pb-main-content"]}>
        {/* Sidepanel header for mobile landscape */}
        <div className={styles["pb-header-sidepanel"]}>
          <button
            onClick={() => setHistorySidebarOpen(true)}
            className={styles["pb-sidebar-btn"]}
            aria-label="Open menu"
            style={{ marginBottom: "1rem" }}
          >
            <ChevronRight size={24} />
          </button>
          <button
            onClick={decreaseFontSize}
            className={styles["pb-header-action-btn"]}
            aria-label="Decrease text size"
            disabled={fontSize === "small"}
            style={{ marginBottom: "0.5rem" }}
          >
            <ZoomOut size={22} />
          </button>
          <button
            onClick={increaseFontSize}
            className={styles["pb-header-action-btn"]}
            aria-label="Increase text size"
            disabled={fontSize === "largest"}
            style={{ marginBottom: "0.5rem" }}
          >
            <ZoomIn size={22} />
          </button>
          <button
            className={styles["pb-header-action-btn"]}
            onClick={() => setPromptBuilderOpen(!promptBuilderOpen)}
            aria-label={
              promptBuilderOpen ? "Hide Customise Chat" : "Show Customise Chat"
            }
            style={{ marginBottom: "0.5rem" }}
          >
            <Sliders size={24} />
          </button>
          <button
            className={styles["pb-header-action-btn"]}
            onClick={resetChat}
            aria-label="Reset Chat"
            style={{ marginBottom: "0.5rem" }}
          >
            <RotateCcw size={24} />
          </button>
          <button
            className={styles["pb-header-action-btn"]}
            onClick={() => signOut()}
            aria-label="Log out"
            style={{ marginBottom: "0.5rem" }}
          >
            <LogOut size={24} />
          </button>
        </div>
        {/* Header with title, text size controls, and other controls */}
        <header
          className={`${styles["pb-header"]} ${
            headerCollapsed
              ? styles["pb-header-collapsed"]
              : styles["pb-header-padding"]
          }`}
        >
          <div className="flex items-center gap-2">
            {!historySidebarOpen && (
              <button
                onClick={() => setHistorySidebarOpen(true)}
                className={styles["pb-sidebar-btn"]}
                aria-label="Open menu"
              >
                <ChevronRight size={24} />
              </button>
            )}
            {isShowTitle && (
              <h1 style={{ fontSize: "1.2em", margin: 0 }}>
                CyberGuardian Chat
              </h1>
            )}
            {/* Mobile font size controls */}
            {isMobile && (
              <>
                <button
                  onClick={decreaseFontSize}
                  className={styles["pb-header-action-btn"]}
                  aria-label="Decrease text size"
                  disabled={fontSize === "small"}
                >
                  <ZoomOut size={22} />
                </button>
                <button
                  onClick={increaseFontSize}
                  className={styles["pb-header-action-btn"]}
                  aria-label="Increase text size"
                  disabled={fontSize === "largest"}
                >
                  <ZoomIn size={22} />
                </button>
              </>
            )}
          </div>

          {/* Text size adjustment controls (hide on mobile) */}
          {!isMobile && (
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
          )}

          <div className="flex items-center gap-2">
            <button
              className={styles["pb-header-action-btn"]}
              onClick={() => setPromptBuilderOpen(!promptBuilderOpen)}
              aria-label={
                promptBuilderOpen
                  ? "Hide Customise Chat"
                  : "Show Customise Chat"
              }
            >
              <Sliders size={24} />
              {!isCompactHeader && (
                <span>
                  {promptBuilderOpen
                    ? "Hide Customise Chat"
                    : "Show Customise Chat"}
                </span>
              )}
            </button>
            <button
              className={styles["pb-header-action-btn"]}
              onClick={resetChat}
              aria-label="Reset Chat"
            >
              <RotateCcw size={24} />
              {!isCompactHeader && <span>Reset Chat</span>}
            </button>
            <button
              className={styles["pb-header-action-btn"]}
              onClick={() => signOut()}
              aria-label="Log out"
            >
              {isCompactHeader ? <LogOut size={24} /> : <Settings size={24} />}
              {!isCompactHeader && <span>Log out</span>}
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
          {/* Chat Panel (hide on mobile when prompt builder is open) */}
          {!(isMobile && promptBuilderOpen) && (
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
              centered={!promptBuilderOpen && !isTabletPortrait}
              bottomOffset={
                isTabletPortrait && promptBuilderOpen ? "45vh" : "0"
              }
              fullWidth={isTabletPortrait}
            />
          )}

          {/* Prompt Builder Sidebar */}
          <div
            className={
              `${styles["pb-promptbuilder-sidebar"]} ` +
              (isTabletPortrait && promptBuilderOpen
                ? styles["pb-promptbuilder-sidebar-bottom"]
                : promptBuilderOpen
                ? styles["pb-promptbuilder-sidebar-open"]
                : styles["pb-promptbuilder-sidebar-closed"])
            }
            style={{
              height:
                keyboardVisible && isFullScreen && !isTabletPortrait
                  ? `calc(100vh - ${keyboardHeight}px - 180px)`
                  : isTabletPortrait
                  ? undefined
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
                <button
                  onClick={() => setPromptBuilderOpen(false)}
                  className={styles["pb-header-action-btn"]}
                  aria-label="Close Customise Chat"
                >
                  <CloseIcon size={24} />
                </button>
              </div>
            </div>

            <div
              className={styles["pb-promptbuilder-sidebar-content"]}
              // style={{ maxHeight: "calc(100vh - 250px)" }}
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
