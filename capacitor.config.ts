
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e92230415c3d4c199934927160f12a7e',
  appName: 'Camera Guidance App',
  webDir: 'dist',
  server: {
    url: 'https://e9223041-5c3d-4c19-9934-927160f12a7e.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    Motion: {
      permissions: ['motion']
    }
  }
};

export default config;
