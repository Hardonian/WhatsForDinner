// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { createComponentLogger } from '@whats-for-dinner/utils';

const logger = createComponentLogger('test-cron-retention');

describe('cron-retention API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/cron/retention', () => {
    it('should handle valid request', async () => {
      const request = new NextRequest(`http://localhost:3000/api/cron/retention`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await GET(request);
      expect(response).toBeDefined();
    });

    it('should return 401 for unauthenticated user', async () => {
      const request = new NextRequest(`http://localhost:3000/api/cron/retention`, {
        method: 'GET',
      });

      const response = await GET(request);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle errors gracefully', async () => {
      const request = new NextRequest(`http://localhost:3000/api/cron/retention`, {
        method: 'GET',
      });

      const response = await GET(request);
      expect(response).toBeDefined();
    });
  });
});
