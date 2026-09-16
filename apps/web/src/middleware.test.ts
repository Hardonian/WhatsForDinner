// @ts-nocheck
/**
 * Middleware Tests
 * Tests for Edge runtime compatibility and functionality
 */

import { NextRequest } from 'next/server';
import { middleware } from './middleware';

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('Middleware', () => {
  it('should handle requests without blocking', async () => {
    const request = new NextRequest('http://localhost:3000/');
    const response = await middleware(request);
    
    expect(response).toBeDefined();
    expect(response.status).toBe(200);
  });

  it('should add security headers', async () => {
    const request = new NextRequest('http://localhost:3000/');
    const response = await middleware(request);
    
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('should handle API key rate limiting when enabled', async () => {
    process.env.API_MONETIZATION_ENABLED = 'true';
    
    const request = new NextRequest('http://localhost:3000/api/v1/test', {
      headers: {
        'x-api-key': 'test-key',
      },
    });
    
    // Mock Supabase client
    jest.mock('./lib/supabase/server', () => ({
      createClient: jest.fn(() => ({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn(() => Promise.resolve({ data: null })),
              })),
            })),
          })),
        })),
      })),
    }));
    
    const response = await middleware(request);
    
    // Should return 401 for invalid API key
    expect(response.status).toBe(401);
  });

  it('should use Web Crypto API for hashing in Edge runtime', async () => {
    // Verify that crypto.subtle is available (Web Crypto API)
    expect(typeof crypto.subtle).toBe('object');
    expect(typeof crypto.subtle.digest).toBe('function');
    
    // Test SHA-256 hashing
    const encoder = new TextEncoder();
    const data = encoder.encode('test-key');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    expect(hashHex).toBeDefined();
    expect(hashHex.length).toBe(64); // SHA-256 produces 64 hex characters
  });

  it('should handle preview environment protection', async () => {
    process.env.PREVIEW_REQUIRE_AUTH = 'true';
    
    const request = new NextRequest('http://preview-git-branch.vercel.app/admin', {
      headers: {},
    });
    
    const response = await middleware(request);
    
    // Should require authentication in preview
    expect(response.status).toBe(401);
  });
});
