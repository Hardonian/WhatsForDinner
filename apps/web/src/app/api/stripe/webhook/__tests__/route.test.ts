import { NextRequest } from 'next/server';

const mockVerify = jest.fn();
const mockInsert = jest.fn();

jest.mock('@/lib/stripe', () => ({
  STRIPE_CONFIG: { webhookSecret: 'whsec_test' },
  StripeService: {
    verifyWebhookSignature: (...args: unknown[]) => mockVerify(...args),
  },
}));
jest.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => ({ from: () => ({ insert: mockInsert }) }),
}));

import { GET, POST } from '../route';

describe('Stripe webhook route', () => {
  beforeEach(() => jest.clearAllMocks());

  it('exposes only liveness metadata on GET', async () => {
    expect(await (await GET()).json()).toEqual({ status: 'ok', service: 'stripe-webhook' });
  });

  it('rejects unsigned payloads', async () => {
    const response = await POST(new NextRequest('https://example.com/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
    }));
    expect(response.status).toBe(400);
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it('rejects an invalid signature without parsing untrusted JSON', async () => {
    mockVerify.mockImplementation(() => { throw new Error('bad signature'); });
    const response = await POST(new NextRequest('https://example.com/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'bad' },
      body: '{"type":"forged"}',
    }));
    expect(response.status).toBe(400);
  });

  it('fails closed when the durable idempotency ledger is unavailable', async () => {
    mockVerify.mockReturnValue({ id: 'evt_123', type: 'ignored.test', data: { object: {} } });
    mockInsert.mockResolvedValue({ error: { code: '42P01', message: 'table missing' } });
    const response = await POST(new NextRequest('https://example.com/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'valid' },
      body: '{}',
    }));
    expect(response.status).toBe(503);
  });
});
