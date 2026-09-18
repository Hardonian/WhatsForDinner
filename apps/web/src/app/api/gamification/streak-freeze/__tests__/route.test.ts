// @ts-nocheck
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST, GET } from '../route';

describe('API Route: apps/web/src/app/api/gamification/streak-freeze/route.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when unauthenticated', async () => {
    const req = new NextRequest('http://localhost/api/gamification/streak-freeze', {
      method: 'POST',
    });
    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  it('should return pricing and status on GET', async () => {
    const req = new NextRequest('http://localhost/api/gamification/streak-freeze', {
      method: 'GET',
      headers: {
        'x-user-id': 'user_123',
      },
    });
    const response = await GET(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.price).toBe(1.99);
    expect(Array.isArray(data.benefits)).toBe(true);
  });

  it('should create a $1.99 checkout session on POST', async () => {
    const req = new NextRequest('http://localhost/api/gamification/streak-freeze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'user_123',
      },
      body: JSON.stringify({}),
    });
    const response = await POST(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.success).toBe(true);
    expect(data.price).toBe(1.99);
  });
});
