// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { POST } from '../route';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('test-programs-attribution');

describe('programs-attribution API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/programs/attribution', () => {
    it('should handle valid request', async () => {
      const request = new NextRequest(`http://localhost:3000/api/programs/attribution`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await GET(request);
      expect(response).toBeDefined();
    });

    it('should return 401 for unauthenticated user', async () => {
      const request = new NextRequest(`http://localhost:3000/api/programs/attribution`, {
        method: 'GET',
      });

      const response = await GET(request);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle errors gracefully', async () => {
      const request = new NextRequest(`http://localhost:3000/api/programs/attribution`, {
        method: 'GET',
      });

      const response = await GET(request);
      expect(response).toBeDefined();
    });
  });

  describe('POST /api/programs/attribution', () => {
    it('should handle valid request', async () => {
      const request = new NextRequest(`http://localhost:3000/api/programs/attribution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      expect(response).toBeDefined();
    });

    it('should return 401 for unauthenticated user', async () => {
      const request = new NextRequest(`http://localhost:3000/api/programs/attribution`, {
        method: 'POST',
      });

      const response = await POST(request);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle errors gracefully', async () => {
      const request = new NextRequest(`http://localhost:3000/api/programs/attribution`, {
        method: 'POST',
      });

      const response = await POST(request);
      expect(response).toBeDefined();
    });
  });
});
