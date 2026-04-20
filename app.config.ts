import "dotenv/config";
import type { ExpoConfig } from "expo/config";

// Primary owner used for EAS/Expo operations.
const DEFAULT_OWNER = "maltinestembrino";

// Keep your old Expo username here for quick manual switching when needed.
const PREVIOUS_OWNER = "REPLACE_WITH_PREVIOUS_OWNER";

// Optional override per command: EXPO_OWNER=yourUser npx expo start
const owner = process.env.EXPO_OWNER?.trim() || DEFAULT_OWNER;

const config: ExpoConfig = {
  name: "Gym Log",
  owner,
  slug: "lyte-log",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/logo-logym-appicon.png",
  scheme: "gymlog",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/images/logo-brand-name.png",
    resizeMode: "contain",
    backgroundColor: "#2C353F",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.anonymous.lyte-log",
  },
  android: {
    package: "com.anonymous.lytelog",
    adaptiveIcon: {
      foregroundImage: "./assets/images/logo-logym-appicon.png",
      backgroundColor: "#0e0e0e",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: ["expo-router", "expo-sqlite", "expo-localization"],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
    // Cleasn this to use other usernames or to switch between them quickly.
    eas: {
      projectId: "f30b2d48-7338-413a-a54d-28c8351b0009",
    },
    ownerOptions: {
      active: owner,
      defaultOwner: DEFAULT_OWNER,
      previousOwner: PREVIOUS_OWNER,
    },
  },
};

export default config;
