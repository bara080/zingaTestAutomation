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
  // Walk into the submodule's node_modules so tests can import the same
  // mongoose / firebase-admin / express that Zinga uses in production.
  // Requires `cd zinga/Backend && npm install` (and same for Frontend) — see README.
  moduleDirectories: [
    'node_modules',
    '<rootDir>/zinga/Backend/node_modules',
    '<rootDir>/zinga/Frontend/node_modules',
  ],
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
      // `__DEV__` is a React Native runtime global referenced by Frontend
      // utils (e.g. loggers.ts) — define for unit tests in plain node env.
      globals: { __DEV__: false },
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
      // OLD: tried `preset: 'jest-expo'` + jsdom — clashed with Expo SDK 54's
      // winter/fetch class-extension polyfill and RN's window setup.
      // NEW: plain ts-jest + node env + RN mocked at module boundary.
      // Component tests stay pure: render via react-test-renderer or
      // RNTL's host-component tree without exercising RN runtime.
      preset: 'ts-jest',
      testEnvironment: 'node',
      transform: {
        '^.+\\.(ts|tsx)$': [
          'ts-jest',
          {
            tsconfig: {
              // OLD: shared tsconfig used `jsx: 'react-native'` which ts-jest
              // can't emit standalone. Override to react-jsx for component tests.
              jsx: 'react-jsx',
              esModuleInterop: true,
              allowSyntheticDefaultImports: true,
              target: 'ES2022',
              module: 'commonjs',
              strict: true,
              baseUrl: '.',
              paths: { '@/*': ['zinga/Frontend/*'] },
              types: ['jest', 'node'],
            },
          },
        ],
      },
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
      moduleNameMapper: {
        ...frontendModuleNameMapper,
        // Stub the heavy RN/Expo packages component tests don't actually need
        '^react-native$': '<rootDir>/helpers/reactNativeStub.ts',
      },
      setupFiles: ['<rootDir>/helpers/sentryNoop.ts'],
      setupFilesAfterEnv: ['<rootDir>/helpers/rntlExtendExpect.ts'],
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
      // `afterEach` needs Jest's test env loaded — setupFilesAfterEnv runs
      // AFTER the framework is ready, unlike setupFiles which runs before.
      setupFilesAfterEnv: ['<rootDir>/helpers/integrationTeardown.ts'],
    },
  ],
};
