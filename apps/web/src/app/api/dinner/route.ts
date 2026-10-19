import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/auth-middleware';
import { suggestionCache } from '@/lib/cache';
import { aiOptimization } from '@/lib/aiOptimization';
import { llmGuardrails } from '@whats-for-dinner/server/security/llm-guardrails';

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

    // Input sanitization & safety guardrails
    const sanitizedIngredients = body.ingredients
      .filter((ing: unknown) => typeof ing === 'string' && ing.trim().length > 0)
      .map((ing: string) => llmGuardrails.sanitizePrompt(ing.trim()));

    if (sanitizedIngredients.length === 0) {
      return NextResponse.json({ error: 'Empty pantry' }, { status: 400 });
    }
    body.ingredients = sanitizedIngredients;

    // Cache lookup
    const cached = suggestionCache.get(body.ingredients as any);
    if (cached) {
      return NextResponse.json(cached);
    }

    // AI Generation
    const optimized = await (aiOptimization as any).getOptimizedResponse(body);
    const result = optimized?.response || { recipes: [] };

    // Post-generation Allergen Scanning
    const declaredAllergies: string[] = Array.isArray(body.allergies)
      ? body.allergies
      : Array.isArray((tenantResult as any)?.user?.allergies)
        ? (tenantResult as any).user.allergies
        : [];

    if (declaredAllergies.length > 0 && Array.isArray(result.recipes)) {
      result.recipes = result.recipes.map((recipe: any) => {
        const recipeIngredients: string[] = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
        const scan = llmGuardrails.scanAllergens(recipeIngredients, declaredAllergies);
        return {
          ...recipe,
          allergenSafety: {
            safe: scan.safe,
            detectedAllergens: scan.violations,
            violations: scan.violations,
          },
        };
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}

function methodNotAllowed() {
  return new NextResponse(JSON.stringify({ error: 'Method Not Allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: 'POST' },
  });
}

export async function GET() { return methodNotAllowed(); }
export async function PUT() { return methodNotAllowed(); }
export async function DELETE() { return methodNotAllowed(); }

