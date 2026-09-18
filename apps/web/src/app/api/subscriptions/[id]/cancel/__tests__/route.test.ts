// @ts-nocheck
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '../route';

describe('API Route: apps/web/src/app/api/subscriptions/[id]/cancel/route.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error if subscription id is missing', async () => {
    const req = new NextRequest('http://localhost/api/subscriptions/cancel', {
      method: 'POST',
    });
    const response = await POST(req, { params: Promise.resolve({ id: '' }) });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('should successfully cancel a subscription at period end', async () => {
    const req = new NextRequest('http://localhost/api/subscriptions/sub_test123/cancel', {
      method: 'POST',
      headers: {
        'x-user-id': 'user_123',
      },
    });
    const response = await POST(req, { params: Promise.resolve({ id: 'sub_test123' }) });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.cancelAtPeriodEnd).toBe(true);
  });
});
