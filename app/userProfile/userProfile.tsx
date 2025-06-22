"use client";

import React, { useState, useEffect } from "react";
import { Session } from "next-auth";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import styles from "../styles/promptbuilder.module.css";
import DailyProgressTracker from "../components/dailyProgressTracker";

interface Props {
  session: Session;
}

const UserProfile: React.FC<Props> = ({ session }) => {
  const router = useRouter();
  const [hasPreferences, setHasPreferences] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Progress tracking state
  const [userProgress, setUserProgress] = useState<any>(null);
  const [progressLoading, setProgressLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // State for random conversation starters
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    "What is phishing?",
    "What makes a strong password?", 
    "How safe is online shopping?",
  ]);

  // Check if user has existing preferences (only for study participants)
  useEffect(() => {
    const checkUserPreferences = async () => {
      if (!session.user?.name) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/getUserPreferences?username=${encodeURIComponent(session.user.name)}`);
        
        if (response.ok) {
          setHasPreferences(true);
        } else if (response.status === 404) {
          setHasPreferences(false);
        } else {
          console.error("Error checking preferences:", await response.text());
          setHasPreferences(false);
        }
      } catch (error) {
        console.error("Error checking user preferences:", error);
        setHasPreferences(false);
      } finally {
        setLoading(false);
      }
    };

    checkUserPreferences();
    loadUserProgress();
    loadRandomConversationStarters();
  }, [session.user?.name]);

  // Load random conversation starters
  const loadRandomConversationStarters = async () => {
    try {
      const response = await fetch('/api/conversationStarters?random=true&limit=3&activeOnly=true');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.starters && data.starters.length > 0) {
          setSuggestedQuestions(data.starters.map((starter: any) => starter.text));
        }
        // If no starters found, keep the default questions
      } else {
        console.error("Failed to load conversation starters:", await response.text());
        // Keep default questions on error
      }
    } catch (error) {
      console.error("Error loading conversation starters:", error);
      // Keep default questions on error
    }
  };

  // Load or initialize user progress
  const loadUserProgress = async () => {
    if (!session.user?.name) {
      setProgressLoading(false);
      return;
    }
    
    setProgressLoading(true);
    try {
      // Try to get existing progress
      const response = await fetch(`/api/getUserProgress?username=${encodeURIComponent(session.user.name)}`);
      
      if (response.ok) {
        const data = await response.json();
        setUserProgress(data.userProgress);
      } else if (response.status === 404) {
        // User progress doesn't exist, initialize it
        const initResponse = await fetch('/api/initializeUserProgress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: session.user.name }),
        });
        
        if (initResponse.ok) {
          const initData = await initResponse.json();
          setUserProgress(initData.userProgress);
        }
      }
    } catch (error) {
      console.error('Error loading user progress:', error);
    } finally {
      setProgressLoading(false);
    }
  };

  const handleOptionClick = (prompt: string | null) => {
    // Study participants get full survey and preference flow regardless of environment
    const surveyParams = new URLSearchParams();
    
    if (hasPreferences === false) {
      // First time user - survey -> preferences setup
      surveyParams.set('redirectTo', '/preferences');
      surveyParams.set('firstTime', 'true');
    } else if (hasPreferences === true) {
      // Existing user - survey -> preferences confirmation
      surveyParams.set('redirectTo', '/preferences');
    } else {
      // Fallback - survey -> directly to chat
      surveyParams.set('redirectTo', '/promptbuilder');
    }
    
    if (prompt) {
      surveyParams.set('initialPrompt', prompt);
    }
    
    router.push(`/survey?${surveyParams.toString()}`);
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    signOut();
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  if (loading) {
    return (
      <div className={styles["pb-main-layout"]}>
        <div className={styles["pb-main-content"]}>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xl text-gray-600">Loading...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles["pb-main-layout"]}>
      <div className={styles["pb-main-content"]}>
        {/* Header with logout button */}
        <div className="flex justify-end p-4">
          <button
            onClick={handleLogoutClick}
            className="
              flex items-center gap-2
              px-4 py-2
              text-gray-600 hover:text-gray-800
              hover:bg-gray-100
              rounded-lg
              transition-colors
              duration-200
              focus:outline-none
              focus:ring-2
              focus:ring-gray-300
            "
            aria-label="Log out"
          >
            <LogOut size={20} />
            <span>Log out</span>
          </button>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col items-center p-4 sm:p-6 lg:p-8 pt-0 overflow-y-auto min-h-0">
          <div className="max-w-4xl w-full py-4">

            {/* Daily Progress Tracker */}
            <DailyProgressTracker 
              userProgress={userProgress}
              loading={progressLoading}
            />

            {/* Start with empty chat button */}
            <div className="mb-8">
              <button
                onClick={() => handleOptionClick(null)}
                className="
                  w-full
                  p-8 
                  bg-white 
                  rounded-xl 
                  shadow-lg 
                  border-2 
                  border-gray-200 
                  hover:border-indigo-300 
                  hover:shadow-xl 
                  active:scale-95
                  active:bg-indigo-50
                  focus:outline-none
                  focus:ring-4
                  focus:ring-indigo-200
                  transition-all 
                  duration-200 
                  group
                  min-h-56
                  sm:min-h-48
                  flex
                  items-center
                  justify-center
                  touch-manipulation
                  select-none
                "
              >
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 group-hover:text-gray-900 group-active:text-gray-900">
                  Start with empty chat
                </h3>
              </button>
            </div>

            {/* Suggested questions section */}
            <div>
              <p className="text-center text-gray-600 mb-4 text-base sm:text-lg">
                or, try starting with one of the following
              </p>
              
              <div className="space-y-3">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleOptionClick(question)}
                    className="
                      w-full
                      p-4 
                      bg-white 
                      rounded-lg 
                      shadow-md 
                      border 
                      border-gray-200 
                      hover:border-indigo-300 
                      hover:shadow-lg 
                      active:scale-98
                      active:bg-indigo-50
                      focus:outline-none
                      focus:ring-2
                      focus:ring-indigo-200
                      transition-all 
                      duration-200 
                      text-center
                      group
                      touch-manipulation
                      select-none
                    "
                  >
                    <span className="text-base sm:text-lg text-gray-800 group-hover:text-gray-900 group-active:text-gray-900">
                      {question}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Confirm Logout</h3>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelLogout}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;