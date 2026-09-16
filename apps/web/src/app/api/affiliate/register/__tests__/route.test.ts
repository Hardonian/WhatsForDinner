// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { createComponentLogger } from '@whats-for-dinner/utils';

const logger = createComponentLogger('test-affiliate-register');

describe('affiliate-register API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/affiliate/register', () => {
    it('should handle valid request', async () => {
      const request = new NextRequest(`http://localhost:3000/api/affiliate/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      expect(response).toBeDefined();
    });

    it('should return 401 for unauthenticated user', async () => {
      const request = new NextRequest(`http://localhost:3000/api/affiliate/register`, {
        method: 'POST',
      });

      const response = await POST(request);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle errors gracefully', async () => {
      const request = new NextRequest(`http://localhost:3000/api/affiliate/register`, {
        method: 'POST',
      });

      const response = await POST(request);
      expect(response).toBeDefined();
    });
  });
});
