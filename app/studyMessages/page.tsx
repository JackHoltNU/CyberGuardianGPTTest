'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/app/components/adminSidebar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from '../styles/promptbuilder.module.css';

interface StudyParticipant {
  username: string;
}

interface Conversation {
  threadID: string;
  title: string;
  user: string;
  latestTimestamp: string;
  initialQuestion: string;
  messageCount: number;
}

interface Message {
  id?: string;
  sender: 'system' | 'user' | 'assistant';
  text: string;
  timestamp: Date;
  promptConfig?: any;
}

interface ConversationDetails {
  threadID: string;
  title: string;
  user: string;
  messages: Message[];
}

export default function StudyMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetails | null>(null);
  const [studyParticipants, setStudyParticipants] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Filters
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    fetchConversations();
  }, [selectedUsers, selectedDate]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.append('date', selectedDate);

      const response = await fetch(`/api/admin/studyMessages?${params}`);
      const result = await response.json();
      
      if (response.ok) {
        const allConversations = result.conversations || [];
        const allParticipants = result.studyParticipants || [];
        
        // Filter conversations by selected users
        const filteredConversations = selectedUsers.size > 0 
          ? allConversations.filter((conv: Conversation) => selectedUsers.has(conv.user))
          : allConversations;
        
        setConversations(filteredConversations);
        setStudyParticipants(allParticipants);
        
        // Only auto-select all participants on initial load
        if (initialLoad && selectedUsers.size === 0) {
          setSelectedUsers(new Set(allParticipants));
          setInitialLoad(false);
        }
      } else {
        console.error('Error fetching conversations:', result.error);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationDetails = async (threadID: string) => {
    setMessageLoading(true);
    try {
      const response = await fetch(`/api/admin/studyMessages?threadID=${threadID}`);
      const result = await response.json();
      
      if (response.ok) {
        setSelectedConversation(result.conversation);
      } else {
        console.error('Error fetching conversation details:', result.error);
      }
    } catch (error) {
      console.error('Error fetching conversation details:', error);
    } finally {
      setMessageLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  const toggleUser = (username: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(username)) {
      newSelected.delete(username);
    } else {
      newSelected.add(username);
    }
    setSelectedUsers(newSelected);
  };

  const toggleAllUsers = () => {
    if (selectedUsers.size === studyParticipants.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(studyParticipants));
    }
  };

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.sender === 'user';
    const isAssistant = message.sender === 'assistant';
    const isSystem = message.sender === 'system';

    if (isSystem) {
      return (
        <div key={index} className={`${styles['pb-message-row']} justify-center`}>
          <div className={`${styles['pb-message-bubble']} ${styles['pb-message-system']} text-center`}>
            <div className="p-2 text-sm text-gray-600">
              {message.text}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={index} className={`${styles['pb-message-row']} ${isUser ? styles['pb-message-row-user'] : styles['pb-message-row-assistant']}`}>
        <div className={`${styles['pb-message-bubble']} ${isUser ? styles['pb-message-user'] : styles['pb-message-assistant']}`}>
          <div className="p-4">
            <ReactMarkdown 
              className="markdown-content prose prose-sm max-w-none"
              remarkPlugins={[remarkGfm]}
            >
              {message.text}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-screen h-screen items-center">
      <div className="flex flex-col-reverse md:flex-row w-full">
        {/* Sidebar */}
        <AdminSidebar selected={9} />

        {/* Main content */}
        <main className="users">
          <h1 className="text-2xl font-bold mb-6">Study Messages</h1>
          
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-lg font-semibold mb-4">Filters</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Date</label>
              <input 
                type="date"
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 border rounded-md max-w-xs"
              />
            </div>
          </div>

          {/* User Selection */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Study Participants ({selectedUsers.size}/{studyParticipants.length} selected)</h2>
              <button 
                onClick={toggleAllUsers}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {selectedUsers.size === studyParticipants.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {studyParticipants.map(username => (
                <label key={username} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(username)}
                    onChange={() => toggleUser(username)}
                    className="rounded"
                  />
                  <span className="text-sm">{username}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex bg-white rounded-lg shadow" style={{ height: 'calc(100vh - 300px)' }}>
            {/* Left Column - Conversation List */}
            <div className="w-1/2 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold">Conversations ({conversations.length})</h3>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-gray-600">Loading conversations...</div>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-gray-500">No conversations found</div>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.threadID}
                      onClick={() => fetchConversationDetails(conv.threadID)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                        selectedConversation?.threadID === conv.threadID ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="font-medium text-gray-900 mb-1">{conv.title}</div>
                      <div className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {conv.initialQuestion}
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{conv.user}</span>
                        <span>{formatDate(conv.latestTimestamp)}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {conv.messageCount} messages
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Column - Message Display */}
            <div className="w-1/2 flex flex-col">
              {selectedConversation ? (
                <>
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-semibold">{selectedConversation.title}</h3>
                    <div className="text-sm text-gray-600">
                      {selectedConversation.user} • {selectedConversation.messages.length} messages
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    {messageLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-gray-600">Loading messages...</div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedConversation.messages.map((message, index) => 
                          renderMessage(message, index)
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Select a conversation to view messages
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}