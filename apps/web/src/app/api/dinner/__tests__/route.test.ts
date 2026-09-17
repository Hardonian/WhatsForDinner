// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('test-dinner-api');

// Mock dependencies
jest.mock('@/lib/openaiService', () => ({
  generateRecipesWithFallback: jest.fn(),
}));

jest.mock('@/lib/aiOptimization', () => ({
  aiOptimization: {
    getOptimizedResponse: jest.fn(),
  },
}));

jest.mock('@/lib/stripe', () => ({
  StripeService: {
    calculateTokenCost: jest.fn(),
  },
}));

jest.mock('@/lib/auth-middleware', () => ({
  getTenantContext: jest.fn(),
}));

jest.mock('@/lib/cache', () => ({
  suggestionCache: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

jest.mock('@/lib/analytics', () => ({
  analytics: {
    trackEvent: jest.fn(),
  },
}));

describe('Dinner API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/dinner', () => {
    it('should handle valid request with ingredients', async () => {
      const { getTenantContext } = await import('@/lib/auth-middleware');
      vi.mocked(getTenantContext).mockResolvedValue({
        success: true,
        context: {
          supabase: {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { plan: 'free' },
                  }),
                }),
              }),
            }),
          },
        },
        tenantId: 'test-tenant-id',
      });

      const { suggestionCache } = await import('@/lib/cache');
      vi.mocked(suggestionCache.get).mockReturnValue(null);

      const { aiOptimization } = await import('@/lib/aiOptimization');
      vi.mocked(aiOptimization.getOptimizedResponse).mockResolvedValue({
        response: {
          recipes: [
            {
              id: '1',
              title: 'Test Recipe',
              ingredients: ['chicken', 'rice'],
            },
          ],
          metadata: {},
        },
        model: 'gpt-4o-mini',
        tokens: 100,
        cost: 0.001,
        cached: false,
      });

      const request = new NextRequest('http://localhost:3000/api/dinner', {
        method: 'POST',
        body: JSON.stringify({
          ingredients: ['chicken', 'rice'],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      expect(response).toBeDefined();
      const data = await response.json();
      expect(data.recipes).toBeDefined();
    });

    it('should return 400 for invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/dinner', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should return 400 for empty ingredients array', async () => {
      const { getTenantContext } = await import('@/lib/auth-middleware');
      vi.mocked(getTenantContext).mockResolvedValue({
        success: true,
        context: { supabase: {} },
        tenantId: 'test-tenant-id',
      });

      const request = new NextRequest('http://localhost:3000/api/dinner', {
        method: 'POST',
        body: JSON.stringify({
          ingredients: [],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Empty pantry');
    });

    it('should return cached result when available', async () => {
      const { getTenantContext } = await import('@/lib/auth-middleware');
      vi.mocked(getTenantContext).mockResolvedValue({
        success: true,
        context: { supabase: {} },
        tenantId: 'test-tenant-id',
      });

      const { suggestionCache } = await import('@/lib/cache');
      vi.mocked(suggestionCache.get).mockReturnValue({
        recipes: [{ id: '1', title: 'Cached Recipe' }],
        metadata: { cached: true },
      });

      const request = new NextRequest('http://localhost:3000/api/dinner', {
        method: 'POST',
        body: JSON.stringify({
          ingredients: ['chicken', 'rice'],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();
      expect(data.metadata.cached).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const { getTenantContext } = await import('@/lib/auth-middleware');
      vi.mocked(getTenantContext).mockRejectedValue(new Error('Test error'));

      const request = new NextRequest('http://localhost:3000/api/dinner', {
        method: 'POST',
        body: JSON.stringify({
          ingredients: ['chicken'],
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      expect(response.status).toBeGreaterThanOrEqual(500);
    });
  });
});
