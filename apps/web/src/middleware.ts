/**
 * Next.js Middleware — CSRF protection + performance headers
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const origin = request.headers.get("origin");
  const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || [];
  
  if (request.method !== "GET" && origin && !allowedOrigins.includes(origin)) {
    return new NextResponse("Invalid origin", { status: 403 });
  }
  const response = NextResponse.next();

  response.headers.set('X-Request-ID', crypto.randomUUID());
  response.headers.set('X-Response-Time', '0ms');

  if (typeof window === 'undefined') {
    const duration = Date.now() - startTime;
    response.headers.set('X-Response-Time', `${duration}ms`);
    if (duration > 1000) {
      console.warn(`Slow request: ${request.nextUrl.pathname} took ${duration}ms`);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};