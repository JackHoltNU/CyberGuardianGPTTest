import React from "react";
import { Menu, ChevronRight } from "lucide-react";
import { ChatCollection, ChatInstance } from "../types/types";

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
      className={`fixed md:relative h-full z-10 bg-gray-800 text-white transition-all duration-300 ${
        isOpen ? "w-72" : "w-0"
      } overflow-hidden shadow-lg`}
    >
      <div className="flex flex-col h-full">
        <div className="p-6 flex items-center justify-between">
          <h2
            className={`font-semibold whitespace-nowrap text-xl ${
              !isOpen && "md:hidden"
            }`}
          >
            Chat History
          </h2>
          <button
            onClick={onToggle}
            className="p-3 rounded hover:bg-gray-700 text-gray-300 min-w-14 min-h-14 flex items-center justify-center"
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? <ChevronRight size={28} /> : <Menu size={28} />}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {chatCollection && chatCollection.chats.length > 0 ? (
            <div className="space-y-2 px-4">
              {chatCollection.chats.map((chat) => (
                <div
                  key={chat.threadID}
                  className="p-3 hover:bg-gray-700 rounded-lg cursor-pointer"
                  onClick={() => onChatSelect(chat)}
                >
                  <div className="text-white font-medium truncate">
                    {chat.title || "Untitled Chat"}
                  </div>
                  <div className="text-sm text-gray-400 truncate">
                    {chat.messages && chat.messages.length > 0
                      ? typeof chat.messages[chat.messages.length - 1].text === "string"
                        ? (chat.messages[chat.messages.length - 1].text as string).substring(0, 30) + "..."
                        : "Loading..."
                      : "No messages"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-4 text-gray-400">
              No previous conversations
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHistorySidebar;