import { NextRequest, NextResponse } from 'next/server';

const mockRequireAuth = jest.fn();
const mockCreateCheckoutSession = jest.fn();

jest.mock('@/lib/auth-middleware', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
}));

jest.mock('@/lib/stripe', () => ({
  STRIPE_CONFIG: { webhookSecret: 'whsec_test' },
  StripeService: {
    createCheckoutSession: (...args: unknown[]) => mockCreateCheckoutSession(...args),
  },
}));

import { GET, POST } from '../route';

describe('subscription checkout route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({
      success: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });
  });

  it('returns the server-defined plan catalog', async () => {
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.plans.map((plan: { id: string }) => plan.id)).toEqual(['free', 'pro', 'family']);
  });

  it('rejects spoofed client identity headers and body fields', async () => {
    const request = new NextRequest('https://example.com/api/subscriptions/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-user-id': 'victim' },
      body: JSON.stringify({ plan: 'pro', userId: 'victim', tenantId: 'victim-household' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
    expect(mockCreateCheckoutSession).not.toHaveBeenCalled();
  });

  it('uses only the verified identity in Stripe metadata', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_configured';
    mockRequireAuth.mockResolvedValue({
      success: true,
      context: { user: { id: 'verified-user', tenantId: 'verified-household' } },
    });
    mockCreateCheckoutSession.mockResolvedValue({ id: 'cs_test_123', url: 'https://checkout.stripe.com/test' });
    const request = new NextRequest('https://example.com/api/subscriptions/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ plan: 'pro', userId: 'victim', tenantId: 'victim-household' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(mockCreateCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'verified-user',
      tenantId: 'verified-household',
    }));
    delete process.env.STRIPE_SECRET_KEY;
  });
});
