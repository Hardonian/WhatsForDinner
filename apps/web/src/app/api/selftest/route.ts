import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  const start = Date.now();
  const results = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    tests: [] as Array<{
      name: string;
      status: 'pass' | 'fail';
      duration: number;
      error?: string;
      details?: any;
    }>
  };

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Missing required environment variables'
    }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Test 1: Database connectivity
  const test1Start = Date.now();
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    const duration = Date.now() - test1Start;
    results.tests.push({
      name: 'Database Connectivity',
      status: error ? 'fail' : 'pass',
      duration,
      error: error?.message,
      details: { rowCount: data?.length || 0 }
    });
  } catch (err) {
    const duration = Date.now() - test1Start;
    results.tests.push({
      name: 'Database Connectivity',
      status: 'fail',
      duration,
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }

  // Test 2: RLS Read Test (should work with service role)
  const test2Start = Date.now();
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name')
      .limit(5);
    
    const duration = Date.now() - test2Start;
    results.tests.push({
      name: 'RLS Read Test (Service Role)',
      status: error ? 'fail' : 'pass',
      duration,
      error: error?.message,
      details: { rowCount: data?.length || 0 }
    });
  } catch (err) {
    const duration = Date.now() - test2Start;
    results.tests.push({
      name: 'RLS Read Test (Service Role)',
      status: 'fail',
      duration,
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }

  // Test 3: RLS Write Test (should work with service role)
  const test3Start = Date.now();
  try {
    const testData = {
      user_id: 'test-user-' + Date.now(),
      action: 'selftest',
      tokens_used: 0,
      cost_usd: 0,
      model_used: 'test',
      metadata: { test: true }
    };
    
    const { data, error } = await supabase
      .from('usage_logs')
      .insert(testData)
      .select();
    
    const duration = Date.now() - test3Start;
    
    // Clean up test data
    if (data?.[0]?.id) {
      await supabase.from('usage_logs').delete().eq('id', data[0].id);
    }
    
    results.tests.push({
      name: 'RLS Write Test (Service Role)',
      status: error ? 'fail' : 'pass',
      duration,
      error: error?.message,
      details: { inserted: data?.length || 0 }
    });
  } catch (err) {
    const duration = Date.now() - test3Start;
    results.tests.push({
      name: 'RLS Write Test (Service Role)',
      status: 'fail',
      duration,
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }

  // Test 4: Performance Test (simple query)
  const test4Start = Date.now();
  try {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('event_type, count(*)')
      .group('event_type')
      .limit(10);
    
    const duration = Date.now() - test4Start;
    results.tests.push({
      name: 'Performance Test (Aggregate Query)',
      status: error ? 'fail' : 'pass',
      duration,
      error: error?.message,
      details: { 
        rowCount: data?.length || 0,
        performance: duration < 300 ? 'good' : duration < 500 ? 'acceptable' : 'slow'
      }
    });
  } catch (err) {
    const duration = Date.now() - test4Start;
    results.tests.push({
      name: 'Performance Test (Aggregate Query)',
      status: 'fail',
      duration,
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }

  // Determine overall status
  const failedTests = results.tests.filter(t => t.status === 'fail');
  if (failedTests.length > 0) {
    results.status = 'unhealthy';
  }

  const totalDuration = Date.now() - start;
  results.responseTime = totalDuration;

  return NextResponse.json(results, {
    status: results.status === 'healthy' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}

export const dynamic = "force-dynamic";