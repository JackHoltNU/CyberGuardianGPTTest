// app/utils/exportchats.tsx
import { ChatCollection, ChatInstance, MessageHistory } from "../types/types";
import * as XLSX from "xlsx";

// Function to export chats to CSV
export const exportChatsToCSV = (
  chatCollection: ChatCollection,
  currentUsername: string
): void => {
  if (!chatCollection || chatCollection.chats.length === 0) {
    alert("No chats to export");
    return;
  }

  // Create CSV header
  let csvContent =
    "Chat Title,Thread ID,Dual Chat ID, Configuration Name, Model, Prompt, FormatPrompt, Message ID,User,Sender,Timestamp,Message,Upvoted,Downvoted,Comments\n";

  // Process each chat
  chatCollection.chats.forEach((chat) => {
    if (!chat.title) return; // Skip chats without titles

    // Process each message in the chat
    chat.messages.forEach((message) => {
      // Format the message text - replace newlines and commas to prevent CSV breakage
      const formattedMessage =
        typeof message.text === "string"
          ? `"${message.text.replace(/"/g, '""').replace(/\n/g, " ")}"`
          : '""';

      const formattedPrompt =
      typeof message.mainPrompt === "string"
        ? `"${message.mainPrompt.replace(/"/g, '""').replace(/\n/g, " ")}"`
        : '""';
        
      const formattedFormatPrompt =
      typeof message.formatPrompt === "string"
        ? `"${message.formatPrompt.replace(/"/g, '""').replace(/\n/g, " ")}"`
        : '""';

      // Format comments
      const comments = message.messageRating?.comments
        ? `"${message.messageRating.comments.join(" | ").replace(/"/g, '""')}"`
        : '""';

      // Build CSV line
      const line = [
        `"${chat.title.replace(/"/g, '""')}"`,
        chat.threadID,
        chat.dualChatID || "",
        chat.configName || "",
        message.model || "",
        formattedPrompt,
        formattedFormatPrompt,
        message.id || "",
        chat.user || "",
        message.sender,
        message.timestamp ? new Date(message.timestamp).toISOString() : "",
        formattedMessage,
        message.messageRating?.upvoted ? "Yes" : "No",
        message.messageRating?.downvoted ? "Yes" : "No",
        comments,
      ].join(",");

      csvContent += line + "\n";
    });
  });

  // Create a download link
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${currentUsername}-chats-${new Date().toISOString().slice(0, 10)}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Function to export chats to Excel
export const exportChatsToExcel = (
  chatCollection: ChatCollection,
  currentUsername: string
): void => {
  if (!chatCollection || chatCollection.chats.length === 0) {
    alert("No chats to export");
    return;
  }

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();

  // Create data rows for all chats
  const data: any[] = [];

  // Add headers
  data.push([
    "Chat Title",
    "Thread ID",
    "Dual Chat ID",
    "Configuration Name", 
    "Model", 
    "Prompt", 
    "FormatPrompt", 
    "Message ID",
    "User",
    "Sender",
    "Timestamp",
    "Message",
    "Upvoted",
    "Downvoted",
    "Comments",
  ]);

  // Process each chat
  chatCollection.chats.forEach((chat) => {
    if (!chat.title) return; // Skip chats without titles

    // Process each message in the chat
    chat.messages.forEach((message) => {
      // Format message text
      const formattedText =
        typeof message.text === "string" ? message.text : "";

      // Format comments
      const comments = message.messageRating?.comments
        ? message.messageRating.comments.join(" | ")
        : "";

      // Add row to data
      data.push([
        chat.title,
        chat.threadID,
        chat.dualChatID || "",
        chat.configName || "",
        message.model || "",
        message.mainPrompt || "",
        message.formatPrompt || "",
        message.id || "",
        chat.user || "",
        message.sender,
        message.timestamp ? new Date(message.timestamp).toISOString() : "",
        formattedText,
        message.messageRating?.upvoted ? "Yes" : "No",
        message.messageRating?.downvoted ? "Yes" : "No",
        comments,
      ]);
    });
  });

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Auto-size columns (approximation)
  const colWidths = data[0].map((_: any, i: string | number) =>
    Math.max(...data.map((row) => (row[i] ? String(row[i]).length : 0)))
  );

  ws["!cols"] = colWidths.map((width: number) => ({
    width: Math.min(width, 50),
  }));

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Chats");

  // Generate Excel file and trigger download
  XLSX.writeFile(
    wb,
    `${currentUsername}-chats-${new Date().toISOString().slice(0, 10)}.xlsx`
  );
};

// Function to export a single chat to Excel
export const exportSingleChatToExcel = (
  chat: ChatInstance,
  currentUsername: string
): void => {
  if (!chat || !chat.messages || chat.messages.length === 0) {
    alert("No messages to export");
    return;
  }

  const wb = XLSX.utils.book_new();
  const data: any[] = [];

  // Add headers
  data.push([
    "User",
    "Sender",
    "Timestamp",
    "Message",
    "Upvoted",
    "Downvoted",
    "Comments",
  ]);

  // Process each message
  chat.messages.forEach((message) => {
    // Format message text
    const formattedText = typeof message.text === "string" ? message.text : "";

    // Format comments
    const comments = message.messageRating?.comments
      ? message.messageRating.comments.join(" | ")
      : "";

    // Add row to data
    data.push([
      chat.user || currentUsername, // Use chat.user if available, fall back to current username
      message.sender,
      message.timestamp ? new Date(message.timestamp).toISOString() : "",
      formattedText,
      message.messageRating?.upvoted ? "Yes" : "No",
      message.messageRating?.downvoted ? "Yes" : "No",
      comments,
    ]);
  });

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Chat");

  // Generate Excel file and trigger download
  const chatTitle = chat.title || "chat";
  const sanitizedTitle = chatTitle.replace(/[^a-z0-9]/gi, "_").substring(0, 20);
  XLSX.writeFile(
    wb,
    `${currentUsername}-${sanitizedTitle}-${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`
  );
};
