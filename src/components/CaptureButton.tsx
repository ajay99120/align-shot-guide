
import React from 'react';

interface CaptureButtonProps {
  isReady: boolean;
  isCapturing: boolean;
  onCapture: () => void;
}

export const CaptureButton: React.FC<CaptureButtonProps> = ({
  isReady,
  isCapturing,
  onCapture
}) => {
  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
      <button
        onClick={onCapture}
        disabled={!isReady || isCapturing}
        className={`w-20 h-20 rounded-full border-4 border-white capture-button ${
          isReady && !isCapturing ? 'ready' : 'disabled'
        } transition-all duration-300 pointer-events-auto`}
      >
        {isCapturing ? (
          <div className="w-8 h-8 bg-white rounded animate-pulse mx-auto" />
        ) : (
          <div className={`w-16 h-16 rounded-full mx-auto ${
            isReady ? 'bg-white' : 'bg-gray-400'
          }`} />
        )}
      </button>
      <div className="text-white text-xs text-center mt-2 font-medium">
        {isCapturing ? 'Capturing...' : isReady ? 'Tap to Capture' : 'Align Camera'}
      </div>
    </div>
  );
};
