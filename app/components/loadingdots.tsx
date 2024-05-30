import React from 'react';

const LoadingDots: React.FC = () => {
  return (
    <div className="flex space-x-1">
      <div className="bg-gray-600 w-2 h-2 rounded-full animate-dot1"></div>
      <div className="bg-gray-600 w-2 h-2 rounded-full animate-dot2"></div>
      <div className="bg-gray-600 w-2 h-2 rounded-full animate-dot3"></div>
    </div>
  );
};

export default LoadingDots;