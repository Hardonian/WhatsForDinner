import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest){
  // proxy to Supabase Edge Function (avoids exposing service key)
  const body = await req.text();
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json(
      { error: "Supabase configuration missing" },
      { status: 500 }
    );
  }

  const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ingest-events`, {
    method: "POST",
    headers: { 
      "content-type": "application/json", 
      "authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` 
    },
    body
  });

  return new NextResponse(await r.text(), { 
    status: r.status, 
    headers: { "content-type": "application/json" } 
  });
}

export const dynamic = "force-dynamic";
