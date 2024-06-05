import { MessageHistory } from "../hooks/useChatbot";

const exportChatAsText = (chatData: Array<MessageHistory>) => {
  const formattedChat = chatData.map(({ sender, text }) => {
    const resolvedText = typeof text === 'string' ? text : 'Loading...';
    return `${sender === 'user' ? 'User' : 'CyberGuardian GPT'}: ${resolvedText}`;
  }).join('\n');

  const blob = new Blob([formattedChat], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chat.txt';
  a.click();
  URL.revokeObjectURL(url);
};

export default exportChatAsText;