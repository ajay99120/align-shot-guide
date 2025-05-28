
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
    } transform -translate-y-1/2 guidance-arrow`}>
      <svg 
        width="48" 
        height="48" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={`text-white ${direction === 'left' ? 'rotate-180' : ''}`}
      >
        <path 
          d="M8.5 5L15.5 12L8.5 19" 
          stroke="currentColor" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white text-xs font-medium">
        Move {direction}
      </div>
    </div>
  );
};
