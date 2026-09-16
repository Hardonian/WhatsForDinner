import { withTelemetry } from '@/lib/telemetry/api-middleware';

export const runtime="edge";

async function handler(req: NextRequest) {
  const body = await req.text();
  const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ingest-telemetry`, {
    method: "POST", headers: { "content-type":"application/json","authorization":`Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` }, body
  });
  return new NextResponse(await r.text(), { status: r.status, headers: { "content-type":"application/json" } });
}

export const POST = withTelemetry(handler);

export const dynamic = "force-dynamic";
