'use client'

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Survey {
  _id: string;
  name: string;
  title: string;
  studyDays: string;
  isActive: boolean;
  isLocalhost: boolean;
  createdAt: string;
  updatedAt: string;
}

const SurveyManagement = () => {
  const router = useRouter();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState<string>("");

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      const response = await fetch('/api/admin/surveys');
      const data = await response.json();
      setSurveys(data.surveys || []);
    } catch (error) {
      console.error('Error loading surveys:', error);
    }
    setLoading(false);
  };

  const toggleActive = async (surveyId: string, currentStatus: boolean) => {
    try {
      // Get full survey data first
      const response = await fetch(`/api/admin/surveys/${surveyId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch survey');
      }

      // Update with toggled status
      const updateResponse = await fetch(`/api/admin/surveys/${surveyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data.survey,
          isActive: !currentStatus
        }),
      });

      if (updateResponse.ok) {
        loadSurveys(); // Reload the list
      } else {
        const errorData = await updateResponse.json();
        alert(errorData.error || 'Failed to update survey status');
      }
    } catch (error) {
      console.error('Error toggling survey status:', error);
      alert('Failed to update survey status');
    }
  };

  const handleDeleteSurvey = (surveyId: string, surveyName: string) => {
    setSurveyToDelete(surveyId);
    setShowConfirmModal(true);
  };

  const confirmDeleteSurvey = async () => {
    try {
      const response = await fetch(`/api/admin/surveys/${surveyToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadSurveys(); // Reload the list
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete survey');
      }
    } catch (error) {
      console.error('Error deleting survey:', error);
      alert('Failed to delete survey');
    }
    setShowConfirmModal(false);
    setSurveyToDelete("");
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setSurveyToDelete("");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <main className="users">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading surveys...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="users">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Survey Management</h1>
      
      {/* Survey List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        {/* Header */}
        <div className="flex w-full border-b border-gray-200 bg-gray-50 px-6 py-3 rounded-t-lg">
          <div className="w-1/5 font-semibold text-gray-700">Name</div>
          <div className="w-1/5 font-semibold text-gray-700">Title</div>
          <div className="w-1/6 font-semibold text-gray-700">Study Days</div>
          <div className="w-1/6 font-semibold text-gray-700">Status</div>
          <div className="w-1/6 font-semibold text-gray-700">Environment</div>
          <div className="w-1/6 font-semibold text-gray-700">Actions</div>
        </div>
        
        {/* Survey List */}
        <div className="max-h-96 overflow-y-auto">
          {surveys.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No surveys created yet.
            </div>
          ) : (
            <ul>
              {surveys.map((survey) => (
                <li key={survey._id} className="flex w-full border-b border-gray-100 px-6 py-4 hover:bg-gray-50">
                  <div className="w-1/5 text-gray-800 font-medium">{survey.name}</div>
                  <div className="w-1/5 text-gray-600" title={survey.title}>
                    {survey.title.length > 30 ? `${survey.title.substring(0, 30)}...` : survey.title}
                  </div>
                  <div className="w-1/6 text-gray-600">{survey.studyDays || 'None'}</div>
                  <div className="w-1/6">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      survey.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {survey.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="w-1/6">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      survey.isLocalhost 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {survey.isLocalhost ? 'Localhost' : 'Production'}
                    </span>
                  </div>
                  <div className="w-1/6 space-x-2">
                    <button
                      onClick={() => router.push(`/manageSurveys/${survey._id}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleActive(survey._id, survey.isActive)}
                      className={`text-sm font-medium ${
                        survey.isActive 
                          ? 'text-orange-600 hover:text-orange-800' 
                          : 'text-green-600 hover:text-green-800'
                      }`}
                    >
                      {survey.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteSurvey(survey._id, survey.name)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {/* Create New Survey */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Create New Survey</h2>
        <button 
          onClick={() => router.push('/manageSurveys/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Create New Survey
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this survey? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSurvey}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default SurveyManagement;