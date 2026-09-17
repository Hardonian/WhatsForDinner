// @ts-nocheck
/**
 * Revenue Dashboard API Tests
 */

import { GET } from '../route';
import { NextRequest } from 'next/server';

const mockClient = {
  auth: {
    getUser: jest.fn(() => ({
      data: { user: { id: 'admin-user' } },
      error: null,
    })),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => ({
          data: { role: 'owner' },
          error: null,
        })),
      })),
      count: 'exact',
      head: true,
    })),
    gte: jest.fn(() => ({
      data: [],
      error: null,
    })),
  })),
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockClient),
}));

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    subscriptions: {
      list: jest.fn(() => ({
        data: [
          {
            id: 'sub-1',
            status: 'active',
            items: {
              data: [{ price: { unit_amount: 999 } }],
            },
          },
        ],
      })),
    },
    charges: {
      list: jest.fn(() => ({
        data: [{ amount: 999 }],
      })),
    },
  }));
});

describe('GET /api/revenue/dashboard', () => {
  it('should return revenue dashboard for admin user', async () => {
    const request = new NextRequest('http://localhost/api/revenue/dashboard', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('summary');
    expect(data.summary).toHaveProperty('totalRevenue');
    expect(data.summary).toHaveProperty('mrr');
    expect(data.summary).toHaveProperty('arpu');
    expect(data.summary).toHaveProperty('ltv');
    expect(data.summary).toHaveProperty('churnRate');
  });

  it('should reject non-admin users', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const mockSupabase = createClient() as any;
    
    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { role: 'viewer' },
            error: null,
          })),
        })),
      })),
    });

    const request = new NextRequest('http://localhost/api/revenue/dashboard', {
      method: 'GET',
    });

    const response = await GET(request);
    expect(response.status).toBe(403);
  });
});
