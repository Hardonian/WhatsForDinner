/**
 * Next.js Middleware — Security hardening, CORS/CSRF validation, and telemetry headers
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const origin = request.headers.get('origin');
  const requestOrigin = request.nextUrl.origin;
  const configuredOrigins = (process.env.CORS_ORIGINS?.split(',') || []).map(o => o.trim()).filter(Boolean);

  // Origin verification for state-changing methods
  if (request.method !== 'GET' && request.method !== 'HEAD' && origin) {
    const isSameOrigin = origin === requestOrigin;
    const isAllowedOrigin = configuredOrigins.includes(origin);
    // Block only if external origin not present in explicit configured allowlist
    if (!isSameOrigin && !isAllowedOrigin && configuredOrigins.length > 0) {
      return new NextResponse('Invalid origin', { status: 403 });
    }
  }

  const response = NextResponse.next();

  // Correlation and performance tracking headers
  const requestId = crypto.randomUUID();
  response.headers.set('X-Request-ID', requestId);
  const duration = Date.now() - startTime;
  response.headers.set('X-Response-Time', `${duration}ms`);

  // Enterprise Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (duration > 1000) {
    console.warn(`[Slow Request] ${request.method} ${request.nextUrl.pathname} took ${duration}ms (ID: ${requestId})`);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};