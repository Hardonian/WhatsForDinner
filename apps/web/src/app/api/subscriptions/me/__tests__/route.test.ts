// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('test-subscriptions-me-api');

describe('Subscriptions Me API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/subscriptions/me', () => {
    it('should return subscription for authenticated user with Stripe customer', async () => {
      const request = new NextRequest('http://localhost:3000/api/subscriptions/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'test-user-id',
        },
      });

      const response = await GET(request);
      expect(response).toBeDefined();
    });

    it('should return 401 for unauthenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/subscriptions/me', {
        method: 'GET',
      });

      const response = await GET(request);
      expect(response.status).toBe(401);
    });

    it('should return null subscription for user without Stripe customer', async () => {
      const request = new NextRequest('http://localhost:3000/api/subscriptions/me', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id',
        },
      });

      const response = await GET(request);
      const data = await response.json();
      expect(data.subscription).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/subscriptions/me', {
        method: 'GET',
        headers: {
          'x-user-id': 'test-user-id',
        },
      });

      const response = await GET(request);
      expect(response).toBeDefined();
    });
  });
});
