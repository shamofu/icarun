// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Better Auth uses package exports; keep this explicit for native/web Metro.
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
