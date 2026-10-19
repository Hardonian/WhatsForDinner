/**
 * Next.js Middleware — Security hardening, CORS/CSRF validation, and telemetry headers
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PROTECTED_API_PREFIXES = [
  '/api/admin',
  '/api/ai',
  '/api/billing',
  '/api/chat',
  '/api/collections',
  '/api/credits',
  '/api/dinner',
  '/api/export',
  '/api/family',
  '/api/gdpr',
  '/api/meal-plan',
  '/api/mealplan',
  '/api/pantry',
  '/api/preferences',
  '/api/premium',
  '/api/privacy',
  '/api/recipes/generate-image',
  '/api/subscriptions',
  '/api/user',
];

function isProtectedApi(pathname: string) {
  return PROTECTED_API_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

function checkRateLimit(ip: string, pathname: string): { allowed: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  let limit = 120;
  const windowMs = 60 * 1000;

  if (pathname.startsWith('/api/dinner') || pathname.startsWith('/api/ai')) {
    limit = 30;
  } else if (pathname.startsWith('/api/auth')) {
    limit = 20;
  }

  const key = `${ip}:${pathname.startsWith('/api/dinner') || pathname.startsWith('/api/ai') ? 'ai' : pathname.startsWith('/api/auth') ? 'auth' : 'api'}`;
  const record = rateLimitMap.get(key);

  if (rateLimitMap.size > 10000) {
    rateLimitMap.clear();
  }

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, limit, remaining: limit - 1, reset: now + windowMs };
  }

  if (record.count >= limit) {
    return { allowed: false, limit, remaining: 0, reset: record.resetAt };
  }

  record.count += 1;
  return { allowed: true, limit, remaining: limit - record.count, reset: record.resetAt };
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

  let currentRateCheck: { limit: number; remaining: number; reset: number } | null = null;

  // Apply rate limiting to all /api/* routes (excluding health probes)
  if (request.nextUrl.pathname.startsWith('/api/') && 
      !request.nextUrl.pathname.startsWith('/api/health') && 
      !request.nextUrl.pathname.startsWith('/api/livez') && 
      !request.nextUrl.pathname.startsWith('/api/readyz')) {
    const rateCheck = checkRateLimit(ip, request.nextUrl.pathname);
    currentRateCheck = rateCheck;
    if (!rateCheck.allowed) {
      const retryAfter = Math.ceil((rateCheck.reset - Date.now()) / 1000);
      return new NextResponse(JSON.stringify({ error: 'Too Many Requests', retryAfter }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(rateCheck.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateCheck.reset),
        },
      });
    }
  }

  // Preview environment protection
  if (process.env.PREVIEW_REQUIRE_AUTH === 'true') {
    const hostname = request.nextUrl.hostname || '';
    if ((hostname.includes('preview') || hostname.includes('vercel.app')) && !request.headers.get('authorization')) {
      return new NextResponse('Authentication Required', { status: 401 });
    }
  }

  // API monetization / rate limiting check
  if (process.env.API_MONETIZATION_ENABLED === 'true' && request.nextUrl.pathname.startsWith('/api/v2/')) {
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey === 'test-key') {
      return new NextResponse('Unauthorized API Key', { status: 401 });
    }
  }

  const origin = request.headers.get('origin');
  const requestOrigin = request.nextUrl.origin;
  const configuredOrigins = (process.env.CORS_ORIGINS?.split(',') || []).map(o => o.trim()).filter(Boolean);

  const protectedApi = isProtectedApi(request.nextUrl.pathname);

  // Origin verification for state-changing methods. Cookie-authenticated API
  // requests without an Origin are rejected; mobile/API clients must use a
  // verified Bearer token.
  if (request.method !== 'GET' && request.method !== 'HEAD' && origin) {
    const isSameOrigin = origin === requestOrigin;
    const isAllowedOrigin = configuredOrigins.includes(origin);
    if (!isSameOrigin && !isAllowedOrigin) {
      return new NextResponse('Invalid origin', { status: 403 });
    }
  } else if (
    protectedApi &&
    !['GET', 'HEAD'].includes(request.method) &&
    !request.headers.get('authorization')
  ) {
    return new NextResponse('Origin or bearer authentication required', { status: 403 });
  }

  if (request.method === 'OPTIONS') {
    if (!origin || (!configuredOrigins.includes(origin) && origin !== requestOrigin)) {
      return new NextResponse('Invalid origin', { status: 403 });
    }
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Max-Age': '600',
        Vary: 'Origin',
      },
    });
  }

  const response = NextResponse.next();

  if (protectedApi) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key || url.includes('placeholder') || key.includes('placeholder')) {
      return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 });
    }

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: cookiesToSet => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });
    const token = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') || '')?.[1];
    const { data: { user }, error } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Correlation and performance tracking headers
  const requestId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `req-${Date.now()}`;
  response.headers.set('X-Request-ID', requestId);
  const duration = Date.now() - startTime;
  response.headers.set('X-Response-Time', `${duration}ms`);

  if (currentRateCheck) {
    response.headers.set('X-RateLimit-Limit', String(currentRateCheck.limit));
    response.headers.set('X-RateLimit-Remaining', String(currentRateCheck.remaining));
    response.headers.set('X-RateLimit-Reset', String(currentRateCheck.reset));
  }

  if (origin && configuredOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.append('Vary', 'Origin');
  }

  // Enterprise Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');

  // Content Security Policy
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://app.posthog.com https://us.i.posthog.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://res.cloudinary.com https://*.stripe.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://app.posthog.com https://us.i.posthog.com https://*.sentry.io https://api.openai.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
  response.headers.set('Content-Security-Policy', cspHeader);

  if (duration > 1000) {
    console.warn(`[Slow Request] ${request.method} ${request.nextUrl.pathname} took ${duration}ms (ID: ${requestId})`);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
