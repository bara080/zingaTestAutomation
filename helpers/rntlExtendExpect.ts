/**
 * Pulls in @testing-library/react-native v12.4+ matchers (toBeVisible,
 * toHaveTextContent, etc). Imported via Jest's `setupFiles` so it runs
 * before any test executes.
 */
import '@testing-library/react-native/extend-expect';
