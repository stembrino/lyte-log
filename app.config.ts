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
  slug: "gymlog",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/app-icon.png",
  scheme: "gymlog",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/images/app-splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#1E1E1E",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.fabio.gymlog",
  },
  android: {
    package: "com.fabio.gymlog",
    // Keep keyboard behavior consistent between dev and production builds.
    softwareKeyboardLayoutMode: "resize",
    adaptiveIcon: {
      foregroundImage: "./assets/images/app-icon.png",
      backgroundColor: "#1E1E1E",
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
      projectId: "bfb710a2-3851-416d-ae53-ef00adcd5529",
    },
    ownerOptions: {
      active: owner,
      defaultOwner: DEFAULT_OWNER,
      previousOwner: PREVIOUS_OWNER,
    },
  },
};

export default config;
