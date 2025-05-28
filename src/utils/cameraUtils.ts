
import { CapturePoint, CameraAlignment, DeviceMotion } from '../types/camera';

export const generateCapturePoints = (totalPoints: number): CapturePoint[] => {
  const points: CapturePoint[] = [];
  
  for (let i = 0; i < totalPoints; i++) {
    points.push({
      id: i,
      x: (i / (totalPoints - 1)) * 100, // Percentage across screen
      y: 50, // Middle of screen
      captured: false
    });
  }
  
  return points;
};

export const calculateAlignment = (
  currentPoint: CapturePoint,
  deviceMotion: DeviceMotion,
  tolerance: number = 15
): CameraAlignment => {
  // Simulate camera alignment based on device motion
  // In a real implementation, this would use actual camera position data
  const horizontalOffset = deviceMotion.gamma || 0; // Left/right tilt
  const verticalOffset = deviceMotion.beta || 0;    // Forward/back tilt
  const rotation = deviceMotion.alpha || 0;         // Rotation around vertical axis

  const isHorizontallyAligned = Math.abs(horizontalOffset) < tolerance;
  const isVerticallyAligned = Math.abs(verticalOffset) < tolerance;
  const isRotationAligned = Math.abs(rotation) < tolerance;

  return {
    isAligned: isHorizontallyAligned && isVerticallyAligned && isRotationAligned,
    horizontalOffset,
    verticalOffset,
    rotation
  };
};

export const calculateOverlapPercentage = (
  currentPoint: CapturePoint,
  nextPoint: CapturePoint | undefined,
  userPosition: number // User's current position as percentage
): number => {
  if (!nextPoint) return 0;
  
  const pointDistance = Math.abs(nextPoint.x - currentPoint.x);
  const userDistance = Math.abs(userPosition - currentPoint.x);
  const overlapDistance = pointDistance * 0.3; // 30% overlap
  
  return Math.min(100, (userDistance / overlapDistance) * 100);
};

export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const exportCaptureData = (session: any) => {
  const data = {
    sessionId: session.id,
    capturedImages: session.points.filter((p: CapturePoint) => p.captured),
    metadata: {
      totalPoints: session.totalPoints,
      completionTime: session.endTime ? session.endTime.getTime() - session.startTime.getTime() : null,
      overlapPercentage: session.overlapPercentage
    }
  };
  
  return JSON.stringify(data, null, 2);
};
