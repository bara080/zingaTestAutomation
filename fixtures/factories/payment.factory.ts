import { Factory } from 'fishery';

export interface PaymentSeed {
  transactionId: string;
  storeId: string;
  customerUid: string;
  amount: number;
  currency: string;
  isPaid: boolean;
  paymentStatus: 'pending' | 'escrowed' | 'refunded' | 'in_dispute';
  stripeChargeId: string | null;
  paidAt: Date | null;
}

export const paymentFactory = Factory.define<PaymentSeed>(({ sequence }) => ({
  transactionId: `pi_test_${sequence.toString().padStart(8, '0')}`,
  storeId: `store_${sequence}`,
  customerUid: `cust_uid_${sequence}`,
  amount: 5000,
  currency: 'usd',
  isPaid: false,
  paymentStatus: 'pending',
  stripeChargeId: null,
  paidAt: null,
}));
