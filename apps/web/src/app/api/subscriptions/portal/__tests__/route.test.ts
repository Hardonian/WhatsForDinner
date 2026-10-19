import { NextRequest, NextResponse } from 'next/server';

const mockRequireAuth = jest.fn();
const mockCreatePortal = jest.fn();

jest.mock('@/lib/auth-middleware', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
}));

jest.mock('@/lib/stripe', () => ({
  StripeService: {
    createCustomerPortalSession: (...args: unknown[]) => mockCreatePortal(...args),
  },
}));

import { GET, POST } from '../route';

describe('subscription portal route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({
      success: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });
  });

  it('rejects unauthenticated callers even when they spoof an identity', async () => {
    const request = new NextRequest('https://example.com/api/subscriptions/portal', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-user-id': 'victim' },
      body: JSON.stringify({ userId: 'victim' }),
    });
    expect((await POST(request)).status).toBe(401);
    expect(mockCreatePortal).not.toHaveBeenCalled();
  });

  it('uses the verified account and rejects an external return URL', async () => {
    mockRequireAuth.mockResolvedValue({
      success: true,
      context: { user: { id: 'verified-user', tenantId: 'verified-household' } },
    });
    mockCreatePortal.mockResolvedValue({ url: 'https://billing.stripe.com/session' });
    const request = new NextRequest('https://example.com/api/subscriptions/portal', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId: 'victim', returnUrl: 'https://evil.example/phish' }),
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(mockCreatePortal).toHaveBeenCalledWith({
      userId: 'verified-user',
      tenantId: 'verified-household',
      returnUrl: 'https://example.com/settings/billing',
    });
  });

  it('does not expose a GET side effect', async () => {
    expect((await GET(new NextRequest('https://example.com/api/subscriptions/portal'))).status).toBe(405);
  });
});
