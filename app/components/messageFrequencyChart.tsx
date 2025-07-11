'use client';

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface DailyMessageData {
  date: string;
  organicMessages: number;
  suggestedMessages: number;
  organicConversations: number;
  suggestedConversations: number;
}

interface MessageFrequencyChartProps {
  data: DailyMessageData[];
  loading?: boolean;
}

const MessageFrequencyChart: React.FC<MessageFrequencyChartProps> = ({ data, loading }) => {
  const [viewMode, setViewMode] = useState<'messages' | 'conversations'>('messages');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{date}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span> {entry.value}
            </p>
          ))}
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Total: {payload.reduce((sum: number, entry: any) => sum + entry.value, 0)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const getChartData = () => {
    if (viewMode === 'messages') {
      return data.map(item => ({
        ...item,
        'Organic': item.organicMessages,
        'Suggested': item.suggestedMessages
      }));
    } else {
      return data.map(item => ({
        ...item,
        'Organic': item.organicConversations,
        'Suggested': item.suggestedConversations
      }));
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading chart data...</div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Message Frequency</h3>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">No message data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          {viewMode === 'messages' ? 'Messages' : 'Conversations'} Per Day
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('messages')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              viewMode === 'messages'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Messages
          </button>
          <button
            onClick={() => setViewMode('conversations')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              viewMode === 'conversations'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Conversations
          </button>
        </div>
      </div>

      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <BarChart data={getChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="Organic" 
              stackId="a" 
              fill="#6B7280" 
              name="Organic"
            />
            <Bar 
              dataKey="Suggested" 
              stackId="a" 
              fill="#3B82F6" 
              name="Suggested Prompts"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded"></div>
            <span>Organic conversations</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>From suggested prompts</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageFrequencyChart;