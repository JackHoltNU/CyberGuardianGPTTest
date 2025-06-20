"use client";

import React from 'react';
import { ChevronLeft, CheckCircle } from 'lucide-react';

interface SurveyContainerProps {
  children: React.ReactNode;
  progress: number;
  total: number;
  title?: string;
  onBack?: () => void;
  showProgress?: boolean;
}

const SurveyContainer: React.FC<SurveyContainerProps> = ({
  children,
  progress,
  total,
  title = "Research Survey",
  onBack,
  showProgress = true,
}) => {
  const progressPercentage = (progress / total) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Go back"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                {showProgress && (
                  <p className="text-sm text-gray-600">
                    Question {progress} of {total}
                  </p>
                )}
              </div>
            </div>
            
            {showProgress && (
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 font-medium">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress dots */}
      {showProgress && total <= 10 && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex justify-center gap-2">
              {Array.from({ length: total }, (_, index) => {
                const stepNumber = index + 1;
                const isCompleted = stepNumber < progress;
                const isCurrent = stepNumber === progress;
                
                return (
                  <div
                    key={index}
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      transition-all duration-200
                      ${isCompleted 
                        ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                        : isCurrent
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-400'
                        : 'bg-gray-100 text-gray-500 border-2 border-gray-200'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle size={16} />
                    ) : (
                      stepNumber
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        {children}
      </div>
    </div>
  );
};

export default SurveyContainer;