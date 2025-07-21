import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/mongodb';
import Chat from '@/app/models/Chat';
import JSZip from 'jszip';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle, AlignmentType } from 'docx';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const participants = searchParams.get('participants')?.split(',').filter(Boolean);
    
    // Build query based on filters
    const query: any = {};
    
    if (participants && participants.length > 0) {
      query.user = { $in: participants };
    }
    
    if (startDate || endDate) {
      query.latestTimestamp = {};
      if (startDate) {
        query.latestTimestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.latestTimestamp.$lte = new Date(endDate);
      }
    }
    
    // Fetch all conversations
    const conversations = await Chat.find(query)
      .sort({ latestTimestamp: -1 })
      .lean();
    
    if (conversations.length === 0) {
      return NextResponse.json({ error: 'No conversations found for the selected criteria' }, { status: 404 });
    }
    
    // Group conversations by participant
    const conversationsByParticipant: { [username: string]: any[] } = {};
    
    conversations.forEach(conversation => {
      const username = conversation.user;
      if (!conversationsByParticipant[username]) {
        conversationsByParticipant[username] = [];
      }
      conversationsByParticipant[username].push(conversation);
    });
    
    // Create ZIP file with Word documents per participant
    const zip = new JSZip();
    const exportTimestamp = new Date();
    
    // Helper function to format dates
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };
    
    const formatDateTime = (date: Date) => {
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };
    
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };
    
    // Create Word document for each participant
    for (const [username, userConversations] of Object.entries(conversationsByParticipant)) {
      // Sort conversations by date (oldest first for chronological reading)
      const sortedConversations = userConversations.sort((a, b) => 
        new Date(a.latestTimestamp).getTime() - new Date(b.latestTimestamp).getTime()
      );
      
      // Calculate date range
      const earliestDate = sortedConversations[0]?.latestTimestamp ? new Date(sortedConversations[0].latestTimestamp) : new Date();
      const latestDate = sortedConversations[sortedConversations.length - 1]?.latestTimestamp ? 
        new Date(sortedConversations[sortedConversations.length - 1].latestTimestamp) : new Date();
      
      // Build document content
      const docElements: any[] = [];
      
      // Document header
      docElements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Participant: ${username}`,
              bold: true,
              size: 32
            })
          ],
          spacing: { after: 240 }
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: `Export Date: ${formatDate(exportTimestamp)}`,
              size: 24
            })
          ]
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: `Total Conversations: ${sortedConversations.length}`,
              size: 24
            })
          ]
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: `Study Period: ${formatDate(earliestDate)} - ${formatDate(latestDate)}`,
              size: 24
            })
          ],
          spacing: { after: 480 }
        }),
        
        // Separator line
        new Paragraph({
          children: [
            new TextRun({
              text: "═".repeat(80),
              size: 20
            })
          ],
          spacing: { after: 240 }
        })
      );
      
      // Add each conversation
      sortedConversations.forEach((conversation, conversationIndex) => {
        // Calculate conversation duration
        const messages = conversation.messages || [];
        const startTime = messages[0]?.timestamp ? new Date(messages[0].timestamp) : null;
        const endTime = messages[messages.length - 1]?.timestamp ? new Date(messages[messages.length - 1].timestamp) : null;
        let durationText = "";
        
        if (startTime && endTime && startTime.getTime() !== endTime.getTime()) {
          const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
          durationText = `Duration: ${durationMinutes} minutes (${formatTime(startTime)} - ${formatTime(endTime)})`;
        } else if (startTime) {
          durationText = `Time: ${formatTime(startTime)}`;
        }
        
        // Conversation header
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `CONVERSATION ${conversationIndex + 1}: ${conversation.title || 'Untitled'}`,
                bold: true,
                size: 28
              })
            ],
            spacing: { before: 240, after: 120 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Date: ${conversation.latestTimestamp ? formatDateTime(new Date(conversation.latestTimestamp)) : 'Unknown'}`,
                size: 22
              })
            ]
          })
        );
        
        if (durationText) {
          docElements.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: durationText,
                  size: 22
                })
              ]
            })
          );
        }
        
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Messages: ${messages.length}`,
                size: 22
              })
            ],
            spacing: { after: 240 }
          }),
          
          // Sub-separator
          new Paragraph({
            children: [
              new TextRun({
                text: "─".repeat(80),
                size: 18
              })
            ],
            spacing: { after: 240 }
          })
        );
        
        // Add messages
        messages.forEach((message: any) => {
          const messageTime = message.timestamp ? formatTime(new Date(message.timestamp)) : '';
          const senderLabel = message.sender === 'user' ? 'USER' : 
                             message.sender === 'assistant' ? 'ASSISTANT' : 'SYSTEM';
          
          docElements.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `[${senderLabel}${messageTime ? ` - ${messageTime}` : ''}]`,
                  bold: true,
                  size: 22
                })
              ],
              spacing: { before: 120, after: 60 }
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: message.text || '',
                  size: 22
                })
              ],
              spacing: { after: 240 }
            })
          );
        });
        
        // Conversation end separator (except for last conversation)
        if (conversationIndex < sortedConversations.length - 1) {
          docElements.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "═".repeat(80),
                  size: 20
                })
              ],
              spacing: { before: 240, after: 240 }
            })
          );
        }
      });
      
      // Create the document
      const doc = new Document({
        sections: [{
          properties: {},
          children: docElements
        }]
      });
      
      // Generate document buffer
      const buffer = await Packer.toBuffer(doc);
      
      // Add to ZIP
      zip.file(`${username}_conversations.docx`, buffer);
    }
    
    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    
    // Create filename with timestamp
    const filename = `study_conversations_word_export_${new Date().toISOString().split('T')[0]}.zip`;
    
    // Return ZIP file
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.byteLength.toString()
      }
    });
    
  } catch (error) {
    console.error('Error exporting conversations to Word:', error);
    return NextResponse.json(
      { error: 'Failed to export conversations to Word documents' },
      { status: 500 }
    );
  }
}
