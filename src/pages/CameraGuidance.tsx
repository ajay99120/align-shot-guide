
import React, { useState, useEffect, useCallback } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { CameraOverlay } from '../components/CameraOverlay';
import { GuidanceArrow } from '../components/GuidanceArrow';
import { CaptureButton } from '../components/CaptureButton';
import { CapturedImagePreview } from '../components/CapturedImagePreview';
import { CameraControls } from '../components/CameraControls';
import { useDeviceMotion } from '../hooks/useDeviceMotion';
import { useHapticFeedback } from '../hooks/useHapticFeedback';
import { 
  generateCapturePoints, 
  calculateAlignment, 
  generateSessionId,
  exportCaptureData 
} from '../utils/cameraUtils';
import { CapturePoint, CaptureSession } from '../types/camera';
import { toast } from 'sonner';

export const CameraGuidance: React.FC = () => {
  const [session, setSession] = useState<CaptureSession | null>(null);
  const [guidanceDirection, setGuidanceDirection] = useState<'left' | 'right' | 'center'>('center');
  const [isCapturing, setIsCapturing] = useState(false);
  const [totalPoints, setTotalPoints] = useState(7);
  
  const { motion, isSupported: motionSupported } = useDeviceMotion();
  const { triggerSuccess, triggerWarning, triggerError } = useHapticFeedback();

  const currentPoint = session?.points[session.currentPointIndex];
  const alignment = currentPoint ? calculateAlignment(currentPoint, motion) : { isAligned: false, horizontalOffset: 0, verticalOffset: 0, rotation: 0 };

  const startSession = useCallback(() => {
    const points = generateCapturePoints(totalPoints);
    const newSession: CaptureSession = {
      id: generateSessionId(),
      points,
      totalPoints,
      currentPointIndex: 0,
      overlapPercentage: 30,
      isActive: true,
      startTime: new Date()
    };
    
    setSession(newSession);
    toast.success('Capture session started! Align with the first point.');
  }, [totalPoints]);

  const stopSession = useCallback(() => {
    if (session) {
      const updatedSession = {
        ...session,
        isActive: false,
        endTime: new Date()
      };
      setSession(updatedSession);
      
      const capturedCount = session.points.filter(p => p.captured).length;
      toast.success(`Session completed! Captured ${capturedCount}/${session.totalPoints} images.`);
    }
  }, [session]);

  const resetSession = useCallback(() => {
    setSession(null);
    setGuidanceDirection('center');
    setIsCapturing(false);
    toast.info('Session reset. Ready to start new capture.');
  }, []);

  const handleCapture = useCallback(async () => {
    if (!session || !currentPoint || !alignment.isAligned || isCapturing) {
      triggerWarning();
      return;
    }

    setIsCapturing(true);
    
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });

      const updatedPoints = [...session.points];
      updatedPoints[session.currentPointIndex] = {
        ...currentPoint,
        captured: true,
        imageData: image.dataUrl
      };

      const newCurrentIndex = session.currentPointIndex + 1;
      const isComplete = newCurrentIndex >= session.totalPoints;

      setSession({
        ...session,
        points: updatedPoints,
        currentPointIndex: isComplete ? session.currentPointIndex : newCurrentIndex,
        isActive: !isComplete,
        endTime: isComplete ? new Date() : undefined
      });

      triggerSuccess();
      
      if (isComplete) {
        toast.success('All images captured! Session complete.');
      } else {
        toast.success(`Image ${session.currentPointIndex + 1} captured! Move to next point.`);
      }
    } catch (error) {
      triggerError();
      toast.error('Failed to capture image. Please try again.');
      console.error('Camera error:', error);
    } finally {
      setIsCapturing(false);
    }
  }, [session, currentPoint, alignment.isAligned, isCapturing, triggerSuccess, triggerWarning, triggerError]);

  const handleGuidanceUpdate = useCallback((direction: 'left' | 'right' | 'center') => {
    setGuidanceDirection(direction);
  }, []);

  const handleImageClick = useCallback((imageIndex: number) => {
    toast.info(`Viewing captured image ${imageIndex + 1}`);
  }, []);

  const handleExportData = useCallback(() => {
    if (session) {
      const exportData = exportCaptureData(session);
      console.log('Export data:', exportData);
      toast.success('Capture data exported to console');
    }
  }, [session]);

  // Provide haptic feedback for alignment changes
  useEffect(() => {
    if (session?.isActive && currentPoint) {
      if (alignment.isAligned) {
        triggerSuccess();
      }
    }
  }, [alignment.isAligned, session?.isActive, currentPoint, triggerSuccess]);

  // Request camera permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        await Camera.requestPermissions();
      } catch (error) {
        toast.error('Camera permissions required for this app to work');
        console.error('Permission error:', error);
      }
    };
    
    requestPermissions();
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Camera Preview Placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-6xl mb-4">📷</div>
          <div className="text-xl font-medium">Camera Preview</div>
          <div className="text-sm opacity-75 mt-2">
            {motionSupported ? 'Motion detection active' : 'Motion detection unavailable'}
          </div>
        </div>
      </div>

      {/* Camera Overlay */}
      {session?.isActive && session.points && (
        <CameraOverlay
          points={session.points}
          currentPointIndex={session.currentPointIndex}
          alignment={alignment}
          onGuidanceUpdate={handleGuidanceUpdate}
        />
      )}

      {/* Guidance Arrow */}
      <GuidanceArrow
        direction={guidanceDirection}
        isVisible={session?.isActive || false}
      />

      {/* Capture Button */}
      {session?.isActive && (
        <CaptureButton
          isReady={alignment.isAligned}
          isCapturing={isCapturing}
          onCapture={handleCapture}
        />
      )}

      {/* Captured Images Preview */}
      {session && (
        <CapturedImagePreview
          images={session.points}
          onImageClick={handleImageClick}
        />
      )}

      {/* Camera Controls */}
      <CameraControls
        onStartSession={startSession}
        onStopSession={stopSession}
        onResetSession={resetSession}
        isSessionActive={session?.isActive || false}
        totalPoints={totalPoints}
        onPointsChange={setTotalPoints}
      />

      {/* Export Button */}
      {session && !session.isActive && session.points.some(p => p.captured) && (
        <div className="absolute bottom-4 left-4 pointer-events-auto">
          <button
            onClick={handleExportData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
          >
            Export Data
          </button>
        </div>
      )}
    </div>
  );
};
