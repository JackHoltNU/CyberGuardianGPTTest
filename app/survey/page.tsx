"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getServerSession } from "next-auth";
import ButtonSortingTask from '../components/buttonSortingTask';
import SurveyContainer from '../components/surveyContainer';
import { SurveyDefinition, SurveySession } from '../types/survey';
import { getSurveysForUser } from '../config/surveys';

const SurveyPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentSurveyIndex, setCurrentSurveyIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [surveys, setSurveys] = useState<SurveyDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState<string>('');
  const [studyDay, setStudyDay] = useState(1);
  const [sessionId] = useState(() => `survey_${Date.now()}_${Math.random().toString(36).substring(7)}`);
  const [startTime] = useState(Date.now());

  // Get redirect destination from URL params
  const redirectTo = searchParams.get('redirectTo') || '/preferences';
  const initialPrompt = searchParams.get('initialPrompt');

  useEffect(() => {
    const initializeSurvey = async () => {
      try {
        // Get session info (in a real app, you'd get this from NextAuth)
        // For now, we'll simulate it
        const sessionResponse = await fetch('/api/auth/session');
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          if (sessionData?.user?.name) {
            setUsername(sessionData.user.name);
          } else {
            // Redirect to login if no session
            router.push('/api/auth/signin');
            return;
          }
        }

        // Get user's current study day
        let currentStudyDay = 1;
        if (username) {
          try {
            const progressResponse = await fetch(`/api/getUserProgress?username=${encodeURIComponent(username)}`);
            if (progressResponse.ok) {
              const progressData = await progressResponse.json();
              currentStudyDay = progressData.userProgress?.currentDay || 1;
            }
          } catch (error) {
            console.warn('Could not fetch user progress, using day 1');
          }
        }
        setStudyDay(currentStudyDay);

        // Get surveys for this user and study day
        console.log(`Fetching surveys for studyDay=${currentStudyDay}`);
        let fetchedSurveys = [];
        try {
          const surveyResponse = await fetch(`/api/getActiveSurveys?studyDay=${currentStudyDay}&isStudyParticipant=true`);
          console.log('Survey response status:', surveyResponse.status);
          if (surveyResponse.ok) {
            const surveyData = await surveyResponse.json();
            fetchedSurveys = surveyData.surveys || [];
            console.log('Fetched surveys:', fetchedSurveys);
          } else {
            console.error('Failed to fetch surveys, status:', surveyResponse.status);
            const errorText = await surveyResponse.text();
            console.error('Error response:', errorText);
          }
        } catch (error) {
          console.error('Error fetching surveys:', error);
        }

        setSurveys(fetchedSurveys);

        // If no surveys, redirect immediately
        if (fetchedSurveys.length === 0) {
          console.log('No surveys found, redirecting...');
          handleSurveyComplete();
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Error initializing survey:', error);
        // On error, skip surveys and continue
        handleSurveyComplete();
      }
    };

    initializeSurvey();
  }, [username, router]);

  const saveSurveyResponse = async (surveyId: string, surveyType: string, response: any) => {
    try {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      
      const saveResponse = await fetch('/api/saveSurveyResponse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          surveyId,
          surveyType,
          response,
          studyDay,
          sessionId,
          timeSpent
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save survey response');
      }

      return await saveResponse.json();
    } catch (error) {
      console.error('Error saving survey response:', error);
      throw error;
    }
  };

  const handleSurveyComplete = async (surveyId?: string, response?: any) => {
    if (surveyId && response) {
      setSaving(true);
      try {
        const currentSurvey = surveys[currentSurveyIndex];
        await saveSurveyResponse(surveyId, currentSurvey.type, response);
        
        // Store response locally
        setResponses(prev => ({ ...prev, [surveyId]: response }));
      } catch (error) {
        console.error('Failed to save survey response:', error);
        // Continue anyway - don't block user progress
      }
      setSaving(false);
    }

    // Check if there are more surveys
    if (currentSurveyIndex < surveys.length - 1) {
      setCurrentSurveyIndex(prev => prev + 1);
      // Scroll to top when moving to next survey (with small delay to ensure rendering)
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } else {
      // All surveys complete, redirect to next page
      let redirectUrl = redirectTo;
      if (initialPrompt) {
        const separator = redirectUrl.includes('?') ? '&' : '?';
        redirectUrl += `${separator}initialPrompt=${encodeURIComponent(initialPrompt)}`;
      }
      router.push(redirectUrl);
    }
  };

  const handleBack = () => {
    if (currentSurveyIndex > 0) {
      setCurrentSurveyIndex(prev => prev - 1);
    } else {
      // Go back to home page
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading survey...</p>
        </div>
      </div>
    );
  }

  if (surveys.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No surveys available. Redirecting...</p>
        </div>
      </div>
    );
  }

  const currentSurvey = surveys[currentSurveyIndex];

  return (
    <SurveyContainer
      progress={currentSurveyIndex + 1}
      total={surveys.length}
      title="Research Survey"
      onBack={handleBack}
      showProgress={surveys.length > 1}
    >
      {saving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Saving your response...</p>
          </div>
        </div>
      )}

      {currentSurvey.type === 'sorting' && (
        <ButtonSortingTask
          key={currentSurvey.id}
          {...(currentSurvey.config as any)}
          onComplete={(result) => handleSurveyComplete(currentSurvey.id, result)}
        />
      )}
      
      {/* Add other survey types here later */}
    </SurveyContainer>
  );
};

export default SurveyPage;