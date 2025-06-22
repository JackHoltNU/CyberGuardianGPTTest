'use client'

import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";

interface ConversationStarter {
  _id: string;
  text: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const ConversationStartersManagement = () => {
  const [starters, setStarters] = useState<ConversationStarter[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    text: "",
    isActive: true
  });
  const [error, setError] = useState("");

  useEffect(() => {
    loadConversationStarters();
  }, []);

  const loadConversationStarters = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/conversationStarters?activeOnly=false');
      const data = await response.json();
      if (data.success) {
        setStarters(data.starters || []);
      }
    } catch (error) {
      console.error('Error loading conversation starters:', error);
      setError('Failed to load conversation starters');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.text.trim()) {
      setError('Text is required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/conversationStarters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setStarters([data.starter, ...starters]);
        setFormData({ text: "", isActive: true });
        setShowAddForm(false);
        setError("");
      } else {
        setError(data.error || 'Failed to add conversation starter');
      }
    } catch (error) {
      console.error('Error adding conversation starter:', error);
      setError('Failed to add conversation starter');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, updatedData: Partial<ConversationStarter>) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/conversationStarters?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      const data = await response.json();

      if (data.success) {
        setStarters(starters.map(starter => 
          starter._id === id ? data.starter : starter
        ));
        setEditingId(null);
        setError("");
      } else {
        setError(data.error || 'Failed to update conversation starter');
      }
    } catch (error) {
      console.error('Error updating conversation starter:', error);
      setError('Failed to update conversation starter');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this conversation starter?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/conversationStarters?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setStarters(starters.filter(starter => starter._id !== id));
        setError("");
      } else {
        setError(data.error || 'Failed to delete conversation starter');
      }
    } catch (error) {
      console.error('Error deleting conversation starter:', error);
      setError('Failed to delete conversation starter');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    const starter = starters.find(s => s._id === id);
    if (starter) {
      handleUpdate(id, { ...starter, isActive });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Conversation Starters</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          disabled={loading}
        >
          <Plus size={16} />
          Add Starter
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Add New Conversation Starter</h3>
          <div className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Enter conversation starter text..."
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={loading || !formData.text.trim()}
                className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors"
              >
                <Save size={14} />
                Save
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ text: "", isActive: true });
                  setError("");
                }}
                className="flex items-center gap-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Starters List */}
      <div className="space-y-3">
        {loading && starters.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Loading conversation starters...</div>
        ) : starters.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No conversation starters found. Add one to get started!</div>
        ) : (
          starters.map((starter) => (
            <div
              key={starter._id}
              className={`p-4 border rounded-lg ${starter.isActive ? 'border-gray-200 bg-white' : 'border-gray-300 bg-gray-50'}`}
            >
              {editingId === starter._id ? (
                <EditForm
                  starter={starter}
                  onSave={(updatedData) => handleUpdate(starter._id, updatedData)}
                  onCancel={() => setEditingId(null)}
                  loading={loading}
                />
              ) : (
                <ViewMode
                  starter={starter}
                  onEdit={() => setEditingId(starter._id)}
                  onDelete={() => handleDelete(starter._id)}
                  onToggleActive={(isActive) => handleToggleActive(starter._id, isActive)}
                  loading={loading}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Edit Form Component
const EditForm = ({ starter, onSave, onCancel, loading }: {
  starter: ConversationStarter;
  onSave: (data: Partial<ConversationStarter>) => void;
  onCancel: () => void;
  loading: boolean;
}) => {
  const [formData, setFormData] = useState({
    text: starter.text,
    isActive: starter.isActive
  });

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={formData.text}
        onChange={(e) => setFormData({ ...formData, text: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
      <div className="flex gap-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-700">Active</span>
        </label>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave(formData)}
          disabled={loading || !formData.text.trim()}
          className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors"
        >
          <Save size={14} />
          Save
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          <X size={14} />
          Cancel
        </button>
      </div>
    </div>
  );
};

// View Mode Component
const ViewMode = ({ starter, onEdit, onDelete, onToggleActive, loading }: {
  starter: ConversationStarter;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: (isActive: boolean) => void;
  loading: boolean;
}) => {
  return (
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <p className={`text-base ${starter.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
          {starter.text}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <span className={`text-xs px-2 py-1 rounded-full ${
            starter.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {starter.isActive ? 'Active' : 'Inactive'}
          </span>
          <span className="text-xs text-gray-400">
            Updated: {new Date(starter.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <button
          onClick={() => onToggleActive(!starter.isActive)}
          disabled={loading}
          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
            starter.isActive
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {starter.isActive ? 'Deactivate' : 'Activate'}
        </button>
        <button
          onClick={onEdit}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Edit size={16} />
        </button>
        <button
          onClick={onDelete}
          disabled={loading}
          className="p-2 text-red-400 hover:text-red-600 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default ConversationStartersManagement;