// @ts-nocheck
/**
 * Referral Program API Tests
 * Comprehensive test suite for referral creation and conversion
 */

import { POST } from '../route';
import { NextRequest } from 'next/server';

const mockClient = {
  auth: {
    getUser: jest.fn(() => ({
      data: { user: { id: 'test-user-id' } },
      error: null,
    })),
  },
  from: jest.fn(() => ({
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => ({
          data: {
            id: 'ref-123',
            referrer_id: 'test-user-id',
            referral_code: 'REF-TEST-CODE',
            reward_status: 'pending',
            reward_type: 'pro_extension',
            reward_value: 30,
          },
          error: null,
        })),
      })),
    })),
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          limit: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: null,
            })),
          })),
        })),
      })),
    })),
  })),
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockClient),
}));

describe('POST /api/referral/create', () => {
  it('should create a referral code for authenticated user', async () => {
    const request = new NextRequest('http://localhost/api/referral/create', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('referralCode');
    expect(data).toHaveProperty('referralLink');
    expect(data).toHaveProperty('reward');
    expect(data.reward.type).toBe('pro_extension');
    expect(data.reward.value).toBe(30);
  });

  it('should return existing referral if one exists', async () => {
    // Mock existing referral
    const { createClient } = await import('@/lib/supabase/server');
    const mockSupabase = createClient() as any;
    
    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            limit: jest.fn(() => ({
              single: jest.fn(() => ({
                data: {
                  id: 'existing-ref',
                  referral_code: 'REF-EXISTING',
                  reward_type: 'pro_extension',
                  reward_value: 30,
                },
                error: null,
              })),
            })),
          })),
        })),
      })),
    });

    const request = new NextRequest('http://localhost/api/referral/create', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.referralCode).toBe('REF-EXISTING');
  });
});
