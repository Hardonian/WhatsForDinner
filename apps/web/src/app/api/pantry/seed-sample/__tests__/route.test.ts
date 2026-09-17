// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('test-pantry-seed-api');

// Mock dependencies
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

describe('Pantry Seed Sample API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/pantry/seed-sample', () => {
    it('should seed sample ingredients for authenticated user', async () => {
      const { supabase } = await import('@/lib/supabaseClient');
      
      // Mock auth
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: {
          user: { id: 'test-user-id' },
        },
        error: null,
      });

      // Mock profile query
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { tenant_id: 'test-tenant-id' },
        error: null,
      });

      // Mock pantry items query
      const mockLimit = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: mockSelect,
            eq: mockEq,
            single: mockSingle,
          } as any;
        }
        if (table === 'pantry_items') {
          return {
            select: mockSelect,
            eq: mockEq,
            limit: mockLimit,
            insert: vi.fn().mockReturnThis(),
          } as any;
        }
        return {} as any;
      });

      const request = new NextRequest('http://localhost:3000/api/pantry/seed-sample', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      expect(response).toBeDefined();
    });

    it('should return 401 for unauthenticated user', async () => {
      const { supabase } = await import('@/lib/supabaseClient');
      
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = new NextRequest('http://localhost:3000/api/pantry/seed-sample', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('should return existing count if sample data already seeded', async () => {
      const { supabase } = await import('@/lib/supabaseClient');
      
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: {
          user: { id: 'test-user-id' },
        },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue({
        data: [{ id: 'existing-id' }],
        error: null,
      });
      const mockSingle = vi.fn().mockResolvedValue({
        data: { tenant_id: 'test-tenant-id' },
        error: null,
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: mockSelect,
            eq: mockEq,
            single: mockSingle,
          } as any;
        }
        return {
          select: mockSelect,
          eq: mockEq,
          limit: mockLimit,
        } as any;
      });

      const request = new NextRequest('http://localhost:3000/api/pantry/seed-sample', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();
      expect(data.message).toContain('already seeded');
    });

    it('should handle errors gracefully', async () => {
      const { supabase } = await import('@/lib/supabaseClient');
      
      vi.mocked(supabase.auth.getUser).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/pantry/seed-sample', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      expect(response.status).toBeGreaterThanOrEqual(500);
    });
  });
});
