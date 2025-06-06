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
  const [permissionsRequested, setPermissionsRequested] = useState(false);
  
  const { motion, isSupported: motionSupported } = useDeviceMotion();
  const { triggerSuccess, triggerWarning, triggerError } = useHapticFeedback();

  const currentPoint = session?.points[session.currentPointIndex];
  const alignment = currentPoint ? calculateAlignment(currentPoint, motion) : { isAligned: false, horizontalOffset: 0, verticalOffset: 0, rotation: 0 };

  // Enhanced debug logging with motion data
  useEffect(() => {
    console.log('CameraGuidance component mounted');
    console.log('Motion supported:', motionSupported);
    console.log('Current motion:', motion);
    console.log('Alignment:', alignment);
    console.log('Guidance direction:', guidanceDirection);
    
    const motionString = `α:${motion.alpha.toFixed(1)} β:${motion.beta.toFixed(1)} γ:${motion.gamma.toFixed(1)}`;
    const alignmentString = `H:${alignment.horizontalOffset.toFixed(1)} V:${alignment.verticalOffset.toFixed(1)}`;
    setDebugInfo(`Motion: ${motionSupported ? 'OK' : 'NO'} | ${motionString} | ${alignmentString} | Dir: ${guidanceDirection}`);
  }, [motionSupported, motion, alignment, guidanceDirection]);

  // Aggressive permission request on mount
  useEffect(() => {
    const requestPermissions = async () => {
      if (permissionsRequested) return;
      
      try {
        console.log('Requesting camera permissions aggressively...');
        setPermissionsRequested(true);
        
        // First check current permissions
        const currentPermissions = await Camera.checkPermissions();
        console.log('Current permissions:', currentPermissions);
        
        if (currentPermissions.camera === 'granted' && currentPermissions.photos === 'granted') {
          setPermissionsGranted(true);
          setDebugInfo(prev => prev + ' | Permissions already granted');
          toast.success('Camera permissions ready!');
          return;
        }
        
        // Request permissions with prompt
        console.log('Requesting permissions with prompt...');
        const permissions = await Camera.requestPermissions({
          permissions: ['camera', 'photos']
        });
        console.log('Permission request result:', permissions);
        
        if (permissions.camera === 'granted' && permissions.photos === 'granted') {
          setPermissionsGranted(true);
          setDebugInfo(prev => prev + ' | Camera permissions granted');
          toast.success('Camera permissions granted! You can now start capturing.');
        } else if (permissions.camera === 'denied' || permissions.photos === 'denied') {
          setPermissionsGranted(false);
          setDebugInfo(prev => prev + ' | Camera permissions denied');
          toast.error('Camera permissions denied. Please enable them in your device settings and restart the app.');
        } else if (permissions.camera === 'prompt' || permissions.photos === 'prompt') {
          // Try requesting again if still in prompt state
          toast.info('Please allow camera permissions when prompted.');
          setTimeout(async () => {
            try {
              const retryPermissions = await Camera.requestPermissions();
              if (retryPermissions.camera === 'granted' && retryPermissions.photos === 'granted') {
                setPermissionsGranted(true);
                toast.success('Camera permissions granted!');
              }
            } catch (retryError) {
              console.log('Retry permission request failed:', retryError);
            }
          }, 1000);
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
          toast.error('Failed to request camera permissions. Please check your device settings.');
        }
      }
    };
    
    // Add a small delay to ensure the app is fully loaded
    const timer = setTimeout(() => {
      requestPermissions();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [permissionsRequested]);

  // Manual permission request function
  const requestPermissionsManually = async () => {
    try {
      setDebugInfo(prev => prev + ' | Manual permission request');
      toast.info('Requesting camera permissions...');
      
      const permissions = await Camera.requestPermissions({
        permissions: ['camera', 'photos']
      });
      
      console.log('Manual permission result:', permissions);
      
      if (permissions.camera === 'granted' && permissions.photos === 'granted') {
        setPermissionsGranted(true);
        toast.success('Camera permissions granted!');
      } else {
        toast.error('Please enable camera permissions in your device settings.');
      }
    } catch (error) {
      console.error('Manual permission request failed:', error);
      toast.error('Failed to request permissions. Please enable them manually in device settings.');
    }
  };

  const startSession = useCallback(() => {
    if (!permissionsGranted) {
      toast.error('Camera permissions required to start session');
      requestPermissionsManually();
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
      requestPermissionsManually();
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
        saveToGallery: true,
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
    console.log('Guidance direction updated:', direction);
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

  // Enhanced haptic feedback for alignment changes
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
          
          {/* Permission status with manual request button */}
          <div className={`rounded-lg p-3 mb-4 ${
            permissionsGranted ? 'bg-green-600 bg-opacity-80' : 'bg-red-600 bg-opacity-80'
          }`}>
            <div className="text-sm font-medium mb-2">
              Camera Permissions: {permissionsGranted ? '✓ Granted' : '✗ Required'}
            </div>
            {!permissionsGranted && (
              <div className="space-y-2">
                <div className="text-xs">
                  Enable camera permissions to use this app
                </div>
                <button
                  onClick={requestPermissionsManually}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                >
                  Request Permissions
                </button>
              </div>
            )}
          </div>
          
          {/* Enhanced debug information for mobile testing */}
          <div className="bg-black bg-opacity-50 rounded-lg p-3 mb-4 text-xs space-y-1">
            <div>Debug: {debugInfo}</div>
            <div>Alignment: {alignment.isAligned ? '✓ ALIGNED' : '✗ NOT ALIGNED'}</div>
            <div>Session: {session ? (session.isActive ? 'Active' : 'Completed') : 'None'}</div>
            <div>Permissions: {permissionsGranted ? 'OK' : 'Missing'}</div>
            <div>Requested: {permissionsRequested ? 'Yes' : 'No'}</div>
            {motionSupported && (
              <div className="text-yellow-300">
                Tilt device left/right to see arrow movement
              </div>
            )}
          </div>

          {/* Motion test indicator */}
          {motionSupported && (
            <div className="bg-blue-600 bg-opacity-80 rounded-lg p-3 mb-4">
              <div className="text-sm font-medium mb-2">Motion Test</div>
              <div className="flex justify-center space-x-4 text-xs">
                <div>α: {motion.alpha.toFixed(1)}°</div>
                <div>β: {motion.beta.toFixed(1)}°</div>
                <div className={`font-bold ${Math.abs(motion.gamma) > 5 ? 'text-yellow-300' : 'text-white'}`}>
                  γ: {motion.gamma.toFixed(1)}°
                </div>
              </div>
              <div className="text-xs mt-2 opacity-75">
                Gamma (γ) controls left/right guidance
              </div>
            </div>
          )}

          {/* Welcome message when no session */}
          {!session && permissionsGranted && (
            <div className="bg-blue-600 bg-opacity-80 rounded-lg p-4 mb-4">
              <h2 className="text-lg font-bold mb-2">Welcome!</h2>
              <p className="text-sm">
                Tap "Start Capture" in the top-right corner to begin taking aligned photos.
                {motionSupported && <span className="block mt-1">Tilt your device to see the guidance arrows!</span>}
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
