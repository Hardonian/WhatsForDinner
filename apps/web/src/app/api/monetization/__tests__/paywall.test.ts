// @ts-nocheck
/**
 * Tests for Paywall API
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '../paywall/route';
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

jest.mock('@/lib/monetization/freemium-converter', () => ({
  freemiumConverter: {
    shouldShowPaywall: jest.fn(),
    trackPaywallImpression: jest.fn(),
  },
}));

describe('GET /api/monetization/paywall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return paywall decision', async () => {
    const { freemiumConverter } = await import('@/lib/monetization/freemium-converter');
    const mockResult = {
      show: true,
      strategy: {
        id: 'urgency-modal',
        name: 'Urgency Modal',
        placement: 'modal',
        timing: 'immediate',
        design: 'urgency',
      },
      reason: 'Usage limit reached',
    };

    vi.mocked(freemiumConverter.shouldShowPaywall).mockResolvedValue(mockResult);

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

    const request = new NextRequest('http://localhost/api/monetization/paywall?page=dashboard');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.show).toBe(true);
    expect(data.strategy).toBeDefined();
  });
});
