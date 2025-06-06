
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
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(true);
  
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

  // Function to trigger actual camera access (which requests permissions)
  const requestCameraPermissions = async () => {
    try {
      console.log('Attempting to trigger camera access to request permissions...');
      setPermissionsRequested(true);
      setDebugInfo(prev => prev + ' | Requesting via camera access');
      
      // Try to access the camera - this will trigger Android permission dialog
      const image = await Camera.getPhoto({
        quality: 50,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        saveToGallery: false,
      });
      
      // If we got here, permissions were granted
      console.log('Camera access successful - permissions granted!');
      setPermissionsGranted(true);
      setShowPermissionPrompt(false);
      setDebugInfo(prev => prev + ' | Camera permissions granted via access');
      toast.success('Camera permissions granted! You can now start capturing.');
      
    } catch (error) {
      console.error('Camera access failed:', error);
      setPermissionsGranted(false);
      setDebugInfo(prev => prev + ' | Camera access failed');
      
      if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as any).message;
        if (message.includes('User cancelled') || message.includes('denied')) {
          toast.error('Camera permission denied. Please enable it in your device settings.');
        } else if (message.includes('Not implemented on web')) {
          toast.info('Running in web mode - camera features limited');
          setPermissionsGranted(true);
          setShowPermissionPrompt(false);
        } else {
          toast.error(`Camera error: ${message}`);
        }
      } else {
        toast.error('Failed to access camera. Please check permissions in device settings.');
      }
    }
  };

  const startSession = useCallback(() => {
    if (!permissionsGranted) {
      toast.error('Camera permissions required to start session');
      requestCameraPermissions();
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
      requestCameraPermissions();
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
          
          {/* Permission Request Card - More prominent */}
          {showPermissionPrompt && !permissionsGranted && (
            <div className="bg-red-600 bg-opacity-90 rounded-lg p-6 mb-4 border-2 border-red-400">
              <div className="text-lg font-bold mb-3">⚠️ Camera Access Required</div>
              <div className="text-sm mb-4">
                This app needs camera permissions to function. 
                Tap the button below to request access.
              </div>
              <button
                onClick={requestCameraPermissions}
                className="bg-white text-red-600 hover:bg-gray-100 px-6 py-3 rounded-lg text-sm font-bold transition-colors w-full"
                disabled={permissionsRequested}
              >
                {permissionsRequested ? 'Requesting...' : 'Enable Camera Access'}
              </button>
              <div className="text-xs mt-3 opacity-75">
                You'll see an Android permission dialog after tapping
              </div>
            </div>
          )}

          {/* Permission status */}
          {permissionsGranted && (
            <div className="bg-green-600 bg-opacity-80 rounded-lg p-3 mb-4">
              <div className="text-sm font-medium">
                ✅ Camera Permissions: Granted
              </div>
            </div>
          )}
          
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
