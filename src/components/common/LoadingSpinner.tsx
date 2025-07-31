import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  text = 'Loading...', 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Outer spinning ring */}
        <div className="absolute inset-0 border-2 border-gray-200 rounded-full"></div>
        <div className="absolute inset-0 border-2 border-transparent border-t-purple-600 rounded-full animate-spin"></div>
        
        {/* TM Logo in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white rounded-full w-3/4 h-3/4 flex items-center justify-center shadow-sm">
            <span className="font-bold text-purple-600 text-xs">TM</span>
          </div>
        </div>
      </div>
      
      {text && (
        <p className="text-gray-600 mt-3 text-sm font-medium">{text}</p>
      )}
    </div>
  );
} 