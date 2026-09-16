// @ts-nocheck
/**
 * Tests for Customer Value Profile API
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '../value-profile/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  })),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/lib/monetization/value-engine', () => ({
  valueEngine: {
    analyzeCustomerValue: vi.fn(),
  },
}));

describe('GET /api/monetization/value-profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    const { createRouteHandlerClient } = await import('@supabase/auth-helpers-nextjs');
    const mockSupabase = createRouteHandlerClient({ cookies: vi.fn() });
    vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const request = new NextRequest('http://localhost/api/monetization/value-profile');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('should return 404 if tenant not found', async () => {
    const { createRouteHandlerClient } = await import('@supabase/auth-helpers-nextjs');
    const mockSupabase = createRouteHandlerClient({ cookies: vi.fn() });
    vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    }));
    vi.mocked(mockSupabase.from).mockImplementation(mockFrom);

    const request = new NextRequest('http://localhost/api/monetization/value-profile');
    const response = await GET(request);

    expect(response.status).toBe(404);
  });

  it('should return value profile for authenticated user', async () => {
    const { valueEngine } = await import('@/lib/monetization/value-engine');
    const mockProfile = {
      userId: 'user-123',
      tenantId: 'tenant-456',
      currentPlan: 'free',
      currentMRR: 0,
      lifetimeValue: 0,
      engagementScore: 65,
      usagePatterns: {
        recipesGenerated: 5,
        featuresUsed: ['meal_generation'],
        sessionFrequency: 3,
        averageSessionDuration: 1200,
        retentionDays: 7,
      },
      monetizationPotential: {
        upsellProbability: 0.35,
        crossSellOpportunities: [],
        churnRisk: 0.35,
        expansionPotential: 0.65,
      },
    };

    vi.mocked(valueEngine.analyzeCustomerValue).mockResolvedValue(mockProfile);

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

    const request = new NextRequest('http://localhost/api/monetization/value-profile');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockProfile);
  });
});
