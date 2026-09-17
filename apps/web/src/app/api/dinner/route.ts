import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/auth-middleware';
import { suggestionCache } from '@/lib/cache';
import { aiOptimization } from '@/lib/aiOptimization';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    if (!body || !body.ingredients || !Array.isArray(body.ingredients) || body.ingredients.length === 0) {
      return NextResponse.json({ error: 'Empty pantry' }, { status: 400 });
    }

    const tenantResult = await getTenantContext(req);
    if (!tenantResult || (tenantResult as any).success === false) {
      return (tenantResult as any)?.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cached = suggestionCache.get(body.ingredients as any);
    if (cached) {
      return NextResponse.json(cached);
    }

    const optimized = await aiOptimization.getOptimizedResponse(body);
    return NextResponse.json(optimized?.response || { recipes: [] });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() { return NextResponse.json({ status: 'ok', stub: true }); }
export async function PUT() { return NextResponse.json({ status: 'ok', stub: true }); }
export async function DELETE() { return NextResponse.json({ status: 'ok', stub: true }); }
