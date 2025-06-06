
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
  // Use gamma for left/right movement (device tilt)
  // Gamma ranges from -90 to +90 degrees
  // Negative gamma = device tilted left, positive gamma = device tilted right
  const horizontalOffset = (deviceMotion.gamma || 0) * 2; // Amplify for better sensitivity
  
  // Use beta for forward/back tilt  
  const verticalOffset = deviceMotion.beta || 0;
  
  // Use alpha for rotation (compass heading)
  const rotation = deviceMotion.alpha || 0;

  // Check alignment with tighter tolerance for better precision
  const isHorizontallyAligned = Math.abs(horizontalOffset) < tolerance;
  const isVerticallyAligned = Math.abs(verticalOffset - 45) < 30; // Allow some forward tilt
  const isRotationAligned = true; // Don't require rotation alignment for now

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
