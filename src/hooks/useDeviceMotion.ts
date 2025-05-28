
import { useState, useEffect } from 'react';
import { DeviceMotion } from '@capacitor/device-motion';
import { DeviceMotion as DeviceMotionType } from '../types/camera';

export const useDeviceMotion = () => {
  const [motion, setMotion] = useState<DeviceMotionType>({
    alpha: 0,
    beta: 0,
    gamma: 0
  });
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    let watchId: string | undefined;

    const startWatching = async () => {
      try {
        // Request permissions
        const permissions = await DeviceMotion.requestPermissions();
        if (permissions.granted) {
          setIsSupported(true);
          
          watchId = await DeviceMotion.addListener('devicemotion', (event) => {
            setMotion({
              alpha: event.rotationRate?.alpha || 0,
              beta: event.rotationRate?.beta || 0,
              gamma: event.rotationRate?.gamma || 0
            });
          });
        }
      } catch (error) {
        console.log('Device motion not supported:', error);
        setIsSupported(false);
      }
    };

    startWatching();

    return () => {
      if (watchId) {
        DeviceMotion.removeAllListeners();
      }
    };
  }, []);

  return { motion, isSupported };
};
