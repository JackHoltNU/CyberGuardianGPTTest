import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/mongodb';
import Chat from '@/app/models/Chat';
import UserProgress from '@/app/models/UserProgress';
import { getServerSession } from 'next-auth';
import { options } from '../../auth/options';

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const session = await getServerSession(options);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const threadID = searchParams.get('threadID');
    const username = searchParams.get('username');
    const date = searchParams.get('date'); // YYYY-MM-DD format
    
    // Get study participants
    const studyParticipants = await UserProgress.find({}, { username: 1, _id: 0 }).lean();
    const studyUsernames = studyParticipants.map((p: any) => p.username as string);
    
    if (threadID) {
      // Return specific conversation
      const conversation = await Chat.findOne({ threadID }).lean() as any;
      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
      
      // Check if user is a study participant
      if (!studyUsernames.includes(conversation.user)) {
        return NextResponse.json({ error: 'User not in study' }, { status: 403 });
      }
      
      return NextResponse.json({ conversation });
    }
    
    // Build query for conversation list
    const query: any = { user: { $in: studyUsernames } };
    
    // Filter by specific username if provided
    if (username && studyUsernames.includes(username)) {
      query.user = username;
    }
    
    // Filter by date (conversations started on that date)
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      query['messages.0.timestamp'] = {
        $gte: startDate,
        $lt: endDate
      };
    }
    
    // Fetch conversations with basic info
    const conversations = await Chat.find(query, {
      threadID: 1,
      title: 1,
      user: 1,
      latestTimestamp: 1
    })
    .sort({ latestTimestamp: -1 })
    .limit(100)
    .lean() as { threadID: string; title: string; user: string; latestTimestamp: Date }[];
    
    // Enhance with initial user question
    const enhancedConversations = await Promise.all(
      conversations.map(async (conv) => {
        // Get the first user message (initial question)
        const fullConv = await Chat.findOne(
          { threadID: conv.threadID },
          { 'messages': 1 }
        ).lean() as { messages: { sender: string; text: string }[] } | null;
        
        const firstUserMessage = fullConv?.messages?.find(msg => msg.sender === 'user');
        
        return {
          threadID: conv.threadID,
          title: conv.title || 'Untitled Conversation',
          user: conv.user,
          latestTimestamp: conv.latestTimestamp,
          initialQuestion: firstUserMessage?.text || 'No question found',
          messageCount: fullConv?.messages?.length || 0
        };
      })
    );
    
    return NextResponse.json({
      conversations: enhancedConversations,
      studyParticipants: studyUsernames,
      totalCount: enhancedConversations.length
    });
    
  } catch (error) {
    console.error('Error fetching study messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch study messages' },
      { status: 500 }
    );
  }
}