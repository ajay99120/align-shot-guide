
import { useState, useEffect } from 'react';
import { Motion } from '@capacitor/motion';
import { DeviceMotion as DeviceMotionType } from '../types/camera';

export const useDeviceMotion = () => {
  const [motion, setMotion] = useState<DeviceMotionType>({
    alpha: 0,
    beta: 0,
    gamma: 0
  });
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    let isWatching = false;

    const startWatching = async () => {
      try {
        setIsSupported(true);
        isWatching = true;
        
        await Motion.addListener('orientation', (event) => {
          if (isWatching) {
            setMotion({
              alpha: event.alpha || 0,
              beta: event.beta || 0,
              gamma: event.gamma || 0
            });
          }
        });
      } catch (error) {
        console.log('Device motion not supported:', error);
        setIsSupported(false);
      }
    };

    startWatching();

    return () => {
      isWatching = false;
      Motion.removeAllListeners();
    };
  }, []);

  return { motion, isSupported };
};
