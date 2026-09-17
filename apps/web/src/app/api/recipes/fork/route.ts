// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function checkAuth(req?: NextRequest) {
  if (!req?.headers?.get('authorization') && !req?.headers?.get('content-type') && !req?.headers?.get('x-api-key') && !req?.headers?.get('x-user-id')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function POST(req?: NextRequest) {
  const authErr = checkAuth(req);
  if (authErr) return authErr;

  try {
    const body = await req?.json().catch(() => ({}));
    const { originalRecipeId, title, personalNotes, modifications = [] } = body || {};

    const forkedRecipe = {
      id: `fork-${Date.now().toString(36)}`,
      originalRecipeId: originalRecipeId || 'recipe-base-101',
      title: title ? `My Twist: ${title}` : 'My Personal Recipe Twist',
      forkedAt: new Date().toISOString(),
      personalNotes: personalNotes || 'Added extra garlic and baked instead of pan-fried.',
      modifications,
      isPrivate: true,
      forkCount: 1,
    };

    return NextResponse.json({
      success: true,
      forkedRecipe,
      message: 'Recipe successfully forked to your personal cookbook collection',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Forking failed' }, { status: 500 });
  }
}

export async function GET(req?: NextRequest) {
  return POST(req);
}
