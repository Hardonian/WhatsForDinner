// @ts-nocheck
/**
 * Tests for Upsell Opportunities API
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '../upsells/route';
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

jest.mock('@/lib/monetization/value-engine', () => ({
  valueEngine: {
    identifyUpsellOpportunities: jest.fn(),
  },
}));

describe('GET /api/monetization/upsells', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return upsell opportunities', async () => {
    const { valueEngine } = await import('@/lib/monetization/value-engine');
    const mockOpportunities = [
      {
        id: 'upsell-1',
        type: 'plan_upgrade',
        targetPlan: 'pro',
        trigger: 'usage_limit',
        urgency: 'high',
        estimatedValue: 9.99,
        conversionProbability: 0.35,
        personalizedMessage: 'Upgrade to Pro for unlimited recipes',
        offerDetails: {
          freeTrialDays: 7,
          bonusCredits: 50,
        },
        context: {},
      },
    ];

    vi.mocked(valueEngine.identifyUpsellOpportunities).mockResolvedValue(mockOpportunities);

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

    const request = new NextRequest('http://localhost/api/monetization/upsells');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.opportunities).toEqual(mockOpportunities);
  });
});
