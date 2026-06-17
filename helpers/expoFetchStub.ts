/**
 * Workaround for jest-expo @ Expo SDK 54: `expo/src/winter/fetch` auto-installs
 * a global `fetch` using class extension on the global Response, which fails
 * Jest's Babel transform with "Super expression must either be null or a function".
 *
 * Stub the entire expo/winter/fetch surface BEFORE Expo's runtime tries to
 * install it. Tests that need a real fetch can mock per-test.
 */
jest.mock('expo/src/winter/fetch', () => ({
  fetch: jest.fn(),
  FetchResponse: class {},
  FetchRequest: class {},
}), { virtual: true });

jest.mock('expo/src/winter/fetch/fetch', () => ({
  fetch: jest.fn(),
}), { virtual: true });

jest.mock('expo/src/winter/fetch/FetchResponse', () => ({
  FetchResponse: class {},
}), { virtual: true });
