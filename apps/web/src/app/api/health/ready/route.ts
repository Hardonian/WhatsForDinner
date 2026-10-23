import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function isConfigured(value: string | undefined, placeholder: string): boolean {
  return Boolean(value) && !value.includes(placeholder);
}

/**
 * Readiness is intentionally public so deployment platforms can use it. It
 * validates boot-time configuration without making an expensive or privileged
 * database request on every probe. Deep dependency status is provided by the
 * authenticated comprehensive endpoint.
 */
export async function GET() {
  const configuredDependencies = {
    supabase: isConfigured(process.env.NEXT_PUBLIC_SUPABASE_URL, 'placeholder.supabase.co'),
    openai: Boolean(process.env.OPENAI_API_KEY),
  };

  return NextResponse.json(
    {
      status: 'ready',
      service: 'web',
      timestamp: new Date().toISOString(),
      checks: {
        application: 'ok',
        configuration: configuredDependencies,
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
