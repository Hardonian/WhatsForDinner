import { NextRequest, NextResponse } from 'next/server';

const mockRequireAuth = jest.fn();
const mockMaybeSingle = jest.fn();
const mockEq = jest.fn(() => ({
  order: jest.fn(() => ({
    limit: jest.fn(() => ({ maybeSingle: mockMaybeSingle })),
  })),
}));
const mockGetSupabaseAdmin = jest.fn(() => ({
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: mockEq,
    })),
  })),
}));

jest.mock('@/lib/auth-middleware', () => ({
  requireAuth: (...args: unknown[]) => mockRequireAuth(...args),
}));
jest.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdmin: () => mockGetSupabaseAdmin(),
}));

import { GET } from '../route';

describe('current subscription route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({
      success: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });
  });

  it('returns 401 before initializing privileged database access', async () => {
    const response = await GET(new NextRequest('https://example.com/api/subscriptions/me', {
      headers: { 'x-user-id': 'spoofed-user' },
    }));
    expect(response.status).toBe(401);
    expect(mockGetSupabaseAdmin).not.toHaveBeenCalled();
  });

  it('queries only the verified user subscription', async () => {
    mockRequireAuth.mockResolvedValue({
      success: true,
      context: { user: { id: 'verified-user' } },
    });
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    const response = await GET(new NextRequest('https://example.com/api/subscriptions/me'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ subscription: null });
    expect(mockEq).toHaveBeenCalledWith('user_id', 'verified-user');
  });
});
