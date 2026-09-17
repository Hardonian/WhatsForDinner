// @ts-nocheck
/**
 * Tests for Usage Premium Features API
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '../usage-premium/route';
import { NextRequest } from 'next/server';

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  })),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

jest.mock('@/lib/monetization/usage-premium', () => ({
  usagePremium: {
    getUserCredits: jest.fn(),
    getAvailableFeatures: jest.fn(),
    recommendFeatures: jest.fn(),
    purchaseCredits: jest.fn(),
    useCredits: jest.fn(),
  },
}));

describe('GET /api/monetization/usage-premium', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return available features', async () => {
    const { usagePremium } = await import('@/lib/monetization/usage-premium');
    const mockFeatures = [
      {
        id: 'ai_recipe_generation',
        name: 'AI Recipe Generation',
        description: 'Advanced AI-powered recipe generation',
        category: 'productivity',
        pricing: {
          type: 'credit_pack',
          creditPackSize: 100,
          creditPackPrice: 19.99,
        },
        valueMultiplier: 3.0,
        targetUsage: 50,
      },
    ];

    vi.mocked(usagePremium.getAvailableFeatures).mockReturnValue(mockFeatures);

    const { createRouteHandlerClient } = await import('@supabase/auth-helpers-nextjs');
    const mockSupabase = createRouteHandlerClient({ cookies: vi.fn() });
    vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { tenant_id: 'tenant-456' },
            error: null,
          }),
        })),
      })),
    }));
    vi.mocked(mockSupabase.from).mockImplementation(mockFrom);

    const request = new NextRequest('http://localhost/api/monetization/usage-premium');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.features).toEqual(mockFeatures);
  });
});

describe('POST /api/monetization/usage-premium', () => {
  it('should handle purchase action', async () => {
    const { usagePremium } = await import('@/lib/monetization/usage-premium');
    const mockResult = {
      checkoutUrl: 'https://checkout.stripe.com/test',
      credits: 100,
    };

    vi.mocked(usagePremium.purchaseCredits).mockResolvedValue(mockResult);

    const { createRouteHandlerClient } = await import('@supabase/auth-helpers-nextjs');
    const mockSupabase = createRouteHandlerClient({ cookies: vi.fn() });
    vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { tenant_id: 'tenant-456' },
            error: null,
          }),
        })),
      })),
    }));
    vi.mocked(mockSupabase.from).mockImplementation(mockFrom);

    const request = new NextRequest('http://localhost/api/monetization/usage-premium', {
      method: 'POST',
      body: JSON.stringify({
        action: 'purchase',
        featureId: 'ai_recipe_generation',
        quantity: 1,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.checkoutUrl).toBeDefined();
  });
});
