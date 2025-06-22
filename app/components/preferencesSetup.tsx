"use client";

import React, { useState, useEffect } from "react";
import { Session } from "next-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { usePromptBuilder } from "../context/usePromptBuilder";
import PromptBuilder from "../promptbuilder/promptBuilder";
import { PromptConfiguration } from "../types/types";
import styles from "../styles/promptbuilder.module.css";

interface Props {
  session: Session;
}

const PreferencesSetup: React.FC<Props> = ({ session }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  
  const initialPrompt = searchParams.get('initialPrompt');
  const isFirstTime = searchParams.get('firstTime') === 'true';
  
  const {
    getCurrentConfiguration,
    applyConfiguration,
  } = usePromptBuilder();

  // Load existing preferences if not first time
  useEffect(() => {
    const loadExistingPreferences = async () => {
      if (isFirstTime || !session.user?.name) {
        setPreferencesLoaded(true);
        return;
      }

      try {
        const response = await fetch(`/api/getUserPreferences?username=${encodeURIComponent(session.user.name)}`);
        
        if (response.ok) {
          const data = await response.json();
          // Apply the loaded configuration to the prompt builder
          applyConfiguration({
            ...data.preferences,
            id: "loaded-preferences"
          });
        } else {
          console.error("Failed to load preferences:", await response.text());
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      } finally {
        setPreferencesLoaded(true);
      }
    };

    loadExistingPreferences();
  }, [isFirstTime, session.user?.name]); // Removed applyConfiguration from dependencies

  // Font sizes for the prompt builder
  const fontSizes = {
    chat: "1.05rem",
    input: "1.05rem",
    header: "1.25rem",
  };

  const handleSavePreferences = async () => {
    if (!session.user?.name) {
      setError("User session not found");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const currentConfig = getCurrentConfiguration();
      
      const response = await fetch("/api/saveUserPreferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: session.user.name,
          promptConfiguration: currentConfig,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save preferences");
      }

      // Navigate to promptbuilder chat with initial prompt if provided
      if (initialPrompt) {
        router.push(`/promptbuilder?initialPrompt=${encodeURIComponent(initialPrompt)}`);
      } else {
        router.push("/promptbuilder");
      }

    } catch (error) {
      console.error("Error saving preferences:", error);
      setError(error instanceof Error ? error.message : "Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className={styles["pb-main-layout"]}>
      <div className={styles["pb-main-content"]}>
        {/* Header */}
        <header className={`${styles["pb-header"]} ${styles["pb-header-padding"]}`}>
          <div className="flex items-center justify-center w-full">
            <h1 style={{ fontSize: "1.5em", margin: 0, textAlign: "center" }}>
              Chat Style Preferences
            </h1>
          </div>
        </header>

        {/* Main content area */}
        <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-4xl w-full mx-auto">
            
            {/* Introduction text */}
            <div className="text-center mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-800">
                {isFirstTime 
                  ? "Chat Style Preferences" 
                  : "Confirm Your Chat Preferences"
                }
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                {isFirstTime 
                  ? "Let's set up your chat style preferences. You can always change these later."
                  : "These are your saved preferences from previous sessions. You can adjust them or continue with the current settings."
                }
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Prompt Builder in a contained box */}
            <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 mb-8">
              <div className="p-4 border-b border-gray-200 bg-indigo-600 text-white rounded-t-lg">
                <h3 className="font-semibold text-lg">Customize Chat Style</h3>
              </div>
              <div className="p-6">
                {preferencesLoaded ? (
                  <PromptBuilder
                    comparisonConfigs={[]}
                    currentConfig={getCurrentConfiguration()}
                    comparisonMessages={[]}
                    comparisonMode={false}
                    comparisonCounter={0}
                    totalComparisons={0}
                    fontSizes={fontSizes}
                    configColorMap={new Map()}
                  />
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-600">Loading your preferences...</div>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-center">
              <button
                onClick={handleSavePreferences}
                disabled={loading}
                className="
                  px-8 py-4 
                  bg-indigo-600 
                  hover:bg-indigo-700 
                  disabled:bg-indigo-400
                  text-white 
                  rounded-lg 
                  font-semibold 
                  text-lg
                  transition-colors 
                  duration-200
                  focus:outline-none
                  focus:ring-4
                  focus:ring-indigo-200
                  touch-manipulation
                  select-none
                "
              >
                {loading ? "Saving..." : "Save & Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesSetup;