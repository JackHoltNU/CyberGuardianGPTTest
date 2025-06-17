'use client'

import React, { useEffect, useState } from "react";

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