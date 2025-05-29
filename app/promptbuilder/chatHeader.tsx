import React from "react";
import { Bot } from "lucide-react";

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
    <div className="bg-indigo-600 text-white p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Bot size={28} />
        <h2 className={`font-semibold ${fontSizes.header}`}>
          {title || "New Chat"}
        </h2>
      </div>
    </div>
  );
};

export default ChatHeader;