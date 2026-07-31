import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pos.litehandyapp',
  appName: 'Lite Handy App',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    cleartext: true
  }
};

export default config;
