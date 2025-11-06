/**
 * ESLint configuration for Envantra
 */
module.exports = {
  root: true,
  env: {
    es2021: true,
    node: true,
    jest: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: "latest",
    sourceType: "module",
    project: undefined,
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  plugins: ["@typescript-eslint", "react", "react-hooks", "react-native", "prettier"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    // Use a lighter React Native ruleset; we'll opt out of some heavy rules for now
    "plugin:react-native/all",
    "plugin:prettier/recommended",
  ],
  rules: {
    // General
    "no-console": [
      "warn",
      {
        allow: ["warn", "error"],
      },
    ],
    // TypeScript
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/ban-ts-comment": "warn",
    "@typescript-eslint/no-explicit-any": "off",
    // React
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "react/display-name": "off",
    "react/no-unescaped-entities": "off",
    // React Native
    "react-native/no-raw-text": "off",
    "react-native/no-inline-styles": "off",
    "react-native/no-color-literals": "off",
    "react-native/no-single-element-style-arrays": "off",
    // Interop
    "@typescript-eslint/no-require-imports": "off",
    // Allow empty catch blocks (we intentionally swallow in a few places)
    "no-empty": "off",
    // Prettier
    "prettier/prettier": [
      "warn",
      {
        endOfLine: "auto",
      },
    ],
  },
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      rules: {},
    },
  ],
  ignorePatterns: [
    "node_modules/",
    "dist/",
    "build/",
    "android/",
    "ios/",
    "**/*.config.js",
    "**/*.config.cjs",
  ],
};
