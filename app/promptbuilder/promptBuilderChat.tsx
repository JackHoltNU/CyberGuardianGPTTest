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
    setComparisonMessages
  } = useChatbot();

  const { systemPrompt, getCurrentConfiguration, applyConfiguration } = usePromptBuilder();

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

  // Set the user when session is available
  useEffect(() => {
    if (session.user?.name) {
      setUser(session.user.name);
    }
    loadUserChats();
  }, [session]);

  // Handle sending a message with the system prompt
  const handleSendMessage = async () => {
    const text = userInput.trim();
    if (text === "") return;

    setUserInput("");
    setLoading(true);

    try {
      await sendMessage(text, systemPrompt, getCurrentConfiguration());
      setComparisonMessages([]);
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

  const refreshLatestMessage = async () => {
    setLoading(true);
    setComparisonMode(true);
    setComparisonCounter(comparisonCounter + 1);
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
        const percentageHeightReduction = heightDifference / initialViewportHeight;

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

      window.visualViewport.addEventListener("resize", handleVisualViewportResize);

      return () => {
        window.visualViewport?.removeEventListener("resize", handleVisualViewportResize);
      };
    }
  }, [isFullScreen, keyboardVisible]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* History Sidebar */}
      <ChatHistorySidebar
        isOpen={historySidebarOpen}
        onToggle={() => setHistorySidebarOpen(!historySidebarOpen)}
        chatCollection={chatCollection}
        onChatSelect={openChat}
      />

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header with title, text size controls, and other controls */}
        <header
          className={`bg-gray-100 text-gray-800 border-b border-gray-200 flex items-center justify-between transition-all duration-300 ${
            headerCollapsed ? "h-0 p-0 overflow-hidden opacity-0" : "p-4"
          }`}
        >
          <div className="flex items-center">
            {!historySidebarOpen && (
              <button
                onClick={() => setHistorySidebarOpen(true)}
                className="mr-4 p-3 rounded hover:bg-gray-200 min-w-14 min-h-14 flex items-center justify-center shadow border border-gray-300"
                aria-label="Open menu"
              >
                <Menu size={28} />
              </button>
            )}
            <h1 className="font-medium text-3xl">CyberGuardian Chat</h1>
          </div>

          {/* Text size adjustment controls */}
          <div className="flex items-center justify-between bg-gray-200 rounded-lg p-2 mr-3 border border-gray-300 shadow w-1/3">
            <button
              onClick={decreaseFontSize}
              className={`p-3 rounded-lg hover:bg-gray-300 ${
                fontSize === "small"
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700"
              } border border-gray-300 shadow`}
              disabled={fontSize === "small"}
              aria-label="Decrease text size"
            >
              <MinusCircle size={24} />
              <span className="sr-only">Smaller Text</span>
            </button>
            <div className="px-3 flex items-center gap-2 text-lg">
              <Type size={24} />
              <span className="font-medium">
                Text Size: {fontSize.charAt(0).toUpperCase() + fontSize.slice(1)}
              </span>
            </div>
            <button
              onClick={increaseFontSize}
              className={`p-3 rounded-lg hover:bg-gray-300 ${
                fontSize === "largest"
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700"
              } border border-gray-300 shadow`}
              disabled={fontSize === "largest"}
              aria-label="Increase text size"
            >
              <PlusCircle size={24} />
              <span className="sr-only">Larger Text</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="px-4 py-3 text-lg bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center gap-2 min-h-14 border border-gray-300 shadow"
              onClick={() => setPromptBuilderOpen(!promptBuilderOpen)}
            >
              <Sliders size={24} />
              <span>
                {promptBuilderOpen ? "Hide Customise Chat" : "Show Customise Chat"}
              </span>
            </button>
            <button
              className="px-4 py-3 text-lg bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center gap-2 min-h-14 border border-gray-300 shadow"
              onClick={resetChat}
            >
              <RotateCcw size={24} />
              <span>Reset Chat</span>
            </button>
            <button
              className="px-4 py-3 text-lg bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center gap-2 min-h-14 border border-gray-300 shadow"
              onClick={() => signOut()}
            >
              <span>Log out</span>
            </button>
          </div>
        </header>

        {/* Confirmation message toast */}
        {confirmMessage && (
          <div className="fixed z-50 top-4 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-800 px-6 py-4 rounded-lg shadow-lg border border-green-200 text-lg">
            {confirmMessage}
          </div>
        )}

        {/* Error message toast */}
        {showError && (
          <div className="fixed z-50 top-4 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-800 px-6 py-4 rounded-lg shadow-lg border border-red-200 text-lg">
            An error occurred. Please try again.
            <button
              onClick={() => setShowError(false)}
              className="ml-3 text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Chat and Prompt Builder content area */}
        <div className="flex flex-1 p-6 gap-6 overflow-hidden justify-center">
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
            onExitComparisonMode={() => setComparisonMode(false)}
            onConfigurationChange={handleConfigurationChange}
          />

          {/* Prompt Builder Sidebar */}
          <div
            className={`bg-white rounded-lg overflow-hidden border-gray-300 right-0 transition-all duration-500 ease ${
              promptBuilderOpen
                ? "flex-2 basis-1/2 border-2 shadow-lg"
                : "basis-0 w-0"
            }`}
            style={{
              height:
                keyboardVisible && isFullScreen
                  ? `calc(100vh - ${keyboardHeight}px - 180px)`
                  : "auto",
            }}
          >
            <div className="p-4 border-b border-gray-200 bg-indigo-600 text-white">
              <div className="flex items-center justify-between">
                <h2 className={`font-semibold ${fontSizes[fontSize].header} text-nowrap`}>
                  Customise Chat Style
                </h2>
              </div>
            </div>

            <div
              className="p-4 space-y-6 overflow-y-auto"
              style={{ maxHeight: "calc(100vh - 250px)" }}
            >
              <PromptBuilder />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptBuilderChat;