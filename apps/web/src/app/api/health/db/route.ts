import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  const start = Date.now();
  
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Database credentials not configured',
        responseTime: Date.now() - start,
      }, { status: 503 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Test database connection with a simple query
    const dbStart = Date.now();
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    const queryDuration = Date.now() - dbStart;
    const responseTime = Date.now() - start;
    
    if (error) {
      return NextResponse.json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        queryDuration,
        responseTime,
      }, { status: 503 });
    }
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        queryDuration,
      },
      responseTime,
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - start,
    }, { status: 503 });
  }
}

export const dynamic = "force-dynamic";
