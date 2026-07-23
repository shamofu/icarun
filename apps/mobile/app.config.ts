import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "icarun",
  slug: "icarun",
  scheme: "icarun",
  version: "0.0.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  web: {
    bundler: "metro",
    output: "single"
  },
  plugins: [
    "expo-router",
    "expo-status-bar",
    "expo-secure-store",
    "expo-web-browser"
  ],
  experiments: {
    typedRoutes: true
  }
};

export default config;
