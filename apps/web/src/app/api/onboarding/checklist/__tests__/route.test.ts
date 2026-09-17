// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { supabase } from '@/lib/supabaseClient';
import { headers } from 'next/headers';

jest.mock('@/lib/supabaseClient');
jest.mock('next/headers');

describe('/api/onboarding/checklist GET', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return onboarding checklist for authenticated user', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockOnboardingState = {
      first_recipe_generated: true,
      preferences_set: true,
      checklist_completed: false,
    };
    const mockPantryItems = [{ id: '1' }];
    const mockFavorites = [{ id: '1' }];

    vi.mocked(headers).mockResolvedValue(new Headers() as any);
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'onboarding_state') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockOnboardingState, error: null }),
            }),
          }),
        } as any;
      }
      if (table === 'pantry_items') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: mockPantryItems, error: null }),
            }),
          }),
        } as any;
      }
      if (table === 'favorites') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: mockFavorites, error: null }),
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    const req = new NextRequest('http://localhost/api/onboarding/checklist');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.generate_recipe).toBe(true);
    expect(data.add_pantry).toBe(true);
    expect(data.set_preferences).toBe(true);
    expect(data.save_recipe).toBe(true);
  });

  it('should return 401 for unauthenticated user', async () => {
    vi.mocked(headers).mockResolvedValue(new Headers() as any);
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const req = new NextRequest('http://localhost/api/onboarding/checklist');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should handle missing onboarding state gracefully', async () => {
    const mockUser = { id: 'user-123' };

    vi.mocked(headers).mockResolvedValue(new Headers() as any);
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    } as any);

    const req = new NextRequest('http://localhost/api/onboarding/checklist');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.generate_recipe).toBe(false);
    expect(data.checklist_completed).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(headers).mockResolvedValue(new Headers() as any);
    vi.mocked(supabase.auth.getUser).mockRejectedValue(new Error('Database error'));

    const req = new NextRequest('http://localhost/api/onboarding/checklist');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch checklist');
  });
});
