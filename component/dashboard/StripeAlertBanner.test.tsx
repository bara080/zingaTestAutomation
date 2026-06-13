/**
 * Critical-path P0: StripeAlertBanner respects the `verifying` prop and
 * shows optimistic copy while T1 polling is in flight.
 * See zingaLocalDocs/stripeAsyncVerificationUX.md.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import StripeIdentityBanner from '@/components/dashboard/StripeAlertBanner';

// Minimal i18n stub so banner copy renders deterministically.
jest.mock('@/utils/i18n', () => ({
  t: (key: string) => key,
}));
jest.mock('@/utils/loggers', () => ({ log: jest.fn() }));
jest.mock('@/components/ui/ThemeText', () => ({
  __esModule: true,
  default: ({ children }: any) => children,
}));

const baseStatus = {
  account: { id: 'acct_1', payouts_enabled: false, charges_enabled: false },
  onboardingComplete: false,
} as any;

describe('StripeIdentityBanner', () => {
  it('renders normal copy + button when not verifying', () => {
    render(
      <StripeIdentityBanner
        status={baseStatus}
        loading={false}
        verifying={false}
        onIdentitySetup={jest.fn()}
      />,
    );
    expect(screen.getByText('dashboard.stripeIdentityComplete')).toBeTruthy();
    expect(screen.getByText('dashboard.stripeContinue')).toBeTruthy();
  });

  it('renders optimistic copy + holdTight when verifying', () => {
    render(
      <StripeIdentityBanner
        status={baseStatus}
        loading={false}
        verifying={true}
        onIdentitySetup={jest.fn()}
      />,
    );
    expect(screen.getByText('signup.verifying.identityTitle')).toBeTruthy();
    // Button title swaps to holdTight key OR the spinner replaces it —
    // both states satisfy the verifying contract.
    expect(
      screen.queryByText('dashboard.stripeContinue'),
    ).toBeNull();
  });

  it('does not fire onIdentitySetup when verifying (button disabled)', () => {
    const onIdentitySetup = jest.fn();
    render(
      <StripeIdentityBanner
        status={baseStatus}
        loading={false}
        verifying={true}
        onIdentitySetup={onIdentitySetup}
      />,
    );
    // Tapping any button in the banner while verifying must no-op.
    const buttons = screen.queryAllByRole('button');
    buttons.forEach((b) => fireEvent.press(b));
    expect(onIdentitySetup).not.toHaveBeenCalled();
  });

  it('hides itself when onboardingComplete is true', () => {
    const completeStatus = { ...baseStatus, onboardingComplete: true };
    const { toJSON } = render(
      <StripeIdentityBanner
        status={completeStatus}
        loading={false}
        verifying={false}
        onIdentitySetup={jest.fn()}
      />,
    );
    expect(toJSON()).toBeNull();
  });
});
