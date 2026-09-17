// @ts-nocheck
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST, GET } from '../route';

describe('API Route: apps/web/src/app/api/pantry/barcode/route.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle GET request with barcode', async () => {
    const req = new NextRequest('http://localhost/api/pantry/barcode?barcode=076808500139', {
      headers: { 'content-type': 'application/json' },
    });
    const response = await GET(req);
    expect(response).toBeDefined();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.product.name).toContain('Kerrygold');
  });

  it('should handle POST request with barcode body', async () => {
    const req = new NextRequest('http://localhost/api/pantry/barcode', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ barcode: '011110038334' }),
    });
    const response = await POST(req);
    expect(response).toBeDefined();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.product.brand).toContain('Simple Truth');
  });

  it('should validate missing barcode', async () => {
    const req = new NextRequest('http://localhost/api/pantry/barcode', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await POST(req);
    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});
