import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/mongodb';
import Chat from '@/app/models/Chat';
import JSZip from 'jszip';

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
    
    // Create ZIP file with JSON files per participant
    const zip = new JSZip();
    const exportTimestamp = new Date().toISOString();
    
    // Create individual participant files
    for (const [username, userConversations] of Object.entries(conversationsByParticipant)) {
      const participantData = {
        username,
        export_date: exportTimestamp,
        total_conversations: userConversations.length,
        conversations: userConversations
      };
      
      // Add JSON file to ZIP
      zip.file(`${username}.json`, JSON.stringify(participantData, null, 2));
    }
    
    // Create export metadata file
    const metadata = {
      export_timestamp: exportTimestamp,
      total_participants: Object.keys(conversationsByParticipant).length,
      total_conversations: conversations.length,
      date_range: {
        query_start_date: startDate || null,
        query_end_date: endDate || null,
        earliest_conversation: conversations[conversations.length - 1]?.latestTimestamp || null,
        latest_conversation: conversations[0]?.latestTimestamp || null
      },
      participants: Object.keys(conversationsByParticipant),
      filters_applied: {
        date_filter: !!(startDate || endDate),
        participant_filter: !!(participants && participants.length > 0)
      }
    };
    
    zip.file('export_metadata.json', JSON.stringify(metadata, null, 2));
    
    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    
    // Create filename with timestamp
    const filename = `study_conversations_export_${new Date().toISOString().split('T')[0]}.zip`;
    
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
    console.error('Error exporting conversations:', error);
    return NextResponse.json(
      { error: 'Failed to export conversations' },
      { status: 500 }
    );
  }
}