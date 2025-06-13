"use client";

import React, { useState, useEffect } from "react";
import { Session } from "next-auth";
import UserProfile from "../userProfile/userProfile";
import PromptBuilderChat from "../promptbuilder/promptBuilderChat";

interface Props {
  session: Session;
}

const HomeWrapper: React.FC<Props> = ({ session }) => {
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if running on localhost
    const localhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    setIsLocalhost(localhost);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (isLocalhost) {
    // Development mode - show user profile with buttons
    return <UserProfile session={session} />;
  } else {
    // Production mode - go directly to promptbuilder chat
    return <PromptBuilderChat session={session} />;
  }
};

export default HomeWrapper;