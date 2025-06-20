'use client'

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  surveyId: string;
}

interface FormData {
  name: string;
  title: string;
  instructions: string;
  criteria: string;
  items: string;
  studyDays: string;
  isActive: boolean;
  isLocalhost: boolean;
}

const SurveyForm = ({ surveyId }: Props) => {
  const router = useRouter();
  const isNew = surveyId === 'new';
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    title: '',
    instructions: '',
    criteria: '',
    items: '',
    studyDays: '',
    isActive: false,
    isLocalhost: true
  });

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isNew) {
      loadSurvey();
    }
  }, [surveyId, isNew]);

  const loadSurvey = async () => {
    try {
      const response = await fetch(`/api/admin/surveys/${surveyId}`);
      const data = await response.json();
      
      if (response.ok) {
        setFormData({
          name: data.survey.name,
          title: data.survey.title,
          instructions: data.survey.instructions,
          criteria: data.survey.criteria,
          items: data.survey.items,
          studyDays: data.survey.studyDays,
          isActive: data.survey.isActive,
          isLocalhost: data.survey.isLocalhost
        });
      } else {
        setError(data.error || 'Failed to load survey');
      }
    } catch (error) {
      console.error('Error loading survey:', error);
      setError('Failed to load survey');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const url = isNew ? '/api/admin/surveys' : `/api/admin/surveys/${surveyId}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/manageSurveys');
      } else {
        setError(data.error || 'Failed to save survey');
      }
    } catch (error) {
      console.error('Error saving survey:', error);
      setError('Failed to save survey');
    }
    setSaving(false);
  };

  const handleCancel = () => {
    router.push('/manageSurveys');
  };

  if (loading) {
    return (
      <main className="users">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading survey...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="users">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        {isNew ? 'Create Survey' : 'Edit Survey'}
      </h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Survey Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., cybersecurity-priorities-day1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Internal identifier (no spaces, use hyphens)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title (shown to users) *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Cybersecurity Priorities"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions *
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({...formData, instructions: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Please rank these items by importance to you personally. Drag and drop the cards to reorder them."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ranking Criteria *
            </label>
            <input
              type="text"
              value={formData.criteria}
              onChange={(e) => setFormData({...formData, criteria: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Most important to least important for your personal cybersecurity"
              required
            />
          </div>

          {/* Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Items *
            </label>
            <textarea
              value={formData.items}
              onChange={(e) => setFormData({...formData, items: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 h-48 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Strong Passwords | Using complex, unique passwords for each account&#10;Software Updates | Keeping your operating system and apps up to date&#10;Phishing Awareness | Recognizing and avoiding suspicious emails and links&#10;Two-Factor Authentication | Adding an extra layer of security to your accounts"
              required
            />
            <div className="text-sm text-gray-600 mt-2 space-y-1">
              <p><strong>Format:</strong> One item per line</p>
              <p><strong>Structure:</strong> Text | Description (description is optional)</p>
              <p><strong>Example:</strong> Strong Passwords | Using complex, unique passwords</p>
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Study Days
              </label>
              <input
                type="text"
                value={formData.studyDays}
                onChange={(e) => setFormData({...formData, studyDays: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1,3,7,14"
              />
              <p className="text-xs text-gray-500 mt-1">
                Comma-separated list (leave empty for localhost testing)
              </p>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isLocalhost}
                  onChange={(e) => setFormData({...formData, isLocalhost: e.target.checked})}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Localhost Only</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-6 rounded-lg transition-colors duration-200"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? 'Saving...' : (isNew ? 'Create Survey' : 'Update Survey')}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default SurveyForm;