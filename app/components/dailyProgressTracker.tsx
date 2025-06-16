"use client";

import React from "react";
import { Check } from "lucide-react";

interface DailyInteraction {
  day: number;
  date: Date;
  interactionCount: number;
  firstInteractionTime: Date;
}

interface UserProgress {
  username: string;
  studyStartDate: Date;
  dailyInteractions: DailyInteraction[];
  currentDay: number;
  completedDays: number;
  isStudyComplete: boolean;
}

interface DailyProgressTrackerProps {
  userProgress: UserProgress | null;
  loading?: boolean;
}

const DailyProgressTracker: React.FC<DailyProgressTrackerProps> = ({ 
  userProgress, 
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="text-center text-gray-600">Loading progress...</div>
      </div>
    );
  }

  if (!userProgress) {
    return null;
  }

  const completedDayNumbers = new Set(
    userProgress.dailyInteractions.map(interaction => interaction.day)
  );

  const getDayStatus = (dayNumber: number) => {
    const isCompleted = completedDayNumbers.has(dayNumber);
    
    // Check if this day was completed today (same calendar day GMT)
    const today = new Date();
    const todayDateGMT = new Date(today.toISOString().split('T')[0]);
    
    const todayInteraction = userProgress.dailyInteractions.find(interaction => {
      const interactionDateGMT = new Date(new Date(interaction.date).toISOString().split('T')[0]);
      return interaction.day === dayNumber && 
             interactionDateGMT.getTime() === todayDateGMT.getTime();
    });
    
    const isToday = !!todayInteraction;
    
    // Check if any day was completed today
    const anyDayCompletedToday = userProgress.dailyInteractions.some(interaction => {
      const interactionDateGMT = new Date(new Date(interaction.date).toISOString().split('T')[0]);
      return interactionDateGMT.getTime() === todayDateGMT.getTime();
    });
    
    // Blue border logic: 
    // - If a day was completed today, that day gets the blue border
    // - If no day was completed today, then currentDay gets the blue border (if not completed)
    const isCurrent = isToday || (dayNumber === userProgress.currentDay && !isCompleted && !anyDayCompletedToday);
    
    // Future logic: any day that's not completed, not current, and not completed today
    const isFuture = !isCompleted && !isCurrent && !isToday;

    return { isCompleted, isCurrent, isFuture, isToday };
  };

  const renderProgressSquare = (dayNumber: number) => {
    const { isCompleted, isCurrent, isFuture, isToday } = getDayStatus(dayNumber);
    
    let baseClasses = "w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 flex items-center justify-center rounded-lg border-2 font-semibold text-sm sm:text-base transition-all duration-200";
    
    if (isCompleted && isToday) {
      // Completed today - green background with blue border
      baseClasses += " bg-green-500 border-blue-500 text-white shadow-md ring-2 ring-blue-200";
    } else if (isCompleted) {
      // Completed on previous day
      baseClasses += " bg-green-500 border-green-500 text-white shadow-md";
    } else if (isCurrent) {
      // Not completed but is current day
      baseClasses += " bg-blue-50 border-blue-500 text-blue-700 shadow-md ring-2 ring-blue-200";
    } else if (isFuture) {
      baseClasses += " bg-gray-50 border-gray-300 text-gray-400";
    } else {
      baseClasses += " bg-orange-50 border-orange-400 text-orange-600";
    }

    return (
      <div
        key={dayNumber}
        className={baseClasses}
        title={
          isCompleted && isToday
            ? `Day ${dayNumber} - Completed Today` 
            : isCompleted 
            ? `Day ${dayNumber} - Completed` 
            : isCurrent 
            ? `Day ${dayNumber} - Today` 
            : `Day ${dayNumber}`
        }
      >
        {isCompleted ? (
          <Check size={16} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
        ) : (
          <span>{dayNumber}</span>
        )}
      </div>
    );
  };

  const progressPercentage = Math.round((userProgress.completedDays / 14) * 100);

  return (
    <div className="w-full max-w-4xl mx-auto mb-6 p-4 sm:p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="mb-4">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 text-center">
          14-Day Study Progress
        </h3>
        <div className="text-center text-sm sm:text-base text-gray-600 mb-4">
          {userProgress.completedDays} of 14 days completed ({progressPercentage}%)
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Progress squares grid */}
      <div className="grid grid-cols-7 gap-2 sm:gap-3 lg:gap-4 justify-items-center">
        {/* First row: Days 1-7 */}
        {Array.from({ length: 7 }, (_, i) => renderProgressSquare(i + 1))}
        
        {/* Second row: Days 8-14 */}
        {Array.from({ length: 7 }, (_, i) => renderProgressSquare(i + 8))}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap justify-center gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded border-2 border-green-500 flex items-center justify-center">
              <Check size={10} className="text-white" />
            </div>
            <span className="text-gray-700">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-50 border-2 border-blue-500 rounded ring-1 ring-blue-200"></div>
            <span className="text-gray-700">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-50 border-2 border-gray-300 rounded"></div>
            <span className="text-gray-700">Upcoming</span>
          </div>
        </div>
      </div>

      {userProgress.isStudyComplete && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
          <div className="text-green-800 font-semibold">
            🎉 Congratulations! You&apos;ve completed the 14-day study!
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyProgressTracker;