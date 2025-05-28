
import React from 'react';

interface CameraControlsProps {
  onStartSession: () => void;
  onStopSession: () => void;
  onResetSession: () => void;
  isSessionActive: boolean;
  totalPoints: number;
  onPointsChange: (points: number) => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  onStartSession,
  onStopSession,
  onResetSession,
  isSessionActive,
  totalPoints,
  onPointsChange
}) => {
  return (
    <div className="absolute top-4 right-4 pointer-events-auto">
      <div className="bg-black bg-opacity-50 rounded-lg p-3 backdrop-blur-sm space-y-3">
        {!isSessionActive ? (
          <>
            <div className="text-white text-sm">
              <label className="block mb-1">Points to capture:</label>
              <select
                value={totalPoints}
                onChange={(e) => onPointsChange(Number(e.target.value))}
                className="bg-white bg-opacity-20 text-white rounded px-2 py-1 text-sm"
              >
                <option value={5}>5 Points</option>
                <option value={7}>7 Points</option>
                <option value={10}>10 Points</option>
                <option value={15}>15 Points</option>
              </select>
            </div>
            <button
              onClick={onStartSession}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              Start Capture
            </button>
          </>
        ) : (
          <div className="space-y-2">
            <button
              onClick={onStopSession}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              Stop Session
            </button>
            <button
              onClick={onResetSession}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
