
import React from 'react';

interface GuidanceArrowProps {
  direction: 'left' | 'right' | 'center';
  isVisible: boolean;
}

export const GuidanceArrow: React.FC<GuidanceArrowProps> = ({ direction, isVisible }) => {
  if (!isVisible || direction === 'center') return null;

  return (
    <div className={`absolute top-1/2 ${
      direction === 'left' ? 'left-8' : 'right-8'
    } transform -translate-y-1/2 pointer-events-none z-20`}>
      <div className="flex flex-col items-center space-y-2">
        <svg 
          width="64" 
          height="64" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className={`text-yellow-400 drop-shadow-lg animate-pulse ${
            direction === 'left' ? 'rotate-180' : ''
          }`}
        >
          <path 
            d="M8.5 5L15.5 12L8.5 19" 
            stroke="currentColor" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.3"
          />
        </svg>
        <div className="bg-black bg-opacity-80 rounded-lg px-3 py-1">
          <div className="text-yellow-400 text-sm font-bold">
            TILT {direction.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
};
