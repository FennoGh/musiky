import type { CapacitorConfig } from "@capacitor/cli";

// The Android shell is a thin WebView that loads the running Next.js server
// over the network — there is no static export bundled into the APK.
// `webDir` points to the frontend public folder only as a Capacitor formality.
const config: CapacitorConfig = {
  appId: "dev.musiky.app",
  appName: "Musiky",
  webDir: "frontend/public",
  server: {
    url: "http://174.138.1.11:3000",
    cleartext: true,
    androidScheme: "http",
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
  },
};

export default config;
