/**
 * Critical-path P0: /register/account guard redirects to /register/role
 * when `selectedRoleReady && !selectedRole`. Prevents v3.6.0 "stuck on
 * Create Account" reports. See zingaLocalDocs/registerRoleRaceCondition.md.
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

const replaceMock = jest.fn();

jest.mock(
  'expo-router',
  () => ({
    useRouter: () => ({
      replace: replaceMock,
      canGoBack: () => true,
      back: jest.fn(),
    }),
  }),
  { virtual: true },
);

let mockRegister: any;
jest.mock('@/context/RegisterProvider', () => ({
  useRegister: () => mockRegister,
}));
jest.mock('@/context/FullScreenLoaderProvider', () => ({
  useFullScreenLoader: () => ({ showLoader: jest.fn(), hideLoader: jest.fn() }),
}));
jest.mock('@/utils/loggers', () => ({ log: jest.fn(), error: jest.fn() }));
jest.mock('@/components/registration/sp-registration/RegistrationStepperSP', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/components/registration/RegistrationAccountCustomer', () => ({
  __esModule: true,
  default: () => null,
}));

// Path matches the file location in Frontend submodule.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Step3Account = require('@/app/(auth)/register/account').default;

beforeEach(() => {
  replaceMock.mockClear();
});

describe('/register/account selectedRole race guard', () => {
  it('does NOT redirect while selectedRoleReady is false', () => {
    mockRegister = { loading: false, selectedRole: null, selectedRoleReady: false };
    render(<Step3Account />);
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('redirects to /register/role when ready and no role is selected', async () => {
    mockRegister = { loading: false, selectedRole: null, selectedRoleReady: true };
    render(<Step3Account />);
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/(auth)/register/role');
    });
  });

  it('does NOT redirect when ready and role is set', () => {
    mockRegister = {
      loading: false,
      selectedRole: 'customer',
      selectedRoleReady: true,
    };
    render(<Step3Account />);
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
