import React from 'react';

const exportChatAsText = (chatData: Array<{ sender: 'user' | 'bot', text: string | Promise<string> }>) => {
  const formattedChat = chatData.map(({ sender, text }) => {
    const resolvedText = typeof text === 'string' ? text : 'Loading...';
    return `${sender === 'user' ? 'User' : 'Bot'}: ${resolvedText}`;
  }).join('\n');
  console.log(formattedChat);

  const blob = new Blob([formattedChat], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chat.txt';
  a.click();
  URL.revokeObjectURL(url);
};

export default exportChatAsText;