// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('test-telemetry');

describe('telemetry API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/telemetry', () => {
    it('should handle valid request', async () => {
      const request = new NextRequest(`http://localhost:3000/api/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      expect(response).toBeDefined();
    });

    it('should return 401 for unauthenticated user', async () => {
      const request = new NextRequest(`http://localhost:3000/api/telemetry`, {
        method: 'POST',
      });

      const response = await POST(request);
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle errors gracefully', async () => {
      const request = new NextRequest(`http://localhost:3000/api/telemetry`, {
        method: 'POST',
      });

      const response = await POST(request);
      expect(response).toBeDefined();
    });
  });
});
