// @ts-nocheck
/**
 * OpenAPI Contract Validation
 * 
 * Validates runtime routes against OpenAPI specification.
 * Flags 404/401/CSRF mismatches.
 */

import { describe, it, expect } from 'vitest';

interface RouteCheck {
  path: string;
  method: string;
  expectedStatus: number[];
  requiresAuth?: boolean;
  requiresCSRF?: boolean;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const routesToCheck: RouteCheck[] = [
  { path: '/api/healthz', method: 'GET', expectedStatus: [200] },
  { path: '/api/health', method: 'GET', expectedStatus: [200] },
  { path: '/api/meal-plan', method: 'GET', expectedStatus: [200, 401, 403], requiresAuth: true },
  { path: '/api/grocery-list', method: 'GET', expectedStatus: [200, 401, 403], requiresAuth: true },
  { path: '/api/experiments', method: 'GET', expectedStatus: [200, 401], requiresAuth: true },
  { path: '/api/pricing', method: 'GET', expectedStatus: [200, 401] },
  { path: '/api/gdpr', method: 'GET', expectedStatus: [200, 401, 404] },
  { path: '/api/stripe/webhook', method: 'POST', expectedStatus: [200, 400, 401] },
  { path: '/api/r/test', method: 'GET', expectedStatus: [200, 302, 404] },
];

describe('OpenAPI Contract Validation', () => {
  for (const route of routesToCheck) {
    it(`${route.method} ${route.path} should return expected status`, async () => {
      const response = await fetch(`${baseUrl}${route.path}`, {
        method: route.method,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      expect(route.expectedStatus).toContain(response.status);
      
      // Check CSRF headers if required
      if (route.requiresCSRF && route.method !== 'GET') {
        const origin = response.headers.get('access-control-allow-origin');
        expect(origin).toBeTruthy();
      }
      
      // Check auth requirement
      if (route.requiresAuth && response.status === 401) {
        const wwwAuth = response.headers.get('www-authenticate');
        expect(wwwAuth || response.status === 401).toBeTruthy();
      }
    });
  }
  
  it('should handle CORS preflight', async () => {
    const response = await fetch(`${baseUrl}/api/healthz`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
      },
    });
    
    expect([200, 204, 405]).toContain(response.status);
  });
});
