// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '../route';

const mockRunHealthCheck = jest.fn();

describe('Health Check API Route', () => {
  beforeEach(() => {
    mockRunHealthCheck.mockReset();
    (globalThis as any).__mockRunHealthCheck = mockRunHealthCheck;
  });

  afterEach(() => {
    delete (globalThis as any).__mockRunHealthCheck;
  });

  describe('GET /api/health', () => {
    it('should return healthy status when all checks pass', async () => {
      mockRunHealthCheck.mockResolvedValue({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: 'pass', message: 'OK' },
          externalAPIs: { status: 'pass', message: 'OK' },
          memory: { status: 'pass', message: 'OK' },
        },
        uptime: 100,
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('healthy');
    });

    it('should return degraded status when some checks fail', async () => {
      mockRunHealthCheck.mockResolvedValue({
        status: 'degraded',
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: 'pass', message: 'OK' },
          externalAPIs: { status: 'warn', message: 'Slow' },
          memory: { status: 'pass', message: 'OK' },
        },
        uptime: 100,
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('degraded');
    });

    it('should return 503 when unhealthy', async () => {
      mockRunHealthCheck.mockResolvedValue({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: 'fail', message: 'Connection failed' },
        },
        uptime: 100,
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      
      expect(response.status).toBe(503);
    });

    it('should handle errors gracefully', async () => {
      mockRunHealthCheck.mockRejectedValue(new Error('Health check failed'));

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      
      expect(response.status).toBe(503);
      const data = await response.json();
      expect(data.status).toBe('unhealthy');
    });
  });
});
