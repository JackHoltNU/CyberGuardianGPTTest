import React from "react";
import { Bot } from "lucide-react";
import styles from "../styles/promptbuilder.module.css";

interface FontSizes {
  chat: string;
  input: string;
  header: string;
}

interface ChatHeaderProps {
  title: string;
  fontSizes: FontSizes;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ title, fontSizes }) => {
  return (
    <div className={styles["pb-chat-header"]}>
      <div className="flex items-center gap-3">
        <div className={styles["pb-chat-header-title-row"]}>
          <Bot size={28} />
          <h2
            className={`${styles["pb-chat-header-title"]} ${fontSizes.header}`}
          >
            {title || "New Chat"}
          </h2>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
