import { NextRequest, NextResponse } from 'next/server';

const mockRequireAuth = jest.fn();
const mockCreateCheckoutSession = jest.fn();
const mockMaybeSingle = jest.fn();
const mockEq = jest.fn(() => ({ maybeSingle: (...args: unknown[]) => mockMaybeSingle(...args) }));

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

describe('streak freeze route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({
      success: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });
    mockMaybeSingle.mockResolvedValue({ data: null });
  });

  it('rejects a spoofed user header', async () => {
    const request = new NextRequest('https://example.com/api/gamification/streak-freeze', {
      headers: { 'x-user-id': 'victim' },
    });
    expect((await GET(request)).status).toBe(401);
  });

  it('returns status for the verified user', async () => {
    mockRequireAuth.mockResolvedValue({
      success: true,
      context: { user: { id: 'verified-user', tenantId: 'verified-household' } },
    });
    mockMaybeSingle.mockResolvedValue({ data: { streak_freeze_active: true } });
    const response = await GET(new NextRequest('https://example.com/api/gamification/streak-freeze'));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.price).toBe(1.99);
    expect(body.isFreezeActive).toBe(true);
    expect(mockEq).toHaveBeenCalledWith('user_id', 'verified-user');
  });

  it('uses verified identity and server-controlled return URLs for checkout', async () => {
    mockRequireAuth.mockResolvedValue({
      success: true,
      context: { user: { id: 'verified-user', tenantId: 'verified-household' } },
    });
    mockCreateCheckoutSession.mockResolvedValue({ id: 'cs_test', url: 'https://checkout.stripe.com/test' });
    const request = new NextRequest('https://example.com/api/gamification/streak-freeze', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-user-id': 'victim' },
      body: JSON.stringify({ userId: 'victim' }),
    });
    expect((await POST(request)).status).toBe(200);
    expect(mockCreateCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'verified-user',
      successUrl: 'https://example.com/dashboard?streak_frozen=true',
      cancelUrl: 'https://example.com/dashboard',
      metadata: expect.objectContaining({ userId: 'verified-user' }),
    }));
  });
});
