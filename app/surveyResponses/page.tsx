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
  isComparison?: boolean;
  compareDay1?: number;
  compareDay2?: number;
}

interface RankingItem {
  item: string;
  averagePosition: number;
  positions: number[];
  day1AveragePosition?: number;
  day2AveragePosition?: number;
  positionChange?: number;
  individualChanges?: Array<{
    username: string;
    day1Position: number | null;
    day2Position: number | null;
    change: number | null;
  }>;
}

export default function SurveyResponsesPage() {
  const [data, setData] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState<string>('');
  const [selectedStudyDay, setSelectedStudyDay] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [compareDay1, setCompareDay1] = useState<string>('');
  const [compareDay2, setCompareDay2] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [selectedSurvey, selectedStudyDay, compareDay1, compareDay2]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSurvey) params.append('surveyId', selectedSurvey);
      
      // Use comparison mode if both days are selected, otherwise use single day
      if (compareDay1 && compareDay2) {
        params.append('compareDay1', compareDay1);
        params.append('compareDay2', compareDay2);
      } else if (selectedStudyDay) {
        params.append('studyDay', selectedStudyDay);
      }

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

    // Check if we're in comparison mode
    if (data.isComparison && data.compareDay1 && data.compareDay2) {
      // Separate responses by day
      const day1Responses = filteredResponses.filter(r => r.studyDay === data.compareDay1);
      const day2Responses = filteredResponses.filter(r => r.studyDay === data.compareDay2);

      // Collect positions for each day with user tracking
      const day1Positions: { [key: string]: Array<{username: string, position: number}> } = {};
      const day2Positions: { [key: string]: Array<{username: string, position: number}> } = {};
      
      day1Responses.forEach(response => {
        response.response.forEach((item: any, index: number) => {
          const itemName = typeof item === 'string' ? item : item.item || item.text || String(item);
          if (!day1Positions[itemName]) {
            day1Positions[itemName] = [];
          }
          day1Positions[itemName].push({
            username: response.username,
            position: index + 1
          });
        });
      });

      day2Responses.forEach(response => {
        response.response.forEach((item: any, index: number) => {
          const itemName = typeof item === 'string' ? item : item.item || item.text || String(item);
          if (!day2Positions[itemName]) {
            day2Positions[itemName] = [];
          }
          day2Positions[itemName].push({
            username: response.username,
            position: index + 1
          });
        });
      });

      // Get all unique items
      const allItems = new Set([...Object.keys(day1Positions), ...Object.keys(day2Positions)]);
      
      return Array.from(allItems)
        .map(item => {
          const day1Data = day1Positions[item] || [];
          const day2Data = day2Positions[item] || [];
          
          // Calculate averages
          const day1Avg = day1Data.length > 0 ? day1Data.reduce((a, b) => a + b.position, 0) / day1Data.length : 0;
          const day2Avg = day2Data.length > 0 ? day2Data.reduce((a, b) => a + b.position, 0) / day2Data.length : 0;
          
          // Calculate position change (day1 - day2, positive means improvement)
          const change = day1Data.length > 0 && day2Data.length > 0 ? day1Avg - day2Avg : 0;
          
          // Calculate individual changes
          const allUsers = new Set([
            ...day1Data.map(d => d.username),
            ...day2Data.map(d => d.username)
          ]);
          
          const individualChanges = Array.from(allUsers).map(username => {
            const day1User = day1Data.find(d => d.username === username);
            const day2User = day2Data.find(d => d.username === username);
            
            const day1Position = day1User ? day1User.position : null;
            const day2Position = day2User ? day2User.position : null;
            
            let userChange = null;
            if (day1Position !== null && day2Position !== null) {
              userChange = day1Position - day2Position; // positive = improvement
            }
            
            return {
              username,
              day1Position,
              day2Position,
              change: userChange
            };
          });
          
          return {
            item,
            averagePosition: day2Avg || day1Avg, // Use day2 for sorting, fallback to day1
            positions: [...day1Data.map(d => d.position), ...day2Data.map(d => d.position)].sort((a, b) => a - b),
            day1AveragePosition: day1Avg,
            day2AveragePosition: day2Avg,
            positionChange: change,
            individualChanges
          };
        })
        .filter(item => item.day1AveragePosition > 0 || item.day2AveragePosition > 0)
        .sort((a, b) => (a.day2AveragePosition || a.day1AveragePosition) - (b.day2AveragePosition || b.day1AveragePosition));
    } else {
      // Single day mode (existing logic)
      const itemPositions: { [key: string]: number[] } = {};
      
      filteredResponses.forEach(response => {
        response.response.forEach((item: any, index: number) => {
          const itemName = typeof item === 'string' ? item : item.item || item.text || String(item);
          if (!itemPositions[itemName]) {
            itemPositions[itemName] = [];
          }
          itemPositions[itemName].push(index + 1);
        });
      });

      return Object.entries(itemPositions)
        .map(([item, positions]) => ({
          item,
          averagePosition: positions.reduce((a, b) => a + b, 0) / positions.length,
          positions: positions.sort((a, b) => a - b)
        }))
        .sort((a, b) => a.averagePosition - b.averagePosition);
    }
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                onChange={(e) => {
                  setSelectedStudyDay(e.target.value);
                  // Clear comparison days when single day is selected
                  if (e.target.value) {
                    setCompareDay1('');
                    setCompareDay2('');
                  }
                }}
                className="w-full p-2 border rounded-md"
                disabled={!!(compareDay1 && compareDay2)}
              >
                <option value="">All Days</option>
                {data?.studyDays?.map(day => (
                  <option key={day} value={day}>Day {day}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Compare Day 1</label>
              <select 
                value={compareDay1} 
                onChange={(e) => {
                  setCompareDay1(e.target.value);
                  // Clear single day when comparison is selected
                  if (e.target.value) {
                    setSelectedStudyDay('');
                  }
                }}
                className="w-full p-2 border rounded-md"
                disabled={!!selectedStudyDay}
              >
                <option value="">Select Day 1</option>
                {data?.studyDays?.map(day => (
                  <option key={day} value={day}>Day {day}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Compare Day 2</label>
              <select 
                value={compareDay2} 
                onChange={(e) => {
                  setCompareDay2(e.target.value);
                  // Clear single day when comparison is selected
                  if (e.target.value) {
                    setSelectedStudyDay('');
                  }
                }}
                className="w-full p-2 border rounded-md"
                disabled={!!selectedStudyDay}
              >
                <option value="">Select Day 2</option>
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
              {data?.isComparison && data.compareDay1 && data.compareDay2 && (
                <p className="text-gray-600 mt-1">Comparing Day {data.compareDay1} vs Day {data.compareDay2}</p>
              )}
            </div>
          )}
          <h3 className="text-lg font-semibold mb-4">
            {data?.isComparison ? 'Position Comparison' : 'Average Position Rankings'}
          </h3>
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
                    {data?.isComparison ? (
                      <>
                        <th className="px-4 py-2 text-left">Day {data.compareDay1} Avg</th>
                        <th className="px-4 py-2 text-left">Day {data.compareDay2} Avg</th>
                        <th className="px-4 py-2 text-left">Change</th>
                        <th className="px-4 py-2 text-left">Individual Changes</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-2 text-left">Average Position</th>
                        <th className="px-4 py-2 text-left">Individual Scores</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {averagePositions.map((item, index) => (
                    <tr key={item.item} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-4 py-2 font-semibold">#{index + 1}</td>
                      <td className="px-4 py-2">{item.item}</td>
                      {data?.isComparison ? (
                        <>
                          <td className="px-4 py-2">
                            {item.day1AveragePosition ? item.day1AveragePosition.toFixed(2) : '-'}
                          </td>
                          <td className="px-4 py-2">
                            {item.day2AveragePosition ? item.day2AveragePosition.toFixed(2) : '-'}
                          </td>
                          <td className="px-4 py-2">
                            {item.positionChange !== undefined && item.positionChange !== 0 ? (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                item.positionChange > 0 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {item.positionChange > 0 ? '+' : ''}{item.positionChange.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <div className="space-y-1">
                              {item.individualChanges?.map((userChange, idx) => (
                                <div key={userChange.username} className="text-xs">
                                  <span className="font-medium">{userChange.username}:</span>
                                  <span className="ml-1">
                                    {userChange.day1Position || '-'} → {userChange.day2Position || '-'}
                                    {userChange.change !== null && (
                                      <span className={`ml-1 px-1 py-0.5 rounded text-xs ${
                                        userChange.change > 0 
                                          ? 'bg-green-100 text-green-700' 
                                          : userChange.change < 0
                                          ? 'bg-red-100 text-red-700'
                                          : 'bg-gray-100 text-gray-700'
                                      }`}>
                                        {userChange.change > 0 ? '+' : ''}{userChange.change}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2">{item.averagePosition.toFixed(2)}</td>
                          <td className="px-4 py-2 font-mono text-sm">[{item.positions.join(',')}]</td>
                        </>
                      )}
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