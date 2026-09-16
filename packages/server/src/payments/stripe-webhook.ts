// @ts-nocheck
/**
 * Billing stub with Stripe webhooks
 */

import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' })
  : null;

export const ENABLE_BILLING = process.env.ENABLE_BILLING === 'true';

export async function handleStripeWebhook(event: Stripe.Event) {
  if (!ENABLE_BILLING) {
        return;
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
            break;
    case 'customer.subscription.created':
            break;
    default:
        }
}
