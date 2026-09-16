import { z } from 'zod';

const IngredientCostSchema = z.object({
  ingredient: z.string(),
  quantity: z.number().optional(),
  unit: z.string().optional(),
});

const RecipeCostSchema = z.object({
  ingredients: z.array(z.string()),
  servings: z.number().optional(),
});

const CompareRecipesSchema = z.object({
  recipes: z.array(z.object({
    title: z.string(),
    ingredients: z.array(z.string()),
  })),
});

export async function POST(req: NextRequest) {
  try {
    const tenantResult = await getTenantContext(req);
    if (!tenantResult.success) {
      return tenantResult.response;
    }

    const body = await req.json();
    const { type, ...data } = body;

    if (type === 'ingredient') {
      const { ingredient, quantity = 1, unit } = IngredientCostSchema.parse(data);
      const cost = await getIngredientPrice(ingredient, quantity, unit);
      
      return NextResponse.json({ cost });
    }

    if (type === 'recipe') {
      const { ingredients, servings = 4 } = RecipeCostSchema.parse(data);
      const totalCost = await getRecipeCost({ ingredients });
      const costPerServing = await getCostPerServing({ ingredients }, servings);
      const savings = calculateSavingsVsEatingOut(costPerServing);
      
      return NextResponse.json({
        totalCost,
        costPerServing,
        savings,
      });
    }

    if (type === 'compare') {
      const { recipes } = CompareRecipesSchema.parse(data);
      const comparisons = await compareRecipeCosts(recipes);
      
      return NextResponse.json({ comparisons });
    }

    return NextResponse.json(
      { error: 'Invalid type. Use "ingredient", "recipe", or "compare"' },
      { status: 400 }
    );
  } catch (error) {
    // Error handled: Error calculating cost:
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to calculate cost' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
