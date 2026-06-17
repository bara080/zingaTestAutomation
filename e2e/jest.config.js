/**
 * Detox runs its own Jest instance with this config.
 * The root jest.config.js explicitly EXCLUDES e2e/ via project testMatch,
 * so unit/component/integration suites don't try to run these specs.
 */
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.test.ts'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
  preset: 'ts-jest',
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }] },
};
