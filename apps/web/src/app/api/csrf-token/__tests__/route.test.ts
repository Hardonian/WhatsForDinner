// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import * as csrfLib from '@/lib/csrf';

vi.mock('@/lib/csrf');

describe('/api/csrf-token GET', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate and return CSRF token', async () => {
    const mockToken = 'test-csrf-token-123';
    vi.mocked(csrfLib.generateCSRFToken).mockResolvedValue(mockToken);

    const req = new NextRequest('http://localhost/api/csrf-token');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.token).toBe(mockToken);
    expect(csrfLib.generateCSRFToken).toHaveBeenCalled();
  });

  it('should handle token generation errors', async () => {
    vi.mocked(csrfLib.generateCSRFToken).mockRejectedValue(
      new Error('Token generation failed')
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to generate CSRF token');
  });

  it('should return valid token format', async () => {
    const mockToken = 'csrf-token-abc123';
    vi.mocked(csrfLib.generateCSRFToken).mockResolvedValue(mockToken);

    const response = await GET();
    const data = await response.json();

    expect(data.token).toBeTruthy();
    expect(typeof data.token).toBe('string');
    expect(data.token.length).toBeGreaterThan(0);
  });
});
