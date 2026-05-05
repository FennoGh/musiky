import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "dev.musiky.app",
  appName: "Musiky",
  webDir: "public",
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
