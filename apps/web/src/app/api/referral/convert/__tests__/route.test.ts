// @ts-nocheck
/**
 * Referral Conversion API Tests
 */

import { POST } from '../route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => ({
        data: { user: { id: 'new-user-id' } },
        error: null,
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                id: 'ref-123',
                referrer_id: 'referrer-id',
                referral_code: 'REF-TEST',
                reward_status: 'pending',
                reward_type: 'pro_extension',
                reward_value: 30,
                invitee_id: null,
              },
              error: null,
            })),
          })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: { id: 'ref-123' },
          error: null,
        })),
      })),
      insert: jest.fn(() => ({
        data: { id: 'sub-123' },
        error: null,
      })),
    })),
  })),
}));

describe('POST /api/referral/convert', () => {
  it('should convert referral code and award rewards', async () => {
    const request = new NextRequest('http://localhost/api/referral/convert', {
      method: 'POST',
      body: JSON.stringify({ referralCode: 'REF-TEST' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.reward).toBeDefined();
  });

  it('should reject invalid referral code', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const mockSupabase = createClient() as any;
    
    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: { message: 'Not found' },
            })),
          })),
        })),
      })),
    });

    const request = new NextRequest('http://localhost/api/referral/convert', {
      method: 'POST',
      body: JSON.stringify({ referralCode: 'INVALID' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
  });

  it('should reject self-referral', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const mockSupabase = createClient() as any;
    
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'same-user-id' } },
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: {
                referrer_id: 'same-user-id',
                referral_code: 'REF-SELF',
              },
              error: null,
            })),
          })),
        })),
      })),
    });

    const request = new NextRequest('http://localhost/api/referral/convert', {
      method: 'POST',
      body: JSON.stringify({ referralCode: 'REF-SELF' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
