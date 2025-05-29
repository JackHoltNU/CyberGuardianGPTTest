import React, { useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface FontSizes {
  chat: string;
  input: string;
  header: string;
}

interface MessageInputProps {
  userInput: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  fontSizes: FontSizes;
  comparisonMode: boolean;
  onExitComparisonMode: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  userInput,
  onInputChange,
  onSendMessage,
  fontSizes,
  comparisonMode,
  onExitComparisonMode,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea function
  const autoResizeTextarea = (textarea: HTMLTextAreaElement | null): void => {
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 150); // Max height 150px
      textarea.style.height = `${newHeight}px`;
    }
  };

  // Apply auto-resize on input change
  useEffect(() => {
    autoResizeTextarea(textareaRef.current);
  }, [userInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="border-t-2 border-gray-200 p-4 relative">
      {!comparisonMode ? (
        <div className="flex items-center bg-gray-100 rounded-lg p-3 border border-gray-300">
          <textarea
            ref={textareaRef}
            className={`flex-1 bg-transparent outline-none resize-none min-h-8 max-h-40 overflow-y-auto p-2 ${fontSizes.input}`}
            placeholder="Type your message..."
            rows={1}
            value={userInput}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ height: "42px" }}
          />
          <button
            className="p-4 ml-3 flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg min-w-16 min-h-16 flex items-center justify-center transition-colors duration-200 border-2 border-indigo-400 gap-2"
            onClick={onSendMessage}
            aria-label="Send message"
          >
            <Send size={28} />
            <span className="font-medium">Send</span>
          </button>
        </div>
      ) : (
        <div className="flex px-4 relative items-center justify-center">
          <button
            className="p-4 ml-3 flex-shrink-0 bg-teal-500 hover:bg-teal-600 text-white rounded-lg shadow-lg min-w-16 min-h-16 flex items-center justify-center transition-colors duration-200 border-2 border-teal-400 gap-2"
            onClick={onExitComparisonMode}
            aria-label="Accept configuration"
          >
            <span className="font-medium">Continue with this configuration</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageInput;