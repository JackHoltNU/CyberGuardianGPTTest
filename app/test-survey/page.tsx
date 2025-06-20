"use client";

import React, { useState } from 'react';
import SortingTask from '../components/sortingTask';
import SurveyContainer from '../components/surveyContainer';
import { cybersecurityPrioritiesSurvey } from '../config/surveys';

const TestSurveyPage = () => {
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState(null);

  const handleComplete = (sortedItems: any) => {
    setResult(sortedItems);
    setCompleted(true);
  };

  if (completed) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-green-700 mb-4">Survey Completed!</h2>
          <p className="text-gray-700 mb-4">Thank you for completing the sorting task.</p>
          
          <h3 className="font-semibold text-gray-900 mb-2">Your Rankings:</h3>
          <ol className="list-decimal list-inside space-y-2">
            {result.map((item: any, index: number) => (
              <li key={item.id} className="text-gray-700">
                <strong>{item.text}</strong>
                {item.description && (
                  <span className="text-gray-600 text-sm ml-2">- {item.description}</span>
                )}
              </li>
            ))}
          </ol>
          
          <div className="mt-6">
            <button
              onClick={() => {
                setCompleted(false);
                setResult(null);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SurveyContainer
      progress={1}
      total={1}
      title="Test Survey"
      showProgress={false}
    >
      <SortingTask
        {...cybersecurityPrioritiesSurvey.config}
        onComplete={handleComplete}
      />
    </SurveyContainer>
  );
};

export default TestSurveyPage;