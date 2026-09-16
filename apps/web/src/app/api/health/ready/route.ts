import { createReadinessHandler } from '@whats-for-dinner/utils';

export async function GET() {
  try {
    const response = await createReadinessHandler();
    const data = JSON.parse(await response.text());
    
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'not-ready',
        timestamp: new Date().toISOString(),
        error: 'Readiness check failed',
      },
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export const dynamic = "force-dynamic";
