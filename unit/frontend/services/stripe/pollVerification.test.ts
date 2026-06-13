/**
 * Critical-path P0: Stripe async-verify polling state machine.
 * See zingaLocalDocs/stripeAsyncVerificationUX.md.
 */
import {
  pollUntilIdentityVerified,
  pollUntilConnectComplete,
} from '@/services/stripe/pollVerification';

// Mock the stripeApi so we can control what the poll loop sees.
jest.mock('@/services/stripe', () => ({
  stripeApi: {
    getVerificationSession: jest.fn(),
    getAccountStatus: jest.fn(),
  },
}));

import { stripeApi } from '@/services/stripe';
const mockGetVS = stripeApi.getVerificationSession as jest.Mock;
const mockGetAS = stripeApi.getAccountStatus as jest.Mock;

afterEach(() => {
  jest.clearAllMocks();
});

describe('pollUntilIdentityVerified', () => {
  it('resolves verified on first verified tick', async () => {
    mockGetVS.mockResolvedValueOnce({ status: 'verified' });
    const result = await pollUntilIdentityVerified('vs_test', {
      intervalMs: 5,
      timeoutMs: 100,
    });
    expect(result).toBe('verified');
  });

  it('resolves requires_input when status flips to it', async () => {
    mockGetVS.mockResolvedValueOnce({ status: 'processing' });
    mockGetVS.mockResolvedValueOnce({ status: 'requires_input' });
    const result = await pollUntilIdentityVerified('vs_test', {
      intervalMs: 5,
      timeoutMs: 200,
    });
    expect(result).toBe('requires_input');
  });

  it('resolves failed on canceled', async () => {
    mockGetVS.mockResolvedValueOnce({ status: 'canceled' });
    const result = await pollUntilIdentityVerified('vs_test', {
      intervalMs: 5,
      timeoutMs: 100,
    });
    expect(result).toBe('failed');
  });

  it('resolves pending on timeout when status stays processing', async () => {
    mockGetVS.mockResolvedValue({ status: 'processing' });
    const result = await pollUntilIdentityVerified('vs_test', {
      intervalMs: 5,
      timeoutMs: 30,
    });
    expect(result).toBe('pending');
  });

  it('retries on 5xx then resolves verified when stable', async () => {
    const err: any = new Error('server error');
    err.response = { status: 503 };
    mockGetVS.mockRejectedValueOnce(err);
    mockGetVS.mockResolvedValueOnce({ status: 'verified' });
    const result = await pollUntilIdentityVerified('vs_test', {
      intervalMs: 5,
      timeoutMs: 500,
    });
    expect(result).toBe('verified');
  });
});

describe('pollUntilConnectComplete', () => {
  it('resolves verified when onboardingComplete=true', async () => {
    mockGetAS.mockResolvedValueOnce({ onboardingComplete: true });
    const result = await pollUntilConnectComplete('store_1', {
      intervalMs: 5,
      timeoutMs: 100,
    });
    expect(result).toBe('verified');
  });

  it('resolves requires_input on Stripe disabled_reason', async () => {
    mockGetAS.mockResolvedValueOnce({
      onboardingComplete: false,
      account: { requirements: { disabled_reason: 'rejected.fraud' } },
    });
    const result = await pollUntilConnectComplete('store_1', {
      intervalMs: 5,
      timeoutMs: 100,
    });
    expect(result).toBe('requires_input');
  });

  it('ignores past_due as transient pending state', async () => {
    mockGetAS.mockResolvedValueOnce({
      onboardingComplete: false,
      account: { requirements: { disabled_reason: 'requirements.past_due' } },
    });
    mockGetAS.mockResolvedValueOnce({ onboardingComplete: true });
    const result = await pollUntilConnectComplete('store_1', {
      intervalMs: 5,
      timeoutMs: 200,
    });
    expect(result).toBe('verified');
  });
});
