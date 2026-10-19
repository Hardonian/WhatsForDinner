import { NextRequest, NextResponse } from 'next/server';

const mockRequireAuth = jest.fn();
const mockCreateCheckoutSession = jest.fn();
const mockEq = jest.fn();

jest.mock('@/lib/auth-middleware', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
}));
jest.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => ({
    from: () => ({ select: () => ({ eq: (...args: unknown[]) => mockEq(...args) }) }),
  }),
}));
jest.mock('@/lib/stripe', () => ({
  StripeService: { createCheckoutSession: (...args: unknown[]) => mockCreateCheckoutSession(...args) },
}));

import { GET, POST } from '../route';

describe('credit purchase route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({
      success: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });
    mockEq.mockResolvedValue({ data: [] });
  });

  it('rejects a spoofed user header', async () => {
    const request = new NextRequest('https://example.com/api/credits/purchase', {
      headers: { 'x-user-id': 'victim' },
    });
    expect((await GET(request)).status).toBe(401);
  });

  it('returns packs and balance for the verified user', async () => {
    mockRequireAuth.mockResolvedValue({
      success: true,
      context: { user: { id: 'verified-user', tenantId: 'verified-household' } },
    });
    mockEq.mockResolvedValue({ data: [{ credits: 10 }, { credits: 5 }] });
    const response = await GET(new NextRequest('https://example.com/api/credits/purchase'));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.currentBalance).toBe(15);
    expect(body.packs.length).toBeGreaterThan(0);
    expect(mockEq).toHaveBeenCalledWith('user_id', 'verified-user');
  });

  it('uses verified identity and server-controlled return URLs for checkout', async () => {
    mockRequireAuth.mockResolvedValue({
      success: true,
      context: { user: { id: 'verified-user', tenantId: 'verified-household' } },
    });
    mockCreateCheckoutSession.mockResolvedValue({ id: 'cs_test', url: 'https://checkout.stripe.com/test' });
    const request = new NextRequest('https://example.com/api/credits/purchase', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-user-id': 'victim' },
      body: JSON.stringify({ packId: 'popular', userId: 'victim' }),
    });
    expect((await POST(request)).status).toBe(200);
    expect(mockCreateCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'verified-user',
      tenantId: 'verified-household',
      successUrl: 'https://example.com/dashboard?credits_purchased=25',
      cancelUrl: 'https://example.com/pricing',
    }));
  });
});
