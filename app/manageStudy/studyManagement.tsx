'use client'

import React, { useEffect, useState } from "react";
import ConversationStartersManagement from "../components/conversationStartersManagement";

interface User {
  username: string;
  role: string;
}

interface StudyParticipant {
  username: string;
  studyStartDate: string;
  currentDay: number;
  completedDays: number;
  isStudyComplete: boolean;
}

const StudyManagement = () => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [studyParticipants, setStudyParticipants] = useState<StudyParticipant[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToRemove, setUserToRemove] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [wordExportLoading, setWordExportLoading] = useState(false);
  const [excelExportLoading, setExcelExportLoading] = useState(false);

  useEffect(() => {
    loadAllUsers();
    loadStudyParticipants();
  }, []);

  const loadAllUsers = async () => {
    try {
      const response = await fetch('/api/getAllUsers');
      const data = await response.json();
      setAllUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadStudyParticipants = async () => {
    try {
      const response = await fetch('/api/getStudyParticipants');
      const data = await response.json();
      setStudyParticipants(data.participants || []);
    } catch (error) {
      console.error('Error loading study participants:', error);
    }
  };

  const addUserToStudy = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/addUserToStudy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: selectedUser }),
      });

      if (response.ok) {
        setSelectedUser("");
        loadStudyParticipants();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to add user to study');
      }
    } catch (error) {
      console.error('Error adding user to study:', error);
      alert('Failed to add user to study');
    }
    setLoading(false);
  };

  const handleRemoveUser = (username: string) => {
    setUserToRemove(username);
    setShowConfirmModal(true);
  };

  const confirmRemoveUser = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/removeUserFromStudy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: userToRemove }),
      });

      if (response.ok) {
        loadStudyParticipants();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to remove user from study');
      }
    } catch (error) {
      console.error('Error removing user from study:', error);
      alert('Failed to remove user from study');
    }
    setLoading(false);
    setShowConfirmModal(false);
    setUserToRemove("");
  };

  const cancelRemoveUser = () => {
    setShowConfirmModal(false);
    setUserToRemove("");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const exportConversations = async () => {
    setExportLoading(true);
    try {
      // Create URL with study participants filter
      const participantUsernames = studyParticipants.map(p => p.username);
      const params = new URLSearchParams();
      if (participantUsernames.length > 0) {
        params.append('participants', participantUsernames.join(','));
      }

      const response = await fetch(`/api/admin/exportConversations?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to export conversations');
        return;
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `study_conversations_export_${new Date().toISOString().split('T')[0]}.zip`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting conversations:', error);
      alert('Failed to export conversations');
    }
    setExportLoading(false);
  };

  const exportConversationsWord = async () => {
    setWordExportLoading(true);
    try {
      // Create URL with study participants filter
      const participantUsernames = studyParticipants.map(p => p.username);
      const params = new URLSearchParams();
      if (participantUsernames.length > 0) {
        params.append('participants', participantUsernames.join(','));
      }

      const response = await fetch(`/api/admin/exportConversationsWord?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to export Word documents');
        return;
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `study_conversations_word_export_${new Date().toISOString().split('T')[0]}.zip`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting Word documents:', error);
      alert('Failed to export Word documents');
    }
    setWordExportLoading(false);
  };

  const exportConversationsExcel = async () => {
    setExcelExportLoading(true);
    try {
      // Create URL with study participants filter
      const participantUsernames = studyParticipants.map(p => p.username);
      const params = new URLSearchParams();
      if (participantUsernames.length > 0) {
        params.append('participants', participantUsernames.join(','));
      }

      const response = await fetch(`/api/admin/exportConversationsExcel?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to export Excel file');
        return;
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `study_conversations_excel_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting Excel file:', error);
      alert('Failed to export Excel file');
    }
    setExcelExportLoading(false);
  };

  return (
    <main className="users">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Study Management</h1>
      
      {/* Study participants list */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        {/* Header */}
        <div className="flex w-full border-b border-gray-200 bg-gray-50 px-6 py-3 rounded-t-lg">
          <div className="w-1/6 font-semibold text-gray-700">Username</div>
          <div className="w-1/6 font-semibold text-gray-700">Start Date</div>
          <div className="w-1/6 font-semibold text-gray-700">Current Day</div>
          <div className="w-1/6 font-semibold text-gray-700">Completed</div>
          <div className="w-1/6 font-semibold text-gray-700">Status</div>
          <div className="w-1/6 font-semibold text-gray-700">Actions</div>
        </div>
        
        {/* Scrollable participants list */}
        <div className="max-h-96 overflow-y-auto">
          {studyParticipants.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No participants in the study yet.
            </div>
          ) : (
            <ul>
              {studyParticipants.map((participant) => (
                <li key={participant.username} className="flex w-full border-b border-gray-100 px-6 py-4 hover:bg-gray-50">
                  <div className="w-1/6 text-gray-800">{participant.username}</div>
                  <div className="w-1/6 text-gray-600">{formatDate(participant.studyStartDate)}</div>
                  <div className="w-1/6 text-gray-800">{participant.currentDay}/14</div>
                  <div className="w-1/6 text-gray-800">{participant.completedDays}</div>
                  <div className="w-1/6">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      participant.isStudyComplete 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {participant.isStudyComplete ? 'Complete' : 'In Progress'}
                    </span>
                  </div>
                  <div className="w-1/6">
                    <button
                      onClick={() => handleRemoveUser(participant.username)}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded text-sm transition-colors duration-200"
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {/* Add user to study */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Add User to Study</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
          <div className="flex flex-col">
            <label htmlFor="user-select" className="text-sm font-medium text-gray-700 mb-2">Select User</label>
            <select 
              name="user-select" 
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">Choose a user...</option>
              {allUsers
                .filter(user => !studyParticipants.some(p => p.username === user.username))
                .map((user) => (
                  <option key={user.username} value={user.username}>
                    {user.username} ({user.role})
                  </option>
                ))
              }
            </select>
          </div>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={addUserToStudy}
            disabled={!selectedUser || loading}
          >
            {loading ? 'Adding...' : 'Add to Study'}
          </button>
        </div>
      </div>

      {/* Export Study Data */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Export Study Data</h2>
        <p className="text-gray-600 mb-4">
          Export conversation data for all study participants.
          {studyParticipants.length > 0 && (
            <span className="ml-1">
              ({studyParticipants.length} participant{studyParticipants.length !== 1 ? 's' : ''} will be included)
            </span>
          )}
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* JSON Export */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">JSON Format</h3>
            <p className="text-sm text-gray-600 mb-4">
              Raw conversation data in JSON format. Ideal for data analysis, programming, and preserving complete metadata.
            </p>
            <button 
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              onClick={exportConversations}
              disabled={exportLoading || studyParticipants.length === 0}
            >
              {exportLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export as JSON
                </>
              )}
            </button>
          </div>

          {/* Word Export */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Word Documents</h3>
            <p className="text-sm text-gray-600 mb-4">
              Formatted Word documents for thematic analysis. Readable format with clear conversation boundaries, perfect for qualitative coding.
            </p>
            <button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              onClick={exportConversationsWord}
              disabled={wordExportLoading || studyParticipants.length === 0}
            >
              {wordExportLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Documents...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export as Word
                </>
              )}
            </button>
          </div>

          {/* Excel Export */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Excel Format</h3>
            <p className="text-sm text-gray-600 mb-4">
              Structured Excel spreadsheet with multiple worksheets for comprehensive data analysis. Perfect for statistical analysis and reporting.
            </p>
            <button 
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              onClick={exportConversationsExcel}
              disabled={excelExportLoading || studyParticipants.length === 0}
            >
              {excelExportLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Excel...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Export as Excel
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Conversation Starters Management */}
      <ConversationStartersManagement />

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Removal</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to remove <strong>{userToRemove}</strong> from the study? 
              This will permanently delete their progress data.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelRemoveUser}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveUser}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                disabled={loading}
              >
                {loading ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default StudyManagement;