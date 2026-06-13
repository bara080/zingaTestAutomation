/**
 * Critical-path P0: handler ACKs (no 500) on unknown payment.
 * Prevents Stripe 3-day retry storms → endpoint disable.
 * See zingaLocalDocs/stripeReviewAudit.md NEW-4 and the patch this session
 * applied to handleStripePaymentIntentSuccess.
 */
import payloadJson from '../../fixtures/stripe/payment_intent.succeeded.json';

// Path into the submodule. CommonJS so the require resolves at runtime.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const helper = require('../../zinga/Backend/api/helpers/stripePayment');

interface FakePayment {
  isPaid: boolean;
  paidAt: Date | null;
  paymentStatus: string;
  stripeChargeId: string | null;
  save: jest.Mock;
}

function buildConn(paymentDoc: FakePayment | null) {
  const sessionStub = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    abortTransaction: jest.fn().mockResolvedValue(undefined),
    endSession: jest.fn(),
  };
  const PaymentModel = {
    findOne: jest.fn(() => ({
      session: jest.fn().mockResolvedValue(paymentDoc),
    })),
  };
  return {
    startSession: jest.fn().mockResolvedValue(sessionStub),
    model: jest.fn().mockReturnValue(PaymentModel),
    _session: sessionStub,
    _Payment: PaymentModel,
  };
}

describe('handleStripePaymentIntentSuccess', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('updates payment when found and commits transaction', async () => {
    const fakePayment: FakePayment = {
      isPaid: false,
      paidAt: null,
      paymentStatus: 'pending',
      stripeChargeId: null,
      save: jest.fn().mockResolvedValue(undefined),
    };
    const conn = buildConn(fakePayment);

    await helper.handleStripePaymentIntentSuccess({ event: payloadJson, conn });

    expect(fakePayment.isPaid).toBe(true);
    expect(fakePayment.paymentStatus).toBe('escrowed');
    expect(fakePayment.stripeChargeId).toBe('ch_test_00000001');
    expect(fakePayment.save).toHaveBeenCalled();
    expect(conn._session.commitTransaction).toHaveBeenCalled();
    expect(conn._session.abortTransaction).not.toHaveBeenCalled();
  });

  it('ACKs (no throw) when payment not found and commits transaction', async () => {
    const conn = buildConn(null);

    await expect(
      helper.handleStripePaymentIntentSuccess({ event: payloadJson, conn }),
    ).resolves.toBeUndefined();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('payment_intent.succeeded unknown pi: pi_test_00000001'),
    );
    expect(conn._session.commitTransaction).toHaveBeenCalled();
    expect(conn._session.abortTransaction).not.toHaveBeenCalled();
  });

  it('returns early without re-save when payment is already paid', async () => {
    const fakePayment: FakePayment = {
      isPaid: true,
      paidAt: new Date(),
      paymentStatus: 'escrowed',
      stripeChargeId: 'ch_existing',
      save: jest.fn(),
    };
    const conn = buildConn(fakePayment);

    await helper.handleStripePaymentIntentSuccess({ event: payloadJson, conn });

    expect(fakePayment.save).not.toHaveBeenCalled();
    expect(conn._session.commitTransaction).toHaveBeenCalled();
  });
});
