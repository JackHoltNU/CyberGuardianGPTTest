import React from "react";
import { Menu, ChevronRight } from "lucide-react";
import { ChatCollection, ChatInstance } from "../types/types";
import styles from "../styles/promptbuilder.module.css";

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  chatCollection: ChatCollection | undefined;
  onChatSelect: (chat: ChatInstance) => void;
}

const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  isOpen,
  onToggle,
  chatCollection,
  onChatSelect,
}) => {
  return (
    <div
      className={`${styles["pb-sidebar-container"]} ${
        isOpen
          ? styles["pb-sidebar-container-open"]
          : styles["pb-sidebar-container-closed"]
      }`}
    >
      <div className={styles["pb-sidebar-inner"]}>
        <div className={styles["pb-sidebar-header"]}>
          <h2
            className={`${styles["pb-sidebar-title"]} ${
              !isOpen ? styles["pb-sidebar-title-hidden"] : ""
            }`}
          >
            Chat History
          </h2>
          <button
            onClick={onToggle}
            className={styles["pb-sidebar-toggle-btn"]}
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? <ChevronRight size={28} /> : <Menu size={28} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chatCollection && chatCollection.chats.length > 0 ? (
            <div className={styles["pb-sidebar-chats-list"]}>
              {chatCollection.chats.map((chat) => (
                <div
                  key={chat.threadID}
                  className={styles["pb-sidebar-chat-item"]}
                  onClick={() => onChatSelect(chat)}
                >
                  <div className={styles["pb-sidebar-chat-title"]}>
                    {chat.title || "Untitled Chat"}
                  </div>
                  <div className={styles["pb-sidebar-chat-preview"]}>
                    {chat.messages && chat.messages.length > 0
                      ? typeof chat.messages[chat.messages.length - 1].text ===
                        "string"
                        ? (
                            chat.messages[chat.messages.length - 1]
                              .text as string
                          ).substring(0, 30) + "..."
                        : "Loading..."
                      : "No messages"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles["pb-sidebar-empty"]}>
              No previous conversations
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHistorySidebar;
