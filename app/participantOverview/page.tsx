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

interface SurveyComparison {
  surveyId: string;
  surveyTitle: string;
  day2: {
    response: Array<{id: string; text: string}>;
    completedAt: string;
    timeSpent?: number;
  } | null;
  day14: {
    response: Array<{id: string; text: string}>;
    completedAt: string;
    timeSpent?: number;
  } | null;
}

interface PromptConfiguration {
  tone: string;
  languageDifficulty: string;
  answerLength: string;
  technicalDifficulty: string;
  instructionFormat: string;
  toneLabel: string;
  languageDifficultyLabel: string;
  answerLengthLabel: string;
  technicalDifficultyLabel: string;
  instructionFormatLabel: string;
  specifyDevices: boolean;
  selectedDevices?: string[];
  computerType?: string;
  tabletType?: string;
  mobileType?: string;
  browser?: string;
  additionalInstructions?: string;
}

export default function ParticipantOverviewPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetails | null>(null);
  const [studyParticipants, setStudyParticipants] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [userSettings, setUserSettings] = useState<PromptConfiguration | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [configHistory, setConfigHistory] = useState<{
    firstConfig: PromptConfiguration | null;
    changes: Array<{
      date: Date;
      field: string;
      oldValue: string;
      newValue: string;
      oldLabel: string;
      newLabel: string;
    }>;
  }>({ firstConfig: null, changes: [] });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [surveyComparisons, setSurveyComparisons] = useState<SurveyComparison[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<string>('');
  const [surveyLoading, setSurveyLoading] = useState(false);

  useEffect(() => {
    fetchStudyParticipants();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchConversations();
      fetchUserSettings();
      fetchConfigurationHistory();
      fetchSurveyComparisons();
    } else {
      setConversations([]);
      setSelectedConversation(null);
      setUserSettings(null);
      setConfigHistory({ firstConfig: null, changes: [] });
      setSurveyComparisons([]);
      setSelectedSurvey('');
    }
  }, [selectedUser]);

  const fetchStudyParticipants = async () => {
    try {
      const response = await fetch('/api/getStudyParticipants');
      const data = await response.json();
      const usernames = data.participants?.map((p: any) => p.username) || [];
      setStudyParticipants(usernames);
    } catch (error) {
      console.error('Error fetching study participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/studyMessages?username=${encodeURIComponent(selectedUser)}`);
      const data = await response.json();
      
      if (response.ok) {
        setConversations(data.conversations || []);
      } else {
        console.error('Error fetching conversations:', data.error);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSettings = async () => {
    if (!selectedUser) return;
    
    try {
      setSettingsLoading(true);
      const response = await fetch(`/api/getUserPreferences?username=${encodeURIComponent(selectedUser)}`);
      const data = await response.json();
      
      if (response.ok) {
        setUserSettings(data.preferences || null);
      } else {
        console.error('Error fetching user settings:', data.error);
        setUserSettings(null);
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
      setUserSettings(null);
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchConfigurationHistory = async () => {
    if (!selectedUser) return;
    
    try {
      setHistoryLoading(true);
      
      // Fetch all conversations for the user to analyze configuration history
      const response = await fetch(`/api/admin/studyMessages?username=${encodeURIComponent(selectedUser)}`);
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error fetching conversations for history:', data.error);
        return;
      }
      
      const conversations = data.conversations || [];
      const allMessages: Array<{ timestamp: Date; promptConfig?: PromptConfiguration }> = [];
      
      // Fetch detailed messages from each conversation
      for (const conv of conversations) {
        try {
          const detailResponse = await fetch(`/api/admin/studyMessages?threadID=${conv.threadID}`);
          const detailData = await detailResponse.json();
          
          if (detailResponse.ok && detailData.conversation?.messages) {
            // Filter for assistant messages with promptConfig and add to timeline
            const messagesWithConfig = detailData.conversation.messages
              .filter((msg: any) => msg.sender === 'assistant' && msg.promptConfig)
              .map((msg: any) => ({
                timestamp: new Date(msg.timestamp),
                promptConfig: msg.promptConfig
              }));
            
            allMessages.push(...messagesWithConfig);
          }
        } catch (error) {
          console.error(`Error fetching conversation ${conv.threadID}:`, error);
        }
      }
      
      // Sort messages by timestamp
      allMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      if (allMessages.length === 0) {
        setConfigHistory({ firstConfig: null, changes: [] });
        return;
      }
      
      // Analyze configuration changes
      const firstConfig = allMessages[0].promptConfig || null;
      const changes: Array<{
        date: Date;
        field: string;
        oldValue: string;
        newValue: string;
        oldLabel: string;
        newLabel: string;
      }> = [];
      
      let previousConfig = firstConfig;
      
      for (let i = 1; i < allMessages.length; i++) {
        const currentMessage = allMessages[i];
        const currentConfig = currentMessage.promptConfig;
        
        if (!currentConfig || !previousConfig) continue;
        
        // Compare configurations and detect changes
        const configFields = [
          { key: 'tone', labelKey: 'toneLabel', displayName: 'Tone' },
          { key: 'languageDifficulty', labelKey: 'languageDifficultyLabel', displayName: 'Language Difficulty' },
          { key: 'answerLength', labelKey: 'answerLengthLabel', displayName: 'Answer Length' },
          { key: 'technicalDifficulty', labelKey: 'technicalDifficultyLabel', displayName: 'Technical Difficulty' },
          { key: 'instructionFormat', labelKey: 'instructionFormatLabel', displayName: 'Instruction Format' },
          { key: 'specifyDevices', labelKey: null, displayName: 'Device Specification' },
          { key: 'computerType', labelKey: null, displayName: 'Computer Type' },
          { key: 'tabletType', labelKey: null, displayName: 'Tablet Type' },
          { key: 'mobileType', labelKey: null, displayName: 'Mobile Type' },
          { key: 'browser', labelKey: null, displayName: 'Browser' },
          { key: 'additionalInstructions', labelKey: null, displayName: 'Additional Instructions' }
        ];
        
        for (const field of configFields) {
          const oldValue = (previousConfig as any)[field.key];
          const newValue = (currentConfig as any)[field.key];
          
          if (oldValue !== newValue) {
            let oldLabel, newLabel;
            
            if (field.labelKey) {
              oldLabel = (previousConfig as any)[field.labelKey] || oldValue;
              newLabel = (currentConfig as any)[field.labelKey] || newValue;
            } else if (field.key === 'specifyDevices') {
              oldLabel = oldValue ? 'Enabled' : 'Disabled';
              newLabel = newValue ? 'Enabled' : 'Disabled';
            } else {
              oldLabel = oldValue || '(empty)';
              newLabel = newValue || '(empty)';
            }
            
            changes.push({
              date: currentMessage.timestamp,
              field: field.displayName,
              oldValue: String(oldValue),
              newValue: String(newValue),
              oldLabel: String(oldLabel),
              newLabel: String(newLabel)
            });
          }
        }
        
        // Handle selectedDevices array changes
        const oldDevices = previousConfig.selectedDevices || [];
        const newDevices = currentConfig.selectedDevices || [];
        
        if (JSON.stringify(oldDevices.sort()) !== JSON.stringify(newDevices.sort())) {
          changes.push({
            date: currentMessage.timestamp,
            field: 'Selected Devices',
            oldValue: oldDevices.join(', '),
            newValue: newDevices.join(', '),
            oldLabel: oldDevices.length > 0 ? oldDevices.join(', ') : '(none)',
            newLabel: newDevices.length > 0 ? newDevices.join(', ') : '(none)'
          });
        }
        
        previousConfig = currentConfig;
      }
      
      setConfigHistory({ firstConfig, changes });
      
    } catch (error) {
      console.error('Error analyzing configuration history:', error);
      setConfigHistory({ firstConfig: null, changes: [] });
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchSurveyComparisons = async () => {
    if (!selectedUser) return;
    
    try {
      setSurveyLoading(true);
      const response = await fetch(`/api/getParticipantSurveyComparison?username=${encodeURIComponent(selectedUser)}`);
      const data = await response.json();
      
      if (response.ok) {
        setSurveyComparisons(data.surveys || []);
        // Auto-select first survey if available
        if (data.surveys && data.surveys.length > 0) {
          setSelectedSurvey(data.surveys[0].surveyId);
        }
      } else {
        console.error('Error fetching survey comparisons:', data.error);
        setSurveyComparisons([]);
      }
    } catch (error) {
      console.error('Error fetching survey comparisons:', error);
      setSurveyComparisons([]);
    } finally {
      setSurveyLoading(false);
    }
  };

  const fetchConversationDetails = async (threadID: string) => {
    try {
      setMessageLoading(true);
      const response = await fetch(`/api/admin/studyMessages?threadID=${threadID}`);
      const data = await response.json();
      
      if (response.ok) {
        setSelectedConversation(data.conversation);
      } else {
        console.error('Error fetching conversation details:', data.error);
      }
    } catch (error) {
      console.error('Error fetching conversation details:', error);
    } finally {
      setMessageLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculatePositionChange = (day2Ranking: Array<{id: string; text: string}>, day14Ranking: Array<{id: string; text: string}>, itemId: string) => {
    const day2Position = day2Ranking.findIndex(item => item.id === itemId);
    const day14Position = day14Ranking.findIndex(item => item.id === itemId);
    
    if (day2Position === -1 || day14Position === -1) {
      return null; // Item not found in one of the rankings
    }
    
    // Position change: positive means moved up (lower position number = higher rank)
    const change = day2Position - day14Position;
    return change;
  };


  return (
    <div className="flex flex-col w-screen h-screen items-center">
      <div className="flex flex-col-reverse md:flex-row w-full">
        <AdminSidebar selected={10} />
        <main className="users">
          <h1 className="text-2xl font-bold mb-6">Participant Overview</h1>
          
          {/* User Selection */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <label htmlFor="user-select" className="text-sm font-medium text-gray-700 mb-2">
                  Select Participant
                </label>
                <select
                  id="user-select"
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="">Choose a participant...</option>
                  {studyParticipants.map((username) => (
                    <option key={username} value={username}>
                      {username}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedUser && (
                <div className="text-sm text-gray-600 mt-6">
                  Showing conversations for: <strong>{selectedUser}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Survey Comparison */}
          {selectedUser && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Survey Comparison (Day 2 vs Day 14)</h2>
              
              {surveyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-600">Loading survey data...</div>
                </div>
              ) : surveyComparisons.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No surveys found for this participant.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Survey Selection Dropdown */}
                  <div className="flex items-center gap-4">
                    <label htmlFor="survey-select" className="text-sm font-medium text-gray-700">
                      Select Survey:
                    </label>
                    <select
                      id="survey-select"
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[300px]"
                      value={selectedSurvey}
                      onChange={(e) => setSelectedSurvey(e.target.value)}
                    >
                      <option value="">Choose a survey...</option>
                      {surveyComparisons.map((survey) => (
                        <option key={survey.surveyId} value={survey.surveyId}>
                          {survey.surveyTitle}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Survey Comparison Display */}
                  {selectedSurvey && (() => {
                    const comparison = surveyComparisons.find(s => s.surveyId === selectedSurvey);
                    if (!comparison) return null;

                    const hasDay2 = comparison.day2 !== null;
                    const hasDay14 = comparison.day14 !== null;

                    if (!hasDay2 && !hasDay14) {
                      return (
                        <div className="text-center text-gray-500 py-8">
                          No responses found for this survey on days 2 or 14.
                        </div>
                      );
                    }

                    // Check if items match between days (only if both exist)
                    let itemsMatch = true;
                    if (hasDay2 && hasDay14) {
                      const day2Items = [...comparison.day2!.response].map(item => item.id).sort();
                      const day14Items = [...comparison.day14!.response].map(item => item.id).sort();
                      itemsMatch = JSON.stringify(day2Items) === JSON.stringify(day14Items);
                    }

                    if (!itemsMatch) {
                      return (
                        <div className="text-center text-red-500 py-8">
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h3 className="font-medium text-red-800 mb-2">Error: Survey Items Do Not Match</h3>
                            <p className="text-red-700">
                              The survey items are different between day 2 and day 14 responses. 
                              This may indicate a survey configuration change or data inconsistency.
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Day 2 Results */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-medium text-gray-800 mb-3">Day 2 Results</h3>
                          {hasDay2 ? (
                            <div className="space-y-2">
                              {comparison.day2!.response.map((item, index) => (
                                <div key={item.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                                  <span className="font-medium text-gray-600 min-w-[24px]">{index + 1}.</span>
                                  <span className="text-gray-900">{item.text}</span>
                                </div>
                              ))}
                              <div className="text-xs text-gray-500 mt-2">
                                Completed: {formatDate(comparison.day2!.completedAt)}
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-500 italic">Survey not taken</div>
                          )}
                        </div>

                        {/* Day 14 Results */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-medium text-gray-800 mb-3">Day 14 Results</h3>
                          {hasDay14 ? (
                            <div className="space-y-2">
                              {comparison.day14!.response.map((item, index) => {
                                let changeIndicator = null;
                                if (hasDay2 && hasDay14) {
                                  const change = calculatePositionChange(
                                    comparison.day2!.response,
                                    comparison.day14!.response,
                                    item.id
                                  );
                                  if (change !== null && change !== 0) {
                                    const isImprovement = change > 0;
                                    changeIndicator = (
                                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                                        isImprovement 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {isImprovement ? '+' : ''}{change}
                                      </span>
                                    );
                                  }
                                }
                                
                                return (
                                  <div key={item.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                                    <span className="font-medium text-gray-600 min-w-[24px]">{index + 1}.</span>
                                    <span className="text-gray-900 flex-1">{item.text}</span>
                                    {changeIndicator}
                                  </div>
                                );
                              })}
                              <div className="text-xs text-gray-500 mt-2">
                                Completed: {formatDate(comparison.day14!.completedAt)}
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-500 italic">Survey not taken</div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Prompt Builder Settings */}
          {selectedUser && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Current Prompt Builder Settings</h2>
              
              {settingsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-600">Loading settings...</div>
                </div>
              ) : userSettings ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700 mb-1">Tone</span>
                    <span className="text-gray-900">{userSettings.toneLabel}</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700 mb-1">Language Difficulty</span>
                    <span className="text-gray-900">{userSettings.languageDifficultyLabel}</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700 mb-1">Answer Length</span>
                    <span className="text-gray-900">{userSettings.answerLengthLabel}</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700 mb-1">Technical Difficulty</span>
                    <span className="text-gray-900">{userSettings.technicalDifficultyLabel}</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700 mb-1">Instruction Format</span>
                    <span className="text-gray-900">{userSettings.instructionFormatLabel}</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700 mb-1">Device Specification</span>
                    <span className="text-gray-900">{userSettings.specifyDevices ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  
                  {userSettings.specifyDevices && (
                    <>
                      {userSettings.selectedDevices && userSettings.selectedDevices.length > 0 && (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-700 mb-1">Selected Devices</span>
                          <span className="text-gray-900">{userSettings.selectedDevices.join(', ')}</span>
                        </div>
                      )}
                      
                      {userSettings.computerType && (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-700 mb-1">Computer Type</span>
                          <span className="text-gray-900">{userSettings.computerType}</span>
                        </div>
                      )}
                      
                      {userSettings.tabletType && (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-700 mb-1">Tablet Type</span>
                          <span className="text-gray-900">{userSettings.tabletType}</span>
                        </div>
                      )}
                      
                      {userSettings.mobileType && (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-700 mb-1">Mobile Type</span>
                          <span className="text-gray-900">{userSettings.mobileType}</span>
                        </div>
                      )}
                      
                      {userSettings.browser && (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-700 mb-1">Browser</span>
                          <span className="text-gray-900">{userSettings.browser}</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  {userSettings.additionalInstructions && (
                    <div className="flex flex-col md:col-span-2 lg:col-span-3">
                      <span className="text-sm font-medium text-gray-700 mb-1">Additional Instructions</span>
                      <span className="text-gray-900">{userSettings.additionalInstructions}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No prompt builder settings found for this participant. They may not have configured their preferences yet.
                </div>
              )}
            </div>
          )}

          {/* Configuration History */}
          {selectedUser && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Prompt Builder Configuration History</h2>
              
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-600">Analyzing configuration history...</div>
                </div>
              ) : configHistory.firstConfig || configHistory.changes.length > 0 ? (
                <div className="space-y-6">
                  {/* First Configuration Used */}
                  {configHistory.firstConfig && (
                    <div>
                      <h3 className="text-md font-medium mb-3 text-gray-700">First Configuration Used</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-700 mb-1">Tone</span>
                            <span className="text-gray-900">{configHistory.firstConfig.toneLabel}</span>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-700 mb-1">Language Difficulty</span>
                            <span className="text-gray-900">{configHistory.firstConfig.languageDifficultyLabel}</span>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-700 mb-1">Answer Length</span>
                            <span className="text-gray-900">{configHistory.firstConfig.answerLengthLabel}</span>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-700 mb-1">Technical Difficulty</span>
                            <span className="text-gray-900">{configHistory.firstConfig.technicalDifficultyLabel}</span>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-700 mb-1">Instruction Format</span>
                            <span className="text-gray-900">{configHistory.firstConfig.instructionFormatLabel}</span>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-700 mb-1">Device Specification</span>
                            <span className="text-gray-900">{configHistory.firstConfig.specifyDevices ? 'Enabled' : 'Disabled'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Configuration Changes Timeline */}
                  {configHistory.changes.length > 0 && (
                    <div>
                      <h3 className="text-md font-medium mb-3 text-gray-700">Configuration Changes</h3>
                      <div className="space-y-3">
                        {configHistory.changes.map((change, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-gray-900">
                                <span className="font-medium">On {change.date.toLocaleDateString()}</span>
                                {', '}
                                <span>user changed </span>
                                <span className="font-medium">{change.field}</span>
                                <span> from </span>
                                <span className="font-medium text-red-600">&quot;{change.oldLabel}&quot;</span>
                                <span> to </span>
                                <span className="font-medium text-green-600">&quot;{change.newLabel}&quot;</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {change.date.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {configHistory.changes.length === 0 && configHistory.firstConfig && (
                    <div className="text-center text-gray-500 py-4">
                      No configuration changes detected. User has maintained consistent settings.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No configuration history found. This participant may not have sent any messages with prompt configurations yet.
                </div>
              )}
            </div>
          )}

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
                    <div className="text-gray-500">
                      {selectedUser ? 'No conversations found for this participant.' : 'Select a participant to view their conversations.'}
                    </div>
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
                        {selectedConversation.messages.map((message, index) => {
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
                        })}
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
