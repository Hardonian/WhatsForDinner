// @ts-nocheck
/**
 * Partner hooks and integration contracts
 */

import { z } from 'zod';

export const PartnerWebhookSchema = z.object({
  partner: z.enum(['tiktok', 'meta', 'stripe']),
  event: z.string(),
  timestamp: z.string(),
  data: z.record(z.any()),
});

export type PartnerWebhook = z.infer<typeof PartnerWebhookSchema>;

export async function validatePartnerWebhook(payload: unknown): Promise<PartnerWebhook> {
  return PartnerWebhookSchema.parse(payload);
}

export interface PartnerIntegration {
  name: string;
  webhookUrl: string;
  events: string[];
  auth: 'bearer' | 'basic' | 'custom';
}

export const partnerIntegrations: PartnerIntegration[] = [
  {
    name: 'TikTok',
    webhookUrl: '/api/webhooks/tiktok',
    events: ['ad_click', 'conversion'],
    auth: 'bearer',
  },
  {
    name: 'Meta',
    webhookUrl: '/api/webhooks/meta',
    events: ['lead', 'conversion'],
    auth: 'bearer',
  },
  {
    name: 'Stripe',
    webhookUrl: '/api/webhooks/stripe',
    events: ['payment_intent.succeeded', 'customer.subscription.created'],
    auth: 'bearer',
  },
];
