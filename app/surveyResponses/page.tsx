'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/app/components/adminSidebar';

interface SurveyResponse {
  _id: string;
  username: string;
  surveyId: string;
  surveyInfo?: {
    name: string;
    title: string;
  };
  response: any;
  studyDay: number;
  timeSpent: number;
  createdAt: string;
}

interface Survey {
  _id: string;
  name: string;
  title: string;
}

interface ResponseData {
  responses: SurveyResponse[];
  surveys: Survey[];
  studyDays: number[];
}

interface RankingItem {
  item: string;
  averagePosition: number;
  positions: number[];
}

export default function SurveyResponsesPage() {
  const [data, setData] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState<string>('');
  const [selectedStudyDay, setSelectedStudyDay] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [allUsers, setAllUsers] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, [selectedSurvey, selectedStudyDay]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSurvey) params.append('surveyId', selectedSurvey);
      if (selectedStudyDay) params.append('studyDay', selectedStudyDay);

      const response = await fetch(`/api/admin/surveyResponses?${params}`);
      const result = await response.json();
      
      setData(result);
      
      // Extract unique users and select all by default
      const userSet = new Set(result.responses.map((r: SurveyResponse) => r.username));
      const users = Array.from(userSet) as string[];
      setAllUsers(users);
      if (selectedUsers.size === 0) {
        setSelectedUsers(new Set(users));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
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
    if (selectedUsers.size === allUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(allUsers));
    }
  };

  const calculateAveragePositions = (): RankingItem[] => {
    if (!data || selectedUsers.size === 0) return [];

    const filteredResponses = data.responses.filter(r => 
      selectedUsers.has(r.username) && 
      r.response && 
      Array.isArray(r.response)
    );

    if (filteredResponses.length === 0) return [];

    // Collect all items and their positions
    const itemPositions: { [key: string]: number[] } = {};
    
    filteredResponses.forEach(response => {
      response.response.forEach((item: any, index: number) => {
        const itemName = typeof item === 'string' ? item : item.item || item.text || String(item);
        if (!itemPositions[itemName]) {
          itemPositions[itemName] = [];
        }
        itemPositions[itemName].push(index + 1); // Position is 1-indexed
      });
    });

    // Calculate averages
    return Object.entries(itemPositions)
      .map(([item, positions]) => ({
        item,
        averagePosition: positions.reduce((a, b) => a + b, 0) / positions.length,
        positions: positions.sort((a, b) => a - b)
      }))
      .sort((a, b) => a.averagePosition - b.averagePosition);
  };

  const averagePositions = calculateAveragePositions();
  
  // Count actual respondents (users with valid responses for this survey/day)
  const actualRespondentCount = data ? data.responses.filter(r => 
    selectedUsers.has(r.username) && 
    r.response && 
    Array.isArray(r.response)
  ).length : 0;

  // Count users who have responses for the current filters (not just all users)
  const usersWithResponses = data ? Array.from(new Set(data.responses.map(r => r.username))) as string[] : [];
  const selectedUsersWithResponses = usersWithResponses.filter(user => selectedUsers.has(user));

  return (
    <div className="flex flex-col w-screen h-screen items-center">
      <div className="flex flex-col-reverse md:flex-row w-full">
        {/* Sidebar */}
        <AdminSidebar selected={8} />

        {/* Main content */}
        <main className="users">
          <h1 className="text-2xl font-bold mb-6">Survey Response Analysis</h1>
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Survey</label>
              <select 
                value={selectedSurvey} 
                onChange={(e) => setSelectedSurvey(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">All Surveys</option>
                {data?.surveys?.map(survey => (
                  <option key={survey._id} value={survey._id}>
                    {survey.title || survey.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Study Day</label>
              <select 
                value={selectedStudyDay} 
                onChange={(e) => setSelectedStudyDay(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">All Days</option>
                {data?.studyDays?.map(day => (
                  <option key={day} value={day}>Day {day}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* User Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Users ({selectedUsersWithResponses.length}/{usersWithResponses.length} selected)</h2>
            <button 
              onClick={toggleAllUsers}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {selectedUsersWithResponses.length === usersWithResponses.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {allUsers.map(user => (
              <label key={user} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedUsers.has(user)}
                  onChange={() => toggleUser(user)}
                  className="rounded"
                />
                <span className="text-sm">{user}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow p-6">
          {selectedSurvey && (
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Survey: {data?.surveys.find(s => s._id === selectedSurvey)?.title || 'Unknown Survey'} [N={actualRespondentCount}]
              </h2>
              {selectedStudyDay && (
                <p className="text-gray-600 mt-1">Study Day: {selectedStudyDay}</p>
              )}
            </div>
          )}
          <h3 className="text-lg font-semibold mb-4">Average Position Rankings</h3>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : averagePositions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {selectedUsers.size === 0 ? 'No users selected' : 'No ranking data available for the selected filters'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Rank</th>
                    <th className="px-4 py-2 text-left">Item</th>
                    <th className="px-4 py-2 text-left">Average Position</th>
                    <th className="px-4 py-2 text-left">Individual Scores</th>
                  </tr>
                </thead>
                <tbody>
                  {averagePositions.map((item, index) => (
                    <tr key={item.item} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-2 font-semibold">#{index + 1}</td>
                      <td className="px-4 py-2">{item.item}</td>
                      <td className="px-4 py-2">{item.averagePosition.toFixed(2)}</td>
                      <td className="px-4 py-2 font-mono text-sm">[{item.positions.join(',')}]</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </main>
      </div>
    </div>
  );
}