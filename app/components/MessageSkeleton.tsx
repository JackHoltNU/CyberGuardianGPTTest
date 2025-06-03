import React from "react";

interface MessageSkeletonProps {
  fontSize: string;
}

const MessageSkeleton: React.FC<MessageSkeletonProps> = ({ fontSize }) => (
  <div
    className={`max-w-xs md:max-w-md lg:max-w-lg min-w-[300px] md:min-w-[350px] bg-gray-100 text-gray-800 border-l-4 border-gray-500 rounded-lg overflow-hidden animate-pulse ${fontSize}`}
  >
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-300 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
    </div>
  </div>
);

export type { MessageSkeletonProps };
export default MessageSkeleton;
