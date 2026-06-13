/**
 * Critical-path P0: identity.verified handler uses findOneAndUpdate to
 * recover storeId, bumps SP dashboard + user caches, errors loudly when
 * the session row is missing.
 */
import identityVerifiedFixture from '../../fixtures/stripe/identity.verified.json';

const mockFindOneAndUpdate = jest.fn();
const mockBumpSpDashboardVersion = jest.fn().mockResolvedValue(undefined);
const mockInvalidateUserCaches = jest.fn().mockResolvedValue(undefined);
const mockStoreFindOne = jest.fn();

jest.mock('../../zinga/Backend/api/models/identityVerificationSessionModel', () => {
  function IVS() {}
  (IVS as any).findOneAndUpdate = (...args: unknown[]) => ({
    lean: jest.fn().mockImplementation(async () => mockFindOneAndUpdate(...args)),
  });
  return IVS;
});

jest.mock('../../zinga/Backend/api/utils/storeUtils', () => ({
  getStoreModel: () => ({
    findOne: () => ({
      select: () => ({
        lean: jest.fn().mockImplementation(async () => mockStoreFindOne()),
      }),
    }),
  }),
}));

jest.mock('../../zinga/Backend/api/libs/bumpingRedisVersion', () => ({
  bumpSpDashboardVersion: (...args: unknown[]) =>
    mockBumpSpDashboardVersion(...args),
  invalidateUserCaches: (...args: unknown[]) => mockInvalidateUserCaches(...args),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const helper = require('../../zinga/Backend/api/helpers/stripeIdentity');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('stripeIdentityVerification', () => {
  it('marks session verified and bumps caches', async () => {
    mockFindOneAndUpdate.mockResolvedValueOnce({
      stripeSessionId: 'vs_test_00000001',
      storeId: 'store_1',
      status: 'verified',
    });
    mockStoreFindOne.mockResolvedValueOnce({ owner: 'uid_1' });

    await helper.stripeIdentityVerification({ event: identityVerifiedFixture });

    expect(mockBumpSpDashboardVersion).toHaveBeenCalledWith('store_1');
    expect(mockInvalidateUserCaches).toHaveBeenCalledWith({ uid: 'uid_1' });
  });

  it('logs error and skips bumps when no session record exists', async () => {
    mockFindOneAndUpdate.mockResolvedValueOnce(null);
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await helper.stripeIdentityVerification({ event: identityVerifiedFixture });

    expect(errSpy).toHaveBeenCalledWith(
      expect.stringContaining('No session found for stripeSessionId: vs_test_00000001'),
    );
    expect(mockBumpSpDashboardVersion).not.toHaveBeenCalled();
    expect(mockInvalidateUserCaches).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
