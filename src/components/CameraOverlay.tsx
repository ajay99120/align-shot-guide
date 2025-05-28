
import React from 'react';
import { CapturePoint, CameraAlignment } from '../types/camera';

interface CameraOverlayProps {
  points: CapturePoint[];
  currentPointIndex: number;
  alignment: CameraAlignment;
  onGuidanceUpdate: (direction: 'left' | 'right' | 'center') => void;
}

export const CameraOverlay: React.FC<CameraOverlayProps> = ({
  points,
  currentPointIndex,
  alignment,
  onGuidanceUpdate
}) => {
  const currentPoint = points[currentPointIndex];
  const nextPoint = points[currentPointIndex + 1];

  React.useEffect(() => {
    if (alignment.horizontalOffset < -10) {
      onGuidanceUpdate('right');
    } else if (alignment.horizontalOffset > 10) {
      onGuidanceUpdate('left');
    } else {
      onGuidanceUpdate('center');
    }
  }, [alignment.horizontalOffset, onGuidanceUpdate]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Horizontal Guide Line */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 border-t-2 border-dashed guide-line" />
      
      {/* Guide Points */}
      <div className="absolute top-1/2 left-0 right-0 flex justify-between px-8">
        {points.map((point, index) => (
          <div
            key={point.id}
            className={`w-4 h-4 rounded-full guide-dot ${
              index === currentPointIndex ? 'active' : ''
            } ${point.captured ? 'opacity-50' : ''}`}
            style={{
              transform: 'translateY(-50%)',
            }}
          />
        ))}
      </div>

      {/* Overlap Indicator */}
      {nextPoint && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="bg-white bg-opacity-20 rounded-lg p-2 backdrop-blur-sm">
            <div className="text-white text-xs text-center">
              30% Overlap Zone
            </div>
            <div className="w-24 h-2 bg-white bg-opacity-30 rounded-full mt-1">
              <div 
                className="h-full bg-green-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.abs(alignment.horizontalOffset) / 3)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Alignment Indicator */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
        <div className={`w-16 h-16 rounded-full alignment-indicator ${
          alignment.isAligned ? 'aligned' : 'misaligned'
        } flex items-center justify-center`}>
          <div className="text-white text-xs font-bold">
            {alignment.isAligned ? '✓' : '✗'}
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="absolute top-4 left-4 right-4">
        <div className="bg-black bg-opacity-50 rounded-full p-2 backdrop-blur-sm">
          <div className="flex justify-between items-center text-white text-sm">
            <span>Point {currentPointIndex + 1} of {points.length}</span>
            <span>{Math.round((currentPointIndex / points.length) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-white bg-opacity-30 rounded-full mt-2">
            <div 
              className="h-full bg-blue-400 rounded-full transition-all duration-300"
              style={{ width: `${(currentPointIndex / points.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
