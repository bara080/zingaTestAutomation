/**
 * Smoke test: app launches and reaches a known initial state.
 * Lowest possible bar — proves the Detox build + simulator + JS bundle work.
 */
import { device, element, by, expect as detoxExpect } from 'detox';

describe('App launch', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('renders the welcome / auth landing screen', async () => {
    // Zinga's first authed-out screen has a "Sign in" CTA. If the build,
    // bundle, or env vars (Firebase keys) are broken, this fails fast.
    // Replace `welcomeSignIn` with the actual testID once added to
    // Frontend/app/(auth)/welcome.tsx — see zingaLocalDocs/testingArchitecture.md
    // "testID convention" section.
    await detoxExpect(element(by.id('welcomeSignIn'))).toBeVisible();
  });
});
