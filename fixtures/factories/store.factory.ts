import { Factory } from 'fishery';

export interface StoreSeed {
  storeId: string;
  owner: string;
  stripeAccountId: string | null;
  stripeAccountMode: 'test' | 'live' | null;
  stripePayoutsEnabled: boolean;
  stripeChargesEnabled: boolean;
  stripeOnboardingComplete: boolean;
}

export const storeFactory = Factory.define<StoreSeed>(({ sequence }) => ({
  storeId: `store_${sequence}`,
  owner: `uid_${sequence}`,
  stripeAccountId: null,
  stripeAccountMode: null,
  stripePayoutsEnabled: false,
  stripeChargesEnabled: false,
  stripeOnboardingComplete: false,
}));
