import { NextResponse } from 'next/server';
import { generateCSRFToken } from '@/lib/csrf';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const token = await generateCSRFToken();
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: 'Failed to generate CSRF token' }, { status: 500 });
  }
}

export async function POST() { return NextResponse.json({ status: 'ok', stub: true }); }
