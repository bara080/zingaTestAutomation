/**
 * Critical-path P0: account.updated handler bumps caches per affected store.
 * Was the root cause of "SP banners won't go away" reports (stripeReviewAudit.md NEW-4).
 */
import accountUpdatedFixture from '../../fixtures/stripe/account.updated.json';

const mockBumpSpDashboardVersion = jest.fn().mockResolvedValue(undefined);
const mockInvalidateUserCaches = jest.fn().mockResolvedValue(undefined);
const mockRedis = { del: jest.fn().mockResolvedValue(1) };

jest.mock('../../zinga/Backend/api/libs/bumpingRedisVersion', () => ({
  bumpSpDashboardVersion: (...args: unknown[]) =>
    mockBumpSpDashboardVersion(...args),
  invalidateUserCaches: (...args: unknown[]) => mockInvalidateUserCaches(...args),
}));
jest.mock('../../zinga/Backend/api/config/redis', () => ({
  getRedis: () => mockRedis,
}));
jest.mock('../../zinga/Backend/api/libs/redisKeys', () => ({
  redisKeys: {
    spStripeStatus: ({ storeId }: { storeId: string }) =>
      `sp:stripe:store:${storeId}`,
  },
}));

const storesQueryStub = (stores: Array<{ storeId: string; owner: string }>) => ({
  select: jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue(stores),
  }),
});

const mockStoreModel = {
  find: jest.fn(),
  updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
};

jest.mock('../../zinga/Backend/api/utils/storeUtils', () => ({
  getStoreModel: () => mockStoreModel,
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const helper = require('../../zinga/Backend/api/helpers/stripeAccount');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('handleStripeAccountUpdate', () => {
  it('bumps cache per affected store when account is fully enabled', async () => {
    mockStoreModel.find.mockReturnValue(
      storesQueryStub([
        { storeId: 'store_1', owner: 'uid_1' },
        { storeId: 'store_2', owner: 'uid_2' },
      ]),
    );

    await helper.handleStripeAccountUpdate({ event: accountUpdatedFixture });

    expect(mockStoreModel.updateMany).toHaveBeenCalledTimes(1);
    expect(mockBumpSpDashboardVersion).toHaveBeenCalledWith('store_1');
    expect(mockBumpSpDashboardVersion).toHaveBeenCalledWith('store_2');
    expect(mockRedis.del).toHaveBeenCalledWith('sp:stripe:store:store_1');
    expect(mockRedis.del).toHaveBeenCalledWith('sp:stripe:store:store_2');
    expect(mockInvalidateUserCaches).toHaveBeenCalledWith({ uid: 'uid_1' });
    expect(mockInvalidateUserCaches).toHaveBeenCalledWith({ uid: 'uid_2' });
  });

  it('still bumps caches when account is NOT fully enabled (Stripe state may have changed)', async () => {
    const partial = JSON.parse(JSON.stringify(accountUpdatedFixture));
    partial.data.object.payouts_enabled = false;
    partial.data.object.charges_enabled = false;

    mockStoreModel.find.mockReturnValue(
      storesQueryStub([{ storeId: 'store_1', owner: 'uid_1' }]),
    );

    await helper.handleStripeAccountUpdate({ event: partial });

    expect(mockStoreModel.updateMany).not.toHaveBeenCalled();
    expect(mockBumpSpDashboardVersion).toHaveBeenCalledWith('store_1');
    expect(mockRedis.del).toHaveBeenCalledWith('sp:stripe:store:store_1');
  });

  it('warns and returns when no stores match the stripeAccountId', async () => {
    mockStoreModel.find.mockReturnValue(storesQueryStub([]));
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await helper.handleStripeAccountUpdate({ event: accountUpdatedFixture });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('account.updated unknown stripeAccountId: acct_test_zinga_sp_001'),
    );
    expect(mockBumpSpDashboardVersion).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
