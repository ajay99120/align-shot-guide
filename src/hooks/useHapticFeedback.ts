
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const useHapticFeedback = () => {
  const triggerSuccess = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.log('Haptics not supported:', error);
    }
  };

  const triggerWarning = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      console.log('Haptics not supported:', error);
    }
  };

  const triggerError = async () => {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      console.log('Haptics not supported:', error);
    }
  };

  return { triggerSuccess, triggerWarning, triggerError };
};
