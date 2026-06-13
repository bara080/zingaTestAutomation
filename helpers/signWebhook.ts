/**
 * Build a Stripe-signed webhook request body + headers so integration tests
 * can POST to the real handler at /api/stripe/webhook and pass signature
 * verification end-to-end.
 *
 * Mirrors what Stripe sends in prod — uses the same HMAC + timestamp format.
 */
import Stripe from 'stripe';

const STRIPE_TEST_SECRET = process.env.TEST_STRIPE_WEBHOOK_SECRET || 'whsec_test_zingaTest';

export function signStripeWebhook(payload: object, secret: string = STRIPE_TEST_SECRET) {
  const stripe = new Stripe('sk_test_dummy', { apiVersion: '2024-12-18.acacia' as any });
  const body = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = stripe.webhooks.generateTestHeaderString({
    payload: body,
    secret,
    timestamp,
  });
  return { body, signature, timestamp };
}

export { STRIPE_TEST_SECRET };
