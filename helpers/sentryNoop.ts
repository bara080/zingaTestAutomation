/**
 * Mocks Sentry in all test environments so breadcrumbs / captures don't fire
 * during test runs. Keeps Sentry's UI clean and tests fast (no network).
 */
jest.mock('@/lib/sentry', () => ({
  __esModule: true,
  default: {
    addBreadcrumb: jest.fn(),
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    setTag: jest.fn(),
    setContext: jest.fn(),
    setUser: jest.fn(),
    withScope: (cb: (scope: unknown) => void) =>
      cb({
        setTag: jest.fn(),
        setContext: jest.fn(),
        setFingerprint: jest.fn(),
      }),
    startSpan: jest.fn(),
    wrap: <T>(c: T) => c,
  },
  sentryFlags: { diagnosticsEnabled: false },
}));

// Backend uses @sentry/node directly.
jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setTag: jest.fn(),
  setContext: jest.fn(),
  withScope: (cb: (scope: unknown) => void) =>
    cb({
      setTag: jest.fn(),
      setContext: jest.fn(),
      setFingerprint: jest.fn(),
    }),
}));
