
export interface CapturePoint {
  id: number;
  x: number;
  y: number;
  captured: boolean;
  imageData?: string;
}

export interface CameraAlignment {
  isAligned: boolean;
  horizontalOffset: number;
  verticalOffset: number;
  rotation: number;
}

export interface DeviceMotion {
  alpha: number;
  beta: number;
  gamma: number;
}

export interface CaptureSession {
  id: string;
  points: CapturePoint[];
  totalPoints: number;
  currentPointIndex: number;
  overlapPercentage: number;
  isActive: boolean;
  startTime: Date;
  endTime?: Date;
}
