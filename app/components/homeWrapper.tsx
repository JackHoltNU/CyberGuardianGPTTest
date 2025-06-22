"use client";

import React, { useState, useEffect } from "react";
import { Session } from "next-auth";
import UserProfile from "../userProfile/userProfile";
import PromptBuilderChat from "../promptbuilder/promptBuilderChat";

interface Props {
  session: Session;
}

const HomeWrapper: React.FC<Props> = ({ session }) => {
  const [isStudyParticipant, setIsStudyParticipant] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStudyParticipation = async () => {
      if (!session.user?.name) {
        setIsLoading(false);
        return;
      }

      try {
        // Check if user has study progress (indicates they're a study participant)
        const response = await fetch(`/api/getUserProgress?username=${encodeURIComponent(session.user.name)}`);
        
        if (response.ok) {
          // User has progress = study participant
          setIsStudyParticipant(true);
        } else if (response.status === 404) {
          // No progress found = not a study participant
          setIsStudyParticipant(false);
        } else {
          console.error("Error checking study participation:", await response.text());
          setIsStudyParticipant(false);
        }
      } catch (error) {
        console.error("Error checking study participation:", error);
        setIsStudyParticipant(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkStudyParticipation();
  }, [session.user?.name]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (isStudyParticipant) {
    // Study participant - show user profile with progress tracker, conversation starters, etc.
    return <UserProfile session={session} />;
  } else {
    // Non-study participant - go directly to promptbuilder chat
    return <PromptBuilderChat session={session} />;
  }
};

export default HomeWrapper;