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
  const [debugInfo, setDebugInfo] = useState<string>('App loaded');
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  
  const { motion, isSupported: motionSupported } = useDeviceMotion();
  const { triggerSuccess, triggerWarning, triggerError } = useHapticFeedback();

  const currentPoint = session?.points[session.currentPointIndex];
  const alignment = currentPoint ? calculateAlignment(currentPoint, motion) : { isAligned: false, horizontalOffset: 0, verticalOffset: 0, rotation: 0 };

  // Add debug logging
  useEffect(() => {
    console.log('CameraGuidance component mounted');
    console.log('Motion supported:', motionSupported);
    console.log('Current motion:', motion);
    setDebugInfo(`Motion: ${motionSupported ? 'Supported' : 'Not supported'}, Alpha: ${motion.alpha.toFixed(1)}`);
  }, [motionSupported, motion]);

  // Request camera permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        console.log('Requesting camera permissions...');
        const permissions = await Camera.requestPermissions();
        console.log('Camera permissions result:', permissions);
        
        if (permissions.camera === 'granted' && permissions.photos === 'granted') {
          setPermissionsGranted(true);
          setDebugInfo(prev => prev + ' | Camera permissions granted');
          toast.success('Camera permissions granted!');
        } else {
          setPermissionsGranted(false);
          setDebugInfo(prev => prev + ' | Camera permissions denied');
          toast.error('Camera permissions are required for this app to work. Please enable them in your device settings.');
        }
      } catch (error) {
        console.error('Permission error:', error);
        setPermissionsGranted(false);
        setDebugInfo(prev => prev + ' | Camera permissions failed');
        
        // Check if this is a web environment
        if (error && typeof error === 'object' && 'message' in error && 
            (error as any).message?.includes('Not implemented on web')) {
          toast.info('Running in web mode - camera features limited');
          setPermissionsGranted(true); // Allow testing in web
        } else {
          toast.error('Failed to request camera permissions. Please enable them manually in device settings.');
        }
      }
    };
    
    requestPermissions();
  }, []);

  const startSession = useCallback(() => {
    if (!permissionsGranted) {
      toast.error('Camera permissions required to start session');
      return;
    }
    
    console.log('Starting session with', totalPoints, 'points');
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
    setDebugInfo(`Session started with ${totalPoints} points`);
    toast.success('Capture session started! Align with the first point.');
  }, [totalPoints, permissionsGranted]);

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

    if (!permissionsGranted) {
      toast.error('Camera permissions required to capture images');
      return;
    }

    setIsCapturing(true);
    
    try {
      console.log('Attempting to capture image...');
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        saveToGallery: true, // This will save to gallery automatically
      });

      console.log('Image captured successfully');
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
        toast.success(`Image ${session.currentPointIndex + 1} captured and saved to gallery! Move to next point.`);
      }
    } catch (error) {
      triggerError();
      console.error('Camera capture error:', error);
      if (error && typeof error === 'object' && 'message' in error) {
        toast.error(`Failed to capture image: ${(error as any).message}`);
      } else {
        toast.error('Failed to capture image. Please try again.');
      }
    } finally {
      setIsCapturing(false);
    }
  }, [session, currentPoint, alignment.isAligned, isCapturing, permissionsGranted, triggerSuccess, triggerWarning, triggerError]);

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

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Camera Preview - Enhanced for mobile */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black flex flex-col items-center justify-center">
        <div className="text-white text-center p-4">
          <div className="text-6xl mb-4">📷</div>
          <div className="text-xl font-medium mb-2">Camera Guidance App</div>
          <div className="text-sm opacity-75 mb-4">
            {motionSupported ? 'Motion detection active' : 'Motion detection unavailable'}
          </div>
          
          {/* Permission status */}
          <div className={`rounded-lg p-3 mb-4 ${
            permissionsGranted ? 'bg-green-600 bg-opacity-80' : 'bg-red-600 bg-opacity-80'
          }`}>
            <div className="text-sm font-medium">
              Camera Permissions: {permissionsGranted ? '✓ Granted' : '✗ Required'}
            </div>
            {!permissionsGranted && (
              <div className="text-xs mt-1">
                Enable camera permissions in your device settings to use this app
              </div>
            )}
          </div>
          
          {/* Debug information for mobile testing */}
          <div className="bg-black bg-opacity-50 rounded-lg p-3 mb-4 text-xs">
            <div>Debug: {debugInfo}</div>
            <div>Motion: α:{motion.alpha.toFixed(1)} β:{motion.beta.toFixed(1)} γ:{motion.gamma.toFixed(1)}</div>
            <div>Session: {session ? (session.isActive ? 'Active' : 'Completed') : 'None'}</div>
            <div>Permissions: {permissionsGranted ? 'OK' : 'Missing'}</div>
          </div>

          {/* Welcome message when no session */}
          {!session && permissionsGranted && (
            <div className="bg-blue-600 bg-opacity-80 rounded-lg p-4 mb-4">
              <h2 className="text-lg font-bold mb-2">Welcome!</h2>
              <p className="text-sm">
                Tap "Start Capture" in the top-right corner to begin taking aligned photos.
              </p>
            </div>
          )}
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
          isReady={alignment.isAligned && permissionsGranted}
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

      {/* Camera Controls - Always visible now */}
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
