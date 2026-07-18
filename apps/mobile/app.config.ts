import { ExpoConfig } from "expo/config";

// icarun Expo config.
// Web is built as a SPA (output: "single") because task detail routes such as
// /tasks/[id] are dynamic and created at runtime. Static export cannot know all
// task URLs at build time.
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
  plugins: ["expo-router", "expo-status-bar"],
  experiments: {
    typedRoutes: true
  }
};

export default config;