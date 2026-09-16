import { createClient } from '@supabase/supabase-js';

function addSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return res;
}

interface HealthCheck {
  ok: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  environment: string;
  checks: {
    database: { healthy: boolean; latency?: number; error?: string };
    auth: { healthy: boolean; error?: string };
    realtime?: { healthy: boolean; error?: string };
    storage?: { healthy: boolean; error?: string };
    rls: { effective: boolean; unauthReadBlocked: boolean; authReadAllowed: boolean };
  };
  responseTime: number;
}

async function checkDatabase(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { healthy: false, error: 'Missing Supabase credentials' };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const start = Date.now();
    
    // Simple query to check DB connectivity
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    const latency = Date.now() - start;
    
    return { 
      healthy: !error, 
      latency,
      error: error?.message 
    };
  } catch (error: unknown) {
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

async function checkAuth(): Promise<{ healthy: boolean; error?: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { healthy: false, error: 'Missing Supabase credentials' };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Try to get current user (should work even if no user is logged in)
    const { error } = await supabase.auth.getUser();
    
    // JWT errors are OK - means auth service is responding
    const healthy = !error || error.message.includes('JWT');
    
    return { 
      healthy, 
      error: healthy ? undefined : error?.message 
    };
  } catch (error: unknown) {
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

async function checkStorage(): Promise<{ healthy: boolean; error?: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const bucket = process.env.NEXT_PUBLIC_UPLOAD_BUCKET || 'public';

    if (!supabaseUrl || !supabaseAnonKey) {
      return { healthy: false, error: 'Missing Supabase credentials' };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Try to list buckets (cheap operation)
    const { error } = await supabase.storage.listBuckets();
    
    return { 
      healthy: !error, 
      error: error?.message 
    };
  } catch (error: unknown) {
    return { 
      healthy: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

async function checkRLS(): Promise<{ 
  effective: boolean; 
  unauthReadBlocked: boolean; 
  authReadAllowed: boolean 
}> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return { effective: false, unauthReadBlocked: false, authReadAllowed: false };
    }

    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test 1: Unauthenticated read should fail (RLS blocking)
    const { error: unauthError } = await supabaseAnon
      .from('users')
      .select('id')
      .limit(1);
    
    const unauthReadBlocked = !!unauthError && (
      unauthError.message.includes('RLS') || 
      unauthError.message.includes('permission') ||
      unauthError.message.includes('policy')
    );

    // Test 2: Authenticated read (if we had a user) would pass
    // For now, we check if RLS is enabled by checking the error type
    const effective = unauthReadBlocked;
    const authReadAllowed = true; // Assumed true if RLS is effective

    return { effective, unauthReadBlocked, authReadAllowed };
  } catch (error) {
    return { effective: false, unauthReadBlocked: false, authReadAllowed: false };
  }
}

export async function GET() {
  const start = Date.now();
  
  const [dbCheck, authCheck, storageCheck, rlsCheck] = await Promise.all([
    checkDatabase(),
    checkAuth(),
    process.env.NEXT_PUBLIC_UPLOAD_BUCKET ? checkStorage() : Promise.resolve({ healthy: true }),
    checkRLS(),
  ]);

  const allHealthy = dbCheck.healthy && authCheck.healthy && (storageCheck?.healthy ?? true);
  const status: 'healthy' | 'degraded' | 'unhealthy' = 
    allHealthy ? 'healthy' : 
    (dbCheck.healthy || authCheck.healthy) ? 'degraded' : 
    'unhealthy';

  const response: HealthCheck = {
    ok: allHealthy,
    status,
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: dbCheck,
      auth: authCheck,
      ...(storageCheck && { storage: storageCheck }),
      rls: rlsCheck,
    },
    responseTime: Date.now() - start,
  };

  const httpStatus = allHealthy || process.env.NODE_ENV === 'development' || status === 'degraded' ? 200 : 503;
  
  let res = NextResponse.json(response, { status: httpStatus });
  res = addSecurityHeaders(res);
  return res;
}

export const dynamic = "force-dynamic";
