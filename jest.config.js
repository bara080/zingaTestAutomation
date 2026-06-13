/**
 * Root Jest config for zingaTest.
 * Uses `projects[]` so each layer runs with its own transform + setup.
 * See zingaLocalDocs/testingArchitecture.md (in the Zinga repo) for design.
 */

const path = require('path');

// Path aliases — resolve `@/` to the submodule's Frontend so the tests can
// import production code without modifying it. Mirrors Frontend/tsconfig.json.
const frontendModuleNameMapper = {
  '^@/(.*)$': '<rootDir>/zinga/Frontend/$1',
  '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/helpers/assetStub.js',
};

const backendModuleNameMapper = {
  // Backend uses CommonJS require — no `@/` alias. Imports go via relative
  // paths inside the submodule. Kept here as a placeholder if Backend ever
  // adopts a path-alias convention.
};

module.exports = {
  // Top-level config — only governs CLI flags + global thresholds.
  // Each project below has its own transformer / setup / testMatch.
  rootDir: __dirname,
  // Integration tests boot in-memory Mongo + Redis — give a generous timeout.
  testTimeout: 15000,
  collectCoverageFrom: [
    '<rootDir>/zinga/Frontend/services/**/*.{ts,tsx}',
    '<rootDir>/zinga/Frontend/context/**/*.{ts,tsx}',
    '<rootDir>/zinga/Frontend/components/**/*.{ts,tsx}',
    '<rootDir>/zinga/Frontend/utils/**/*.{ts,tsx}',
    '<rootDir>/zinga/Backend/api/**/*.js',
    '!**/node_modules/**',
    '!**/__tests__/**',
  ],
  // Start at 0% gate; ratchet up +5%/sprint per testingArchitecture.md.
  coverageThreshold: {
    global: { branches: 0, functions: 0, lines: 0, statements: 0 },
  },
  projects: [
    {
      displayName: 'unit-frontend',
      testMatch: ['<rootDir>/unit/frontend/**/*.test.{ts,tsx}'],
      preset: 'ts-jest',
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: path.join(__dirname, 'tsconfig.json') }],
      },
      moduleNameMapper: frontendModuleNameMapper,
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
      testEnvironment: 'node',
      setupFiles: ['<rootDir>/helpers/sentryNoop.ts'],
    },
    {
      displayName: 'unit-backend',
      testMatch: ['<rootDir>/unit/backend/**/*.test.{ts,js}'],
      preset: 'ts-jest',
      transform: {
        '^.+\\.(ts)$': ['ts-jest', { tsconfig: path.join(__dirname, 'tsconfig.json') }],
      },
      moduleNameMapper: backendModuleNameMapper,
      moduleFileExtensions: ['ts', 'js', 'json'],
      testEnvironment: 'node',
    },
    {
      displayName: 'component',
      testMatch: ['<rootDir>/component/**/*.test.{ts,tsx}'],
      preset: 'jest-expo',
      moduleNameMapper: frontendModuleNameMapper,
      // RNTL v12.4+ ships matchers built-in via extend-expect entry.
      setupFiles: [
        '@testing-library/react-native/extend-expect',
        '<rootDir>/helpers/sentryNoop.ts',
      ],
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)/)',
      ],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/integration/**/*.test.{ts,js}'],
      preset: 'ts-jest',
      transform: {
        '^.+\\.(ts)$': ['ts-jest', { tsconfig: path.join(__dirname, 'tsconfig.json') }],
      },
      moduleFileExtensions: ['ts', 'js', 'json'],
      testEnvironment: 'node',
      setupFiles: ['<rootDir>/helpers/integrationTeardown.ts'],
    },
  ],
};
