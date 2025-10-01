import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/mongodb';
import Chat from '@/app/models/Chat';
import UserProgress from '@/app/models/UserProgress';
import ConversationStarter from '@/app/models/ConversationStarter';
import { getServerSession } from 'next-auth';
import { options } from '../../auth/options';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const session = await getServerSession(options);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Get user progress data with daily interactions for study day calculations
    const userProgressData = await UserProgress.find({}, { username: 1, studyStartDate: 1, dailyInteractions: 1 }).lean();
    const userDailyInteractions: { [key: string]: any[] } = {};
    userProgressData.forEach((progress: any) => {
      userDailyInteractions[progress.username] = progress.dailyInteractions || [];
    });

    // Get active conversation starters
    const conversationStarters = await ConversationStarter.find({ isActive: true }, { text: 1 }).lean();
    const starterTexts = conversationStarters.map((starter: any) => starter.text.toLowerCase().trim());

    // Helper function to calculate study day based on actual engagement days
    const getStudyDay = (username: string, messageDate: Date): number | null => {
      const interactions = userDailyInteractions[username];
      if (!interactions || interactions.length === 0) return null;
      
      // Find which daily interaction this message belongs to
      const messageTime = messageDate.getTime();
      for (const interaction of interactions) {
        const interactionDate = new Date(interaction.date);
        const dayStart = new Date(interactionDate.getFullYear(), interactionDate.getMonth(), interactionDate.getDate()).getTime();
        const dayEnd = dayStart + (24 * 60 * 60 * 1000); // Add 24 hours
        
        if (messageTime >= dayStart && messageTime < dayEnd) {
          return interaction.day;
        }
      }
      
      return null; // Message doesn't fall within any recorded interaction day
    };

    // Helper function to check if message is a conversation starter
    const isConversationStarter = (text: string): boolean => {
      const normalizedText = text.toLowerCase().trim();
      return starterTexts.some(starter => normalizedText.includes(starter));
    };

    // Prepare data for worksheets
    const conversationsData: any[] = [];
    const messagesData: any[] = [];
    const dailyActivityMap: { [key: string]: any } = {}; // key: "username-studyDay"

    conversations.forEach(conversation => {
      const messages = conversation.messages || [];
      const firstMessage = messages.find((msg: any) => msg.sender === 'user');
      const startTime = messages[0]?.timestamp ? new Date(messages[0].timestamp) : null;
      const endTime = messages[messages.length - 1]?.timestamp ? new Date(messages[messages.length - 1].timestamp) : null;
      
      let duration = 0;
      if (startTime && endTime) {
        duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      }

      const studyDay = startTime ? getStudyDay(conversation.user, startTime) : null;
      const firstMessageText = firstMessage?.text || '';
      const isStarter = firstMessageText ? isConversationStarter(firstMessageText) : false;

      // Add to conversations data
      conversationsData.push({
        'Conversation ID': conversation.threadID,
        'Participant': conversation.user,
        'Title': conversation.title || 'Untitled',
        'Start Date': startTime ? startTime.toISOString() : '',
        'End Date': endTime ? endTime.toISOString() : '',
        'Duration (Minutes)': duration,
        'Message Count': messages.length,
        'Study Day': studyDay || '',
        'First Message': firstMessageText.length > 500 ? firstMessageText.substring(0, 500) + '...' : firstMessageText,
        'Is Conversation Starter': isStarter ? 'TRUE' : 'FALSE'
      });

      // Process messages
      messages.forEach((message: any, index: number) => {
        const messageTime = message.timestamp ? new Date(message.timestamp) : null;
        const messageStudyDay = messageTime ? getStudyDay(conversation.user, messageTime) : null;

        const promptConfig = message.promptConfig;
        
        messagesData.push({
          'Message ID': message.id || `${conversation.threadID}-${index}`,
          'Conversation ID': conversation.threadID,
          'Participant': conversation.user,
          'Sender': message.sender,
          'Timestamp': messageTime ? messageTime.toISOString() : '',
          'Study Day': messageStudyDay || '',
          'Message Order': index + 1,
          'Text Content': message.text?.length > 1000 ? message.text.substring(0, 1000) + '...' : message.text || '',
          'Model Used': message.model || '',
          'Is Selected': message.isSelected ? 'TRUE' : 'FALSE',
          'Selection Timestamp': message.selectionTimestamp ? new Date(message.selectionTimestamp).toISOString() : '',
          'Prompt Config Used': promptConfig?.id || '',
          'Tone': promptConfig?.tone || '',
          'Tone Label': promptConfig?.toneLabel || '',
          'Language Difficulty': promptConfig?.languageDifficulty || '',
          'Language Difficulty Label': promptConfig?.languageDifficultyLabel || '',
          'Answer Length': promptConfig?.answerLength || '',
          'Answer Length Label': promptConfig?.answerLengthLabel || '',
          'Technical Difficulty': promptConfig?.technicalDifficulty || '',
          'Technical Difficulty Label': promptConfig?.technicalDifficultyLabel || '',
          'Instruction Format': promptConfig?.instructionFormat || '',
          'Instruction Format Label': promptConfig?.instructionFormatLabel || '',
          'Specify Devices': promptConfig?.specifyDevices || '',
          'Selected Devices': promptConfig?.selectedDevices?.join(', ') || '',
          'Computer Type': promptConfig?.computerType || '',
          'Tablet Type': promptConfig?.tabletType || '',
          'Mobile Type': promptConfig?.mobileType || '',
          'Browser': promptConfig?.browser || '',
          'Additional Instructions': promptConfig?.additionalInstructions || ''
        });

        // Update daily activity tracking
        if (messageStudyDay && message.sender === 'user') {
          const key = `${conversation.user}-${messageStudyDay}`;
          const date = messageTime ? messageTime.toISOString().split('T')[0] : '';
          
          if (!dailyActivityMap[key]) {
            dailyActivityMap[key] = {
              'Participant': conversation.user,
              'Study Day': messageStudyDay,
              'Date': date,
              'Conversations Started': new Set(),
              'Messages Sent': 0,
              'First Activity Time': messageTime,
              'Last Activity Time': messageTime,
              'MessageLengths': []
            };
          }

          const activity = dailyActivityMap[key];
          activity['Conversations Started'].add(conversation.threadID);
          activity['Messages Sent']++;
          activity['MessageLengths'].push(message.text?.length || 0);
          
          if (messageTime) {
            if (messageTime < activity['First Activity Time']) {
              activity['First Activity Time'] = messageTime;
            }
            if (messageTime > activity['Last Activity Time']) {
              activity['Last Activity Time'] = messageTime;
            }
          }
        }
      });
    });

    // Convert daily activity map to array and calculate derived fields
    const dailyActivityData = Object.values(dailyActivityMap).map((activity: any) => {
      const firstTime = activity['First Activity Time'];
      const lastTime = activity['Last Activity Time'];
      const activeDuration = firstTime && lastTime ? 
        Math.round((lastTime.getTime() - firstTime.getTime()) / (1000 * 60)) : 0;
      
      const avgResponseLength = activity['MessageLengths'].length > 0 ?
        Math.round(activity['MessageLengths'].reduce((a: number, b: number) => a + b, 0) / activity['MessageLengths'].length) : 0;

      return {
        'Participant': activity['Participant'],
        'Study Day': activity['Study Day'],
        'Date': activity['Date'],
        'Conversations Started': activity['Conversations Started'].size,
        'Messages Sent': activity['Messages Sent'],
        'First Activity Time': firstTime ? firstTime.toTimeString().split(' ')[0] : '',
        'Last Activity Time': lastTime ? lastTime.toTimeString().split(' ')[0] : '',
        'Active Duration (Minutes)': activeDuration,
        'Avg Response Length': avgResponseLength
      };
    });

    // Sort daily activity by participant and study day
    dailyActivityData.sort((a, b) => {
      if (a['Participant'] !== b['Participant']) {
        return a['Participant'].localeCompare(b['Participant']);
      }
      return a['Study Day'] - b['Study Day'];
    });

    // Create workbook and worksheets
    const workbook = XLSX.utils.book_new();

    // Add Conversations sheet
    const conversationsWS = XLSX.utils.json_to_sheet(conversationsData);
    XLSX.utils.book_append_sheet(workbook, conversationsWS, 'Conversations');

    // Add Messages sheet
    const messagesWS = XLSX.utils.json_to_sheet(messagesData);
    XLSX.utils.book_append_sheet(workbook, messagesWS, 'Messages');

    // Add Daily Activity sheet
    const dailyActivityWS = XLSX.utils.json_to_sheet(dailyActivityData);
    XLSX.utils.book_append_sheet(workbook, dailyActivityWS, 'Daily_Activity');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Create filename with timestamp
    const filename = `study_conversations_excel_export_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString()
      }
    });
    
  } catch (error) {
    console.error('Error exporting conversations to Excel:', error);
    return NextResponse.json(
      { error: 'Failed to export conversations to Excel' },
      { status: 500 }
    );
  }
}