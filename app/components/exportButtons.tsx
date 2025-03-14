// app/components/exportButtons.tsx
'use client'

import React, { useState } from "react";
import { ChatInstance, ChatCollection } from "../types/types";
import { exportChatsToCSV, exportChatsToExcel, exportSingleChatToExcel } from "../utils/exportchats";

interface ExportProps {
  user: string;
  currentChat?: ChatInstance;
  closeMenu: () => void;
}

const ExportButtons: React.FC<ExportProps> = ({ user, currentChat, closeMenu }) => {
  const [isExporting, setIsExporting] = useState(false);

  // Export current chat
  const handleExportCurrentChat = () => {
    if (currentChat) {
      exportSingleChatToExcel(currentChat, user);
      closeMenu();
    }
  };

  // Export all chats to CSV
  const handleExportAllChatsCSV = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/exportAllChats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch chats");
      }

      const chatCollection: ChatCollection = await response.json();
      exportChatsToCSV(chatCollection, user);
      closeMenu();
    } catch (error) {
      console.error("Error exporting chats:", error);
      alert("Failed to export chats. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Export all chats to Excel
  const handleExportAllChatsExcel = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/exportAllChats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch chats");
      }

      const chatCollection: ChatCollection = await response.json();
      exportChatsToExcel(chatCollection, user);
      closeMenu();
    } catch (error) {
      console.error("Error exporting chats:", error);
      alert("Failed to export chats. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      {currentChat && (
        <li>
          <button 
            className="more-options__item button--export-current" 
            onClick={handleExportCurrentChat}
            disabled={isExporting}
          >
            Export current chat to Excel
          </button>
        </li>
      )}
      <li>
        <button 
          className="more-options__item button--export-csv" 
          onClick={handleExportAllChatsCSV}
          disabled={isExporting}
        >
          Export all chats to CSV
        </button>
      </li>
      <li>
        <button 
          className="more-options__item button--export-excel" 
          onClick={handleExportAllChatsExcel}
          disabled={isExporting}
        >
          Export all chats to Excel
        </button>
      </li>
    </>
  );
};

export default ExportButtons;
