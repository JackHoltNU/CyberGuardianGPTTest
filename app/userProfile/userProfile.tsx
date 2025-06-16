"use client";

import React, { useState, useEffect } from "react";
import { Session } from "next-auth";
import { useRouter } from "next/navigation";
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

  // Questions for the initial prompts
  const suggestedQuestions = [
    "What is phishing?",
    "What makes a strong password?",
    "How safe is online shopping?",
  ];

  // Check if user has existing preferences (only on localhost)
  useEffect(() => {
    const checkUserPreferences = async () => {
      if (!session.user?.name) {
        setLoading(false);
        return;
      }

      // Check if running on localhost
      const isLocalhost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      if (!isLocalhost) {
        // Production mode - skip preferences check
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
  }, [session.user?.name]);

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
    // Check if running on localhost
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isLocalhost) {
      // Development mode - use preferences flow
      if (hasPreferences === false) {
        // First time user - go to preferences setup
        if (prompt) {
          router.push(`/preferences?initialPrompt=${encodeURIComponent(prompt)}&firstTime=true`);
        } else {
          router.push("/preferences?firstTime=true");
        }
      } else if (hasPreferences === true) {
        // Existing user - go to preferences confirmation
        if (prompt) {
          router.push(`/preferences?initialPrompt=${encodeURIComponent(prompt)}`);
        } else {
          router.push("/preferences");
        }
      } else {
        // Fallback - go directly to chat
        if (prompt) {
          router.push(`/promptbuilder?initialPrompt=${encodeURIComponent(prompt)}`);
        } else {
          router.push("/promptbuilder");
        }
      }
    } else {
      // Production mode - go directly to promptbuilder chat
      if (prompt) {
        router.push(`/promptbuilder?initialPrompt=${encodeURIComponent(prompt)}`);
      } else {
        router.push("/promptbuilder");
      }
    }
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
        {/* Main content area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl w-full">

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
      </div>
    </div>
  );
};

export default UserProfile;