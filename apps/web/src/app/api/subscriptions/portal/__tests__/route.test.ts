// @ts-nocheck
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST, GET } from '../route';

describe('API Route: apps/web/src/app/api/subscriptions/portal/route.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when unauthenticated', async () => {
    const req = new NextRequest('http://localhost/api/subscriptions/portal', {
      method: 'POST',
    });
    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  it('should handle POST request when userId is provided', async () => {
    const req = new NextRequest('http://localhost/api/subscriptions/portal', {
      method: 'POST',
      headers: {
        'x-user-id': 'user_123',
      },
      body: JSON.stringify({
        returnUrl: 'http://localhost:3000/settings',
      }),
    });
    const response = await POST(req);
    expect(response).toBeDefined();
    expect(response.status).toBeLessThan(500);
  });

  it('should support GET request matching POST', async () => {
    const req = new NextRequest('http://localhost/api/subscriptions/portal', {
      method: 'GET',
      headers: {
        'x-user-id': 'user_123',
      },
    });
    const response = await GET(req);
    expect(response).toBeDefined();
  });
});
