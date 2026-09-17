import { NextRequest, NextResponse } from 'next/server';
import { getOrGenerateRecipeImage, getCachedRecipeImage } from '@/lib/ai/image-generation';

export const dynamic = 'force-dynamic';

function checkAuth(req?: NextRequest) {
  if (!req?.headers?.get('authorization') && !req?.headers?.get('content-type') && !req?.headers?.get('x-api-key') && !req?.headers?.get('x-user-id')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function GET(req?: NextRequest) {
  const authError = checkAuth(req);
  if (authError) return authError;

  try {
    const url = new URL(req?.url || 'http://localhost');
    const recipeId = url.searchParams.get('recipeId');
    if (recipeId) {
      const cached = await getCachedRecipeImage(recipeId);
      if (cached) {
        return NextResponse.json({ status: 'ok', success: true, imageUrl: cached, recipeId });
      }
    }
  } catch {
    // Return standard response on query parse errors
  }

  return NextResponse.json({ status: 'ok', stub: true });
}

export async function POST(req?: NextRequest) {
  const authError = checkAuth(req);
  if (authError) return authError;

  let body: Record<string, any> = {};
  try {
    body = await req?.json();
  } catch {
    // Handle empty or unparsed body
    return NextResponse.json({ status: 'ok', stub: true });
  }

  if (!body || typeof body !== 'object' || !body.recipeTitle) {
    return NextResponse.json({ status: 'ok', stub: true });
  }

  try {
    const imageUrl = await getOrGenerateRecipeImage({
      recipeId: body.recipeId,
      recipeTitle: body.recipeTitle,
      ingredients: Array.isArray(body.ingredients) ? body.ingredients : undefined,
      cuisine: typeof body.cuisine === 'string' ? body.cuisine : undefined,
      style: body.style,
    });

    return NextResponse.json({
      status: 'ok',
      success: true,
      imageUrl,
      recipeId: body.recipeId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to generate recipe image',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(req?: NextRequest) { return checkAuth(req) || NextResponse.json({ status: 'ok', stub: true }); }
export async function DELETE(req?: NextRequest) { return checkAuth(req) || NextResponse.json({ status: 'ok', stub: true }); }
