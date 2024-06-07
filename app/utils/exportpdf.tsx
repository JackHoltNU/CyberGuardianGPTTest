import { jsPDF } from 'jspdf';
import { MessageHistory } from '../hooks/useChatbot';

const exportChatAsPdf = async (chatData: Array<MessageHistory>) => {
  const doc = new jsPDF();
  let y = 20; // Starting Y position
  const maxwidth = 180;

  for (const { sender, text } of chatData) {
    const resolvedText = await (typeof text === 'string' ? Promise.resolve(text) : text);
    const senderText = sender === 'user' ? 'User' : 'CyberGuardian GPT';

    doc.setTextColor(sender === 'user' ? 200 : 0, 0, 0); // Different color for user and gpt

    // Wrap text within the specified maximum width
    const splitText = doc.splitTextToSize(`${senderText}: ${resolvedText}`, maxwidth);

    for (const line of splitText){
      doc.text(line, 10, y);
      y += 10; // Line height

      // Add a page break if necessary
      if (y > 280) { // Adjust the threshold as needed
        doc.addPage();
        y = 20; // Reset Y position for the new page
      }
    }    
  }

  doc.save('chat.pdf');
};

export default exportChatAsPdf;