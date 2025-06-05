import React, { useRef, useEffect } from "react";
import { Send } from "lucide-react";
import styles from "../styles/promptbuilder.module.css";

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
    <div className={styles["pb-messageinput-container"]}>
      {!comparisonMode ? (
        <div className={styles["pb-messageinput-inner"]}>
          <textarea
            ref={textareaRef}
            className={`${styles["pb-messageinput-textarea"]} ${fontSizes.input}`}
            placeholder="Type your message..."
            rows={1}
            value={userInput}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ height: "42px" }}
          />
          <button
            className={styles["pb-messageinput-send-btn"]}
            onClick={onSendMessage}
            aria-label="Send message"
          >
            <Send size={28} />
            <span className="font-medium">Send</span>
          </button>
        </div>
      ) : (
        <div className={styles["pb-messageinput-continue-row"]}>
          <button
            className={styles["pb-messageinput-continue-btn"]}
            onClick={onExitComparisonMode}
            aria-label="Accept configuration"
          >
            <span className="font-medium">
              Continue with this configuration
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageInput;
