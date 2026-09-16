import { getIngredientNutrition, getRecipeNutrition } from '@/lib/services/nutrition-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ingredients, ingredient } = body;

    if (type === 'ingredient' && ingredient) {
      const nutrition = await getIngredientNutrition(ingredient.name, ingredient.amount, ingredient.unit);
      return NextResponse.json({ nutrition });
    }

    if (type === 'recipe' && ingredients) {
      const nutrition = await getRecipeNutrition(ingredients);
      return NextResponse.json({ nutrition });
    }

    return NextResponse.json(
      { error: 'Invalid request. Provide type and ingredients or ingredient.' },
      { status: 400 }
    );
  } catch (error) {
    // Error handled: Nutrition API error:
    return NextResponse.json(
      { error: error.message || 'Failed to get nutrition data' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
