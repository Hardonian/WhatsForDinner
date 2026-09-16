import { withCSRFProtection } from '@/lib/csrf-middleware';

const IngredientNutritionSchema = z.object({
  ingredient: z.string(),
  amount: z.number().optional(),
  unit: z.string().optional(),
});

const RecipeNutritionSchema = z.object({
  ingredients: z.array(z.object({
    name: z.string(),
    amount: z.number().optional(),
    unit: z.string().optional(),
  })),
});

async function handler(req: NextRequest) {
  try {
    const tenantResult = await getTenantContext(req);
    if (!tenantResult.success) {
      return tenantResult.response;
    }

    const body = await req.json();
    const { type, ...data } = body;

    if (type === 'ingredient') {
      const { ingredient, amount, unit } = IngredientNutritionSchema.parse(data);
      const nutrition = await getIngredientNutrition(ingredient, amount, unit);
      
      if (!nutrition) {
        return NextResponse.json(
          { error: 'Nutrition data not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        nutrition,
        verified: isNutritionVerified(nutrition),
      });
    }

    if (type === 'recipe') {
      const { ingredients } = RecipeNutritionSchema.parse(data);
      const nutrition = await getRecipeNutrition(ingredients);
      
      return NextResponse.json({
        nutrition,
        verified: isNutritionVerified(nutrition),
      });
    }

    return NextResponse.json(
      { error: 'Invalid type. Use "ingredient" or "recipe"' },
      { status: 400 }
    );
  } catch (error) {
    // Error handled: Error fetching nutrition:
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch nutrition data' },
      { status: 500 }
    );
  }
}

export const POST = (req: NextRequest) => withCSRFProtection(handler, req);

export const dynamic = "force-dynamic";
