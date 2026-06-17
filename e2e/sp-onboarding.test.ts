/**
 * Critical-path E2E: SP signup happy path → identity sheet → optimistic
 * "verifying" state → banner clears. Locks in the T0/T1 UX work from this
 * session (zingaLocalDocs/stripeAsyncVerificationUX.md).
 *
 * Many of the testIDs referenced here DO NOT yet exist in the Frontend code —
 * they need to be added before this test can pass. See
 * zingaLocalDocs/testingArchitecture.md "E2E testID checklist".
 */
import { device, element, by, expect as detoxExpect, waitFor } from 'detox';

describe('SP onboarding — happy path', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      launchArgs: { detoxE2E: '1' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('user can sign up, pick SP role, fill account form, reach dashboard', async () => {
    // 1. Welcome screen → tap "Sign up"
    await element(by.id('welcomeSignUp')).tap();

    // 2. Role screen → pick Service Provider
    await waitFor(element(by.id('roleCardServiceProvider')))
      .toBeVisible()
      .withTimeout(8000);
    await element(by.id('roleCardServiceProvider')).tap();
    await element(by.id('roleContinue')).tap();

    // 3. (dev build skips phone OTP per IS_DEV branch in RegisterProvider)
    //    Account form
    await waitFor(element(by.id('registerFirstName')))
      .toBeVisible()
      .withTimeout(8000);
    await element(by.id('registerFirstName')).typeText('Amani');
    await element(by.id('registerLastName')).typeText('Johnson');
    await element(by.id('registerEmail')).typeText(
      `amani_${Date.now()}@zingatest.com`,
    );
    await element(by.id('registerPassword')).typeText('StrongP@ssw0rd!');
    await element(by.id('registerTermsCheckbox')).tap();
    await element(by.id('registerCreateAccount')).tap();

    // 4. SP dashboard appears (post-onboarding stepper assumed completed
    //    via seeded dev fixture). The "Setup Identity" banner should be
    //    visible and tap-able.
    await waitFor(element(by.id('stripeIdentityBanner')))
      .toBeVisible()
      .withTimeout(15000);
    await element(by.id('stripeIdentityBannerCTA')).tap();

    // 5. T0 optimistic state appears immediately after sheet closes
    //    (in dev, the identity sheet is mocked to dismiss success quickly).
    await waitFor(element(by.text(/verifying your ID/i)))
      .toBeVisible()
      .withTimeout(5000);

    // 6. Within ~30s, the banner disappears (poll resolves verified
    //    OR webhook lands and cache flips). Generous timeout for slow CI.
    await waitFor(element(by.id('stripeIdentityBanner')))
      .not.toBeVisible()
      .withTimeout(45000);
  });
});
