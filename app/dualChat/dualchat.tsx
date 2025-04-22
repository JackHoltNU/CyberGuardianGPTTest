"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Menu,
  Settings,
  RotateCcw,
  X,
  Bot,
  ChevronRight,
  ArrowDown,
  Type,
  MinusCircle,
  PlusCircle,
  Minimize,
  Maximize,
} from "lucide-react";
import { useDualChat } from "../context/useDualChat";
import { AIConfigType } from "../types/types";
import { useRouter } from "next/navigation";
import DualChatConfigModal from "../components/dualChatConfigModal";
import { Session } from "next-auth";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LoadingDots from "../components/loadingdots";
import { debounce } from "../utils/debounce";

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

const DualChatbotInterface = ({ session }: Props) => {
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

  // Input state for both chat windows
  const [leftInput, setLeftInput] = useState<string>("");
  const [rightInput, setRightInput] = useState<string>("");
  const [chatNameA, setChatNameA] = useState<string>("");
  const [chatNameB, setChatNameB] = useState<string>("");
  const [leftLoading, setLeftLoading] = useState(false);
  const [rightLoading, setRightLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [debugText, setDebugText] = useState("");


  const router = useRouter();

  // Font size state (default: medium)
  const [fontSize, setFontSize] = useState<FontSizeOption>("medium");

  // Confirmation message
  const [confirmMessage, setConfirmMessage] = useState<string>("");

  // Show confirmation message and automatically hide it
  const showConfirmation = (message: string): void => {
    //setConfirmMessage(message);
    //setTimeout(() => setConfirmMessage(""), 3000);
  };

  // Text size options with increased sizes
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

  useEffect(() => {
    if (session.user?.name) {
      setUser(session.user.name);
    }

    // Load available configs
    loadAllConfigs();
  }, [session]);

  useEffect(() => {
    const handleFullScreenChange = (): void => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

  const handleLeftSendMessage = async () => {
    const text = leftInput.trim();
    if (text === "") return;

    setLeftInput("");
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
    const text = rightInput.trim();

    if (text === "") return;

    setRightInput("");
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

  const handleConfigSelect = (
    configA: AIConfigType,
    configB: AIConfigType,
    randomize: boolean
  ) => {
    createNewDualChat(configA, configB, randomize);
  };

  const toggleFullScreen = (): void => {
    if (!document.fullscreenElement) {
      // Enter full screen
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(
          `Error attempting to enable full-screen mode: ${err.message}`
        );
      });
      setIsFullScreen(true);
    } else {
      // Exit full screen
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  // Refs for auto-resize textareas
  const leftTextareaRef = useRef<HTMLTextAreaElement>(null);
  const rightTextareaRef = useRef<HTMLTextAreaElement>(null);
  const leftChatRef = useRef<HTMLDivElement>(null);
  const rightChatRef = useRef<HTMLDivElement>(null);

  // Active bot state
  const [activeBot, setActiveBot] = useState<"left" | "right">("left");

  // Side panel state
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Keyboard state
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const [headerCollapsed, setHeaderCollapsed] = useState<boolean>(false);

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

  // Auto-resize textarea function
  const autoResizeTextarea = (textarea: HTMLTextAreaElement | null): void => {
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 150); // Max height 150px
      textarea.style.height = `${newHeight}px`;
    }
  };

  // If no configs are set, show the config modal on load
  useEffect(() => {
    if (availableConfigs.length >= 2 && !leftConfig && !rightConfig) {
      setShowConfigModal(true);
    }
  }, [availableConfigs, leftConfig, rightConfig]);

  // Apply auto-resize on input change
  useEffect(() => {
    autoResizeTextarea(leftTextareaRef.current);
  }, [leftInput]);

  useEffect(() => {
    autoResizeTextarea(rightTextareaRef.current);
  }, [rightInput]);

  // Scroll to the bottom of chat when keyboard appears or new message arrives
  const scrollToBottom = (chatRef: React.RefObject<HTMLDivElement>): void => {
    if (chatRef && chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom(leftChatRef);
  }, [leftMessages]);

  useEffect(() => {
    scrollToBottom(rightChatRef);
  }, [rightMessages]);

  useEffect(() => {
    // Initial viewport height
    const initialViewportHeight = window.innerHeight;


    let isResizingWindow = false;
  
  // Add window resize detection
  const handleWindowResize = () => {
    isResizingWindow = true;
    // Reset after a short delay
    setTimeout(() => {
      isResizingWindow = false;
    }, 500);
  };

    // Use visualViewport API for more accurate keyboard detection
    if (window.visualViewport && !isResizingWindow) {
      const handleVisualViewportResize = (): void => {
        // Calculate height reduction as a percentage
        const currentHeight = window.visualViewport!.height;        
        const heightDifference = initialViewportHeight - currentHeight;
        const percentageHeightReduction = heightDifference / initialViewportHeight;

        const keyboardLikelyVisible = percentageHeightReduction > 0.20 && heightDifference > 100; // Added absolute check

        if (isFullScreen) { // Only apply logic in full screen
           if (keyboardLikelyVisible) {
              if (!keyboardVisible) { // Check current state before setting
                 setDebugText("Keyboard is likely visible, setting keyboard to visible");
                 setKeyboardVisible(true);
                 setKeyboardHeight(heightDifference > 0 ? heightDifference : 0); // Ensure positive height
                 setHeaderCollapsed(true);
              } else {
                setDebugText("Keyboard is likely visible but was already set to visible");
              }
           } else {
              if (keyboardVisible) { // Check current state before setting
                 setDebugText("Keyboard is likely not visible, setting keyboard to not visible");
                 setKeyboardVisible(false);
                 setKeyboardHeight(0);
                 setHeaderCollapsed(false);
              } else {
                setDebugText("Keyboard is likely not visible and was already set to not visible")
              }
           }
        } 
      };



        // Additional checks to distinguish keyboard from window resize:
      // 2. Make sure it's a significant height change     
      
    //   if (isFullScreen && !keyboardVisible && percentageHeightReduction > 0.25) {
    //     setKeyboardVisible(true);
    //     setKeyboardHeight(heightDifference);
    //     setHeaderCollapsed(true);
    //   }else {
    //     setKeyboardVisible(false);
    //     setKeyboardHeight(0);
    //     setHeaderCollapsed(false);
    //   } 
          
        // Only treat significant height reductions as keyboard appearance
        // if (heightReduction > 0.25) {
        //   setKeyboardVisible(true);
        //   setHeaderCollapsed(true);

        //   // Scroll to bottom of active chat
        //   setTimeout(() => {
        //     if (activeBot === "left") {
        //       scrollToBottom(leftChatRef);
        //     } else {
        //       scrollToBottom(rightChatRef);
        //     }
        //   }, 100);
        // } else {
        //   setKeyboardVisible(false);
        //   setHeaderCollapsed(false);
        // }
      //};

      const debouncedVisualViewportResize = debounce(handleVisualViewportResize,150);

      // browser resized, ignore viewport resize
      window.addEventListener('resize', handleWindowResize);

      // viewport resize only, assume keyboard
      window.visualViewport.addEventListener(
        "resize",
        debouncedVisualViewportResize
      );

      return () => {
        window.removeEventListener('resize', handleWindowResize);
        window.visualViewport?.removeEventListener(
          "resize",
          debouncedVisualViewportResize
        );
      };
     } //else {
    //   // Fallback for browsers that don't support visualViewport API
    //   const handleFocus = (): void => {
        
    //       setKeyboardVisible(true);
    //       setHeaderCollapsed(true);
    //       setTimeout(() => {
    //         if (activeBot === "left") {
    //           scrollToBottom(leftChatRef);
    //         } else {
    //           scrollToBottom(rightChatRef);
    //         }
    //       }, 300);
        
    //   };

    //   const handleBlur = (): void => {
    //     setKeyboardVisible(false);
    //     setHeaderCollapsed(false);
    //   };

    //   if (leftTextareaRef.current) {
    //     leftTextareaRef.current.addEventListener("focus", handleFocus);
    //     leftTextareaRef.current.addEventListener("blur", handleBlur);
    //   }

    //   if (rightTextareaRef.current) {
    //     rightTextareaRef.current.addEventListener("focus", handleFocus);
    //     rightTextareaRef.current.addEventListener("blur", handleBlur);
    //   }

    //   return () => {
    //     if (leftTextareaRef.current) {
    //       leftTextareaRef.current.removeEventListener("focus", handleFocus);
    //       leftTextareaRef.current.removeEventListener("blur", handleBlur);
    //     }
    //     if (rightTextareaRef.current) {
    //       rightTextareaRef.current.removeEventListener("focus", handleFocus);
    //       rightTextareaRef.current.removeEventListener("blur", handleBlur);
    //     }
    //   };
    // }
  }, [activeBot, isFullScreen, keyboardVisible, keyboardHeight, headerCollapsed]);

  // Function to dismiss keyboard (iOS specific)
  const dismissKeyboard = (): void => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed md:relative h-full z-10 bg-gray-800 text-white transition-all duration-300 ${
          sidebarOpen ? "w-72" : "w-0"
        } overflow-hidden shadow-lg`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between">
            <h2
              className={`font-semibold whitespace-nowrap text-xl ${
                !sidebarOpen && "md:hidden"
              }`}
            >
              History
            </h2>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-3 rounded hover:bg-gray-700 text-gray-300 min-w-14 min-h-14 flex items-center justify-center"
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            >
              {sidebarOpen ? <ChevronRight size={28} /> : <Menu size={28} />}
            </button>
          </div>          
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header with title, text size controls, and other controls */}
        <header
          className={`bg-gray-100 text-gray-800 border-b border-gray-200 flex items-center justify-between transition-all duration-300 ${
            headerCollapsed ? "h-0 p-0 overflow-hidden opacity-0" : "p-4"
          }`}
        >
          <div className="flex items-center">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="mr-4 p-3 rounded hover:bg-gray-200 min-w-14 min-h-14 flex items-center justify-center shadow border border-gray-300"
                aria-label="Open menu"
              >
                <Menu size={28} />
              </button>
            )}
            <h1 className={`font-medium text-3xl`}>
              Dual Chat
            </h1>
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
                Text Size:{" "}
                {fontSize.charAt(0).toUpperCase() + fontSize.slice(1)}
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
              onClick={() => setShowConfigModal(true)}
            >
              <Settings size={24} />              
            </button>
            <button
              className="px-4 py-3 text-lg bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center gap-2 min-h-14 border border-gray-300 shadow"
              onClick={resetDualChat}
            >
              <RotateCcw size={24} />
              <span>Reset Chat</span>
            </button>
            {/* <button
              className="p-3 rounded-lg hover:bg-gray-200 text-red-500 min-w-14 min-h-14 flex items-center justify-center border border-gray-300 shadow"
              aria-label="Exit application"
            >
              <X size={28} />
              <span className="sr-only">Exit</span>
            </button> */}
            <button
              className="px-4 py-3 text-lg bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center gap-2 min-h-14 border border-gray-300 shadow"
              onClick={toggleFullScreen}
              aria-label={
                isFullScreen ? "Exit full screen" : "Enter full screen"
              }
            >
              {isFullScreen ? (
                <>
                  <Minimize size={24} />
                  <span>Exit Full Screen</span>
                </>
              ) : (
                <>
                  <Maximize size={24} />
                  <span>Full Screen</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Confirmation message toast */}
        {confirmMessage && (
          <div className="fixed z-50 top-4 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-800 px-6 py-4 rounded-lg shadow-lg border border-green-200 text-lg">
            {confirmMessage}
          </div>
        )}

        {/* Chatbot content area */}
        <div className="flex flex-1 p-6 gap-6 overflow-hidden">
          {/* Left Chatbot */}
          <div
            className={`flex-1 flex flex-col bg-white rounded-lg shadow-lg overflow-hidden ${
              activeBot === "left"
                ? "ring-4 ring-indigo-500"
                : "border-2 border-gray-300"
            } `}
            style = {{height: (keyboardVisible && isFullScreen) ? `calc(100vh - ${keyboardHeight}px)` : "auto"}}
          >
            {/* Chatbot header */}
            <div
              className={`bg-indigo-600 text-white p-4 flex items-center justify-between ${
                headerCollapsed ? "h-16 py-2" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <Bot size={28} />
                <h2 className={`font-semibold ${fontSizes[fontSize].header}`}>
                  {/* {chatNameA} */}
                  {`${debugText}, visible: ${keyboardVisible}, header collapsed: ${headerCollapsed}`}
                </h2>
              </div>
              {/* Active indicator for more clarity */}
              {activeBot === "left" && (
                <div className="bg-white text-indigo-600 px-3 py-1 rounded-full text-base font-medium">
                  Active
                </div>
              )}
            </div>

            {/* Chat messages area with ref for keyboard scroll */}
            <div ref={leftChatRef} className="flex-1 p-5 overflow-y-auto">
              <div className="flex flex-col gap-4">
                {leftMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-lg p-4 rounded-lg ${
                        fontSizes[fontSize].chat
                      } ${
                        message.sender === "user"
                          ? "bg-indigo-100 text-gray-800 border border-indigo-200"
                          : "bg-gray-100 text-gray-800 border border-gray-300"
                      }`}
                    >
                      <ReactMarkdown
                        className="markdown-content"
                        remarkPlugins={[remarkGfm]}
                      >
                        {typeof message.text == "string"
                          ? message.text
                          : "Loading..."}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
                {leftLoading && (
                  <div key={"leftloading"} className={`flex justify-start`}>
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-lg p-4 rounded-lg ${fontSizes[fontSize].chat} bg-gray-100 text-gray-800 border border-gray-300`}
                    >
                      <LoadingDots />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input area with enhanced send button */}
            <div className="border-t-2 border-gray-200 p-4 relative">
              <div className="flex items-center bg-gray-100 rounded-lg p-3 border border-gray-300">
                <textarea
                  ref={leftTextareaRef}
                  className={`flex-1 bg-transparent outline-none resize-none min-h-8 max-h-40 overflow-y-auto p-2 ${fontSizes[fontSize].input}`}
                  placeholder="Type your message..."
                  rows={1}
                  value={leftInput}
                  onChange={(e) => setLeftInput(e.target.value)}
                  onFocus={() => setActiveBot("left")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleLeftSendMessage();
                    }
                  }}
                  style={{ height: "42px" }}
                />
                <button
                  className="p-4 ml-3 flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg min-w-16 min-h-16 flex items-center justify-center transition-colors duration-200 border-2 border-indigo-400 gap-2"
                  onClick={() => handleLeftSendMessage()}
                  aria-label="Send message"
                >
                  <Send size={28} />
                  <span className="font-medium">Send</span>
                </button>
              </div>

              {/* Keyboard dismiss button - only visible when keyboard is showing */}
              {/* {keyboardVisible && activeBot === "left" && (
                <button
                  onClick={dismissKeyboard}
                  className="absolute bottom-20 right-6 bg-indigo-600 text-white rounded-full p-4 shadow-lg border-2 border-indigo-400"
                  aria-label="Dismiss keyboard"
                >
                  <ArrowDown size={28} />
                  <span className="sr-only">Hide Keyboard</span>
                </button>
              )} */}
            </div>
          </div>

          {/* Right Chatbot */}
          <div
            className={`flex-1 flex flex-col bg-white rounded-lg shadow-lg overflow-hidden ${
              activeBot === "right"
                ? "ring-4 ring-teal-500"
                : "border-2 border-gray-300"
            }`}
            style = {{height: (keyboardVisible && isFullScreen) ? `calc(100vh - ${keyboardHeight}px)` : "auto"}}
          >
            {/* Chatbot header */}
            <div
              className={`bg-teal-600 text-white p-4 flex items-center justify-between ${
                headerCollapsed ? "h-16 py-2" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <Bot size={28} />
                <h2 className={`font-semibold ${fontSizes[fontSize].header}`}>
                  {/* {chatNameB} */}
                  {keyboardHeight}                  
                </h2>
              </div>
              {/* Active indicator for more clarity */}
              {activeBot === "right" && (
                <div className="bg-white text-teal-600 px-3 py-1 rounded-full text-base font-medium">
                  Active
                </div>
              )}
            </div>

            {/* Chat messages area with ref for keyboard scroll */}
            <div ref={rightChatRef} className="flex-1 p-5 overflow-y-auto" >
              <div className="flex flex-col gap-4">
                {rightMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-lg p-4 rounded-lg ${
                        fontSizes[fontSize].chat
                      } ${
                        message.sender === "user"
                          ? "bg-teal-100 text-gray-800 border border-teal-200"
                          : "bg-gray-100 text-gray-800 border border-gray-300"
                      }`}
                    >
                      <ReactMarkdown
                        className="markdown-content"
                        remarkPlugins={[remarkGfm]}
                      >
                        {typeof message.text == "string"
                          ? message.text
                          : "Loading..."}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
                {rightLoading && (
                  <div key={"rightloading"} className={`flex justify-start`}>
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-lg p-4 rounded-lg ${fontSizes[fontSize].chat} bg-gray-100 text-gray-800 border border-gray-300`}
                    >
                      <LoadingDots />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Input area with enhanced send button */}
            <div className="border-t-2 border-gray-200 p-4 relative">
              <div className="flex items-center bg-gray-100 rounded-lg p-3 border border-gray-300">
                <textarea
                  ref={rightTextareaRef}
                  className={`flex-1 bg-transparent outline-none resize-none min-h-8 max-h-40 overflow-y-auto p-2 ${fontSizes[fontSize].input}`}
                  placeholder="Type your message..."
                  rows={1}
                  value={rightInput}
                  onChange={(e) => setRightInput(e.target.value)}
                  onFocus={() => setActiveBot("right")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleRightSendMessage();
                    }
                  }}
                  style={{ height: "42px" }}
                />
                <button
                  className="p-4 ml-3 flex-shrink-0 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-lg min-w-16 min-h-16 flex items-center justify-center transition-colors duration-200 border-2 border-teal-400 gap-2"
                  onClick={() => handleRightSendMessage()}
                  aria-label="Send message"
                >
                  <Send size={28} />
                  <span className="font-medium">Send</span>
                </button>
              </div>

              {/* Keyboard dismiss button - only visible when keyboard is showing */}
              {/* {keyboardVisible && activeBot === "right" && (
                <button
                  onClick={dismissKeyboard}
                  className="absolute bottom-20 right-6 bg-teal-600 text-white rounded-full p-4 shadow-lg border-2 border-teal-400"
                  aria-label="Dismiss keyboard"
                >
                  <ArrowDown size={28} />
                  <span className="sr-only">Hide Keyboard</span>
                </button>
              )} */}
            </div>
            {showConfigModal && (
              <DualChatConfigModal
                closeModal={() => setShowConfigModal(false)}
                availableConfigs={availableConfigs}
                onConfigSelect={handleConfigSelect}
                chatNameA={chatNameA}
                chatNameB={chatNameB}
                setDisplayNames={(chatNameA: string, chatNameB: string) => {
                  setChatNameA(chatNameA);
                  setChatNameB(chatNameB);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DualChatbotInterface;
