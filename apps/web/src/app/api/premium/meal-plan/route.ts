import { withCSRFProtection } from '@/lib/csrf-middleware';

const GenerateMealPlanSchema = z.object({
  pantryItems: z.array(z.string()),
  preferences: z.object({
    dietaryRestrictions: z.array(z.string()).optional(),
    cuisinePreferences: z.array(z.string()).optional(),
    mealPrepDay: z.enum(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']).optional(),
    familySize: z.number().optional(),
    maxPrepTime: z.number().optional(),
    budget: z.number().optional(),
  }).optional(),
});

async function handler(req: NextRequest) {
  try {
    const tenantResult = await getTenantContext(req);
    if (!tenantResult.success) {
      return tenantResult.response;
    }

    const body = await req.json();
    const { pantryItems, preferences = {} } = GenerateMealPlanSchema.parse(body);

    const mealPlan = await generateWeeklyMealPlan(
      pantryItems,
      preferences as MealPlanPreferences,
      async (ingredients: string[], prefs: string) => {
        return await generateRecipesWithFallback({
          ingredients,
          preferences: prefs,
          maxRetries: 3,
          retryDelay: 1000,
        });
      }
    );

    return NextResponse.json({ mealPlan });
  } catch (error) {
    // Error handled: Error generating meal plan:
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate meal plan' },
      { status: 500 }
    );
  }
}

export const POST = (req: NextRequest) => withCSRFProtection(handler, req);

export const dynamic = "force-dynamic";
