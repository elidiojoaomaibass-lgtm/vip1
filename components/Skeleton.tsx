
import React from 'react';

interface SkeletonProps {
  className?: string;
  isDarkMode?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', isDarkMode = false }) => {
  return (
    <div 
      className={`animate-pulse rounded-2xl ${
        isDarkMode 
          ? 'bg-zinc-800/50' 
          : 'bg-zinc-200/70'
      } ${className}`} 
    />
  );
};
