import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract and anonymize data
    const {
      url,
      ttfb,
      lcp,
      cls,
      fid,
      fcp,
      ts,
      userAgent,
      connectionType,
      ...rest
    } = body;

    // Anonymize URL (remove query params and user-specific paths)
    const anonymizedUrl = url
      ? url.split('?')[0].replace(/\/[a-f0-9-]{36}/g, '/[id]')
      : null;

    // Prepare metric payload
    const metric = {
      url: anonymizedUrl,
      TTFB: ttfb || null,
      LCP: lcp || null,
      CLS: cls || null,
      FID: fid || null,
      FCP: fcp || null,
      connectionType: connectionType || null,
      userAgent: userAgent
        ? userAgent.replace(/\(.*?\)/g, '(***)').substring(0, 100)
        : null,
      ...rest,
    };

    // Insert into metrics_log
    const { error } = await supabase.from('metrics_log').insert({
      source: 'telemetry',
      metric,
      ts: ts ? new Date(ts).toISOString() : new Date().toISOString(),
    });

    if (error) {
      logger.error('Telemetry insert error:', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    logger.error('Telemetry endpoint error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export const dynamic = "force-dynamic";
