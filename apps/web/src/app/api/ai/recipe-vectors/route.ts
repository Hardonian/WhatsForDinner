import { NextRequest, NextResponse } from 'next/server';
import { recipeVectorStore } from '@/lib/ai/recipe-vector-db';
import { generateGroundedRecipeWithRAG } from '@/lib/ai/recipe-rag-pipeline';

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

export async function GET(req?: NextRequest) {
  const authErr = checkAuth(req);
  if (authErr) return authErr;

  const url = new URL(req?.url || 'http://localhost/api/ai/recipe-vectors');
  const query = url.searchParams.get('query') || '';
  const pantry = url.searchParams.get('pantry')?.split(',').map(s => s.trim()).filter(Boolean) || [];
  const cuisine = url.searchParams.get('cuisine') || undefined;
  const diet = url.searchParams.get('diet')?.split(',').map(s => s.trim()).filter(Boolean) || [];
  const topK = parseInt(url.searchParams.get('topK') || '5');

  const results = recipeVectorStore.search({
    queryText: query,
    pantryItems: pantry,
    targetCuisine: cuisine,
    dietaryRestrictions: diet,
    topK,
  });

  return NextResponse.json({
    success: true,
    totalIndexedRecipes: recipeVectorStore.getAll().length,
    vectorDimension: 64,
    query,
    resultsCount: results.length,
    results,
  });
}

export async function POST(req?: NextRequest) {
  const authErr = checkAuth(req);
  if (authErr) return authErr;

  let body: any = {};
  if (req) {
    try {
      const text = await req.text();
      if (text && text.trim().length > 0) {
        body = JSON.parse(text);
      }
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
  }

  const { action = 'generate_rag', query, pantryItems, dietaryRestrictions, cuisine, recipeToIngest } = body;

  if (action === 'ingest' && recipeToIngest) {
    recipeVectorStore.insert(recipeToIngest);
    return NextResponse.json({
      success: true,
      message: `Recipe "${recipeToIngest.title}" ingested into vector database.`,
      indexedCount: recipeVectorStore.getAll().length,
    });
  }

  // Run RAG grounded recipe generation
  const groundedRecipe = await generateGroundedRecipeWithRAG({
    query,
    pantryItems,
    dietaryRestrictions,
    cuisine,
    servings: body.servings || 2,
    mood: body.mood,
  });

  return NextResponse.json({
    success: true,
    recipe: groundedRecipe,
  });
}
