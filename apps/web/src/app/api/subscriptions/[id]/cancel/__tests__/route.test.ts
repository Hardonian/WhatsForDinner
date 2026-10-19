import { NextRequest } from 'next/server';

const mockGetAuthenticatedUser = jest.fn();
const mockCancelSubscription = jest.fn();
const mockLookup = jest.fn();
const mockUpdateEq = jest.fn();
const mockAdmin = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      or: jest.fn(() => ({ maybeSingle: mockLookup })),
    })),
    update: jest.fn(() => ({ eq: mockUpdateEq })),
  })),
};

jest.mock('@/lib/auth-middleware', () => ({
  getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
}));
jest.mock('@/lib/supabase/admin', () => ({ getSupabaseAdmin: () => mockAdmin }));
jest.mock('@/lib/stripe', () => ({
  StripeService: { cancelSubscription: (...args: unknown[]) => mockCancelSubscription(...args) },
}));

import { POST } from '../route';

const request = () => new NextRequest('https://example.com/api/subscriptions/sub_test/cancel', { method: 'POST' });

describe('subscription cancellation route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthenticatedUser.mockResolvedValue(null);
  });

  it('rejects unauthenticated cancellation', async () => {
    expect((await POST(request(), { params: Promise.resolve({ id: 'sub_test' }) })).status).toBe(401);
    expect(mockCancelSubscription).not.toHaveBeenCalled();
  });

  it('rejects cancellation of another user subscription', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ user: { id: 'attacker' } });
    mockLookup.mockResolvedValue({
      data: { id: 'row-1', user_id: 'owner', stripe_subscription_id: 'sub_test' },
      error: null,
    });
    expect((await POST(request(), { params: Promise.resolve({ id: 'sub_test' }) })).status).toBe(403);
    expect(mockCancelSubscription).not.toHaveBeenCalled();
  });

  it('cancels only the verified owner subscription', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ user: { id: 'owner' } });
    mockLookup.mockResolvedValue({
      data: { id: 'row-1', user_id: 'owner', stripe_subscription_id: 'sub_test' },
      error: null,
    });
    mockCancelSubscription.mockResolvedValue({ id: 'sub_test' });
    mockUpdateEq.mockResolvedValue({ error: null });
    const response = await POST(request(), { params: Promise.resolve({ id: 'sub_test' }) });
    expect(response.status).toBe(200);
    expect(mockCancelSubscription).toHaveBeenCalledWith('sub_test', false);
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'row-1');
  });
});
