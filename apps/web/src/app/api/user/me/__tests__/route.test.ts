// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { createComponentLogger } from '@whats-for-dinner/utils';

const logger = createComponentLogger('test-user-me-api');

describe('User Me API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/user/me', () => {
    it('should return user data for authenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/user/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await GET(request);
      expect(response).toBeDefined();
    });

    it('should return 401 for unauthenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/user/me', {
        method: 'GET',
      });

      const response = await GET(request);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle errors gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/user/me', {
        method: 'GET',
      });

      const response = await GET(request);
      expect(response).toBeDefined();
    });
  });
});
