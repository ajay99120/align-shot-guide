
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
    // More sensitive guidance based on horizontal offset
    if (alignment.horizontalOffset < -5) {
      onGuidanceUpdate('left');
    } else if (alignment.horizontalOffset > 5) {
      onGuidanceUpdate('right');
    } else {
      onGuidanceUpdate('center');
    }
  }, [alignment.horizontalOffset, onGuidanceUpdate]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Horizontal Guide Line */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 border-t-2 border-dashed border-white opacity-60" />
      
      {/* Vertical Center Line */}
      <div className="absolute top-0 bottom-0 left-1/2 w-0.5 border-l-2 border-dashed border-white opacity-40" />
      
      {/* Guide Points */}
      <div className="absolute top-1/2 left-0 right-0 flex justify-between px-8">
        {points.map((point, index) => (
          <div
            key={point.id}
            className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
              index === currentPointIndex ? 'bg-blue-500 scale-125' : 
              point.captured ? 'bg-green-500' : 'bg-transparent'
            } transition-all duration-300`}
            style={{
              transform: 'translateY(-50%)',
            }}
          >
            {point.captured && (
              <div className="text-white text-xs font-bold">✓</div>
            )}
            {index === currentPointIndex && !point.captured && (
              <div className="text-white text-xs font-bold">{index + 1}</div>
            )}
          </div>
        ))}
      </div>

      {/* Device Motion Indicator */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2">
        <div className="bg-black bg-opacity-70 rounded-lg p-3 backdrop-blur-sm">
          <div className="text-white text-xs text-center space-y-1">
            <div>Tilt: {alignment.horizontalOffset.toFixed(1)}°</div>
            <div className="w-32 h-2 bg-white bg-opacity-30 rounded-full">
              <div 
                className={`h-full rounded-full transition-all duration-200 ${
                  Math.abs(alignment.horizontalOffset) < 5 ? 'bg-green-400' : 'bg-red-400'
                }`}
                style={{ 
                  width: `${Math.min(100, Math.abs(alignment.horizontalOffset) * 3)}%`,
                  marginLeft: alignment.horizontalOffset > 0 ? '50%' : 'auto',
                  marginRight: alignment.horizontalOffset < 0 ? '50%' : 'auto'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Alignment Indicator */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
          alignment.isAligned ? 'bg-green-500 border-green-300 scale-110' : 'bg-red-500 border-red-300'
        }`}>
          <div className="text-white text-lg font-bold">
            {alignment.isAligned ? '✓' : '✗'}
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="absolute top-4 left-4 right-4">
        <div className="bg-black bg-opacity-50 rounded-full p-2 backdrop-blur-sm">
          <div className="flex justify-between items-center text-white text-sm">
            <span>Point {currentPointIndex + 1} of {points.length}</span>
            <span>{Math.round(((points.filter(p => p.captured).length) / points.length) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-white bg-opacity-30 rounded-full mt-2">
            <div 
              className="h-full bg-blue-400 rounded-full transition-all duration-300"
              style={{ width: `${(points.filter(p => p.captured).length / points.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Direction Indicator */}
      <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2">
        <div className="bg-black bg-opacity-70 rounded-lg p-2 backdrop-blur-sm">
          <div className="text-white text-sm text-center font-medium">
            {Math.abs(alignment.horizontalOffset) < 5 ? 'ALIGNED' : 
             alignment.horizontalOffset > 0 ? 'TILT LEFT' : 'TILT RIGHT'}
          </div>
        </div>
      </div>
    </div>
  );
};
