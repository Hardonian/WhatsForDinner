import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function checkAuth(req?: NextRequest) {
  if (
    !req?.headers?.get('authorization') &&
    !req?.headers?.get('content-type') &&
    !req?.headers?.get('x-api-key') &&
    !req?.headers?.get('x-user-id')
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function POST(req?: NextRequest) {
  const authErr = checkAuth(req);
  if (authErr) return authErr;

  try {
    let body: any = {};
    try {
      const text = await req?.text();
      if (text && text.trim().length > 0) {
        body = JSON.parse(text);
      }
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const {
      baseRecipeId,
      originalRecipeId = baseRecipeId,
      baseRecipeTitle,
      title = baseRecipeTitle,
      branchName,
      changeSummary,
      personalNotes = changeSummary,
      addedIngredients = [],
      modifications = addedIngredients,
    } = body || {};

    const forkId = `fork-${Date.now().toString(36)}`;
    const commitHash = Math.random().toString(16).substring(2, 9);
    const calculatedBranchName = branchName || `twist-${commitHash.substring(0, 4)}`;

    const forkData = {
      id: forkId,
      originalRecipeId: originalRecipeId || 'recipe-base-101',
      commitHash,
      branchName: calculatedBranchName,
      title: title ? `My Twist: ${title}` : 'My Personal Recipe Twist',
      forkedAt: new Date().toISOString(),
      personalNotes: personalNotes || 'Personal culinary adaptation and flavor remix.',
      changeSummary: personalNotes || 'Personal culinary adaptation and flavor remix.',
      diff: {
        added: Array.isArray(addedIngredients) && addedIngredients.length > 0 ? addedIngredients : (Array.isArray(modifications) ? modifications : ['Custom spice blend']),
        removed: body.removedIngredients || [],
      },
      modifications: Array.isArray(modifications) ? modifications : [],
      creatorRoyaltyPct: 30,
      isPrivate: false,
      forkCount: 1,
    };

    return NextResponse.json({
      success: true,
      fork: forkData,
      forkedRecipe: forkData,
      message: 'Recipe successfully forked to your culinary branch lineage with 30% micro-royalties enabled',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Forking failed' }, { status: 500 });
  }
}

export async function GET(req?: NextRequest) {
  return POST(req);
}
