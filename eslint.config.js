const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const prettierRecommended = require("eslint-plugin-prettier/recommended");

module.exports = defineConfig([
  expoConfig,
  prettierRecommended,
  {
    ignores: ["node_modules/**", ".expo/**", "dist/**", "build/**", "ios/Pods/**"],
  },
  {
    files: ["**/__tests__/**/*.{js,jsx,ts,tsx}", "**/*.{test,spec}.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        jest: "readonly",
      },
    },
  },
  {
    rules: {
      quotes: ["error", "double", { avoidEscape: true }],
      semi: ["error", "always"],
      "prettier/prettier": [
        "error",
        {
          singleQuote: false,
          semi: true,
        },
      ],
    },
  },
]);
