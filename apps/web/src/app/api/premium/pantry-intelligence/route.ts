import { z } from 'zod';

const PantryItemsSchema = z.array(z.object({
  id: z.string().optional(),
  ingredient: z.string(),
  quantity: z.number(),
  unit: z.string().optional(),
  expirationDate: z.string().optional(),
  category: z.string().optional(),
  addedDate: z.string().optional(),
}));

const ExpiringItemsSchema = z.object({
  items: PantryItemsSchema,
  daysThreshold: z.number().optional(),
});

const WasteReductionSchema = z.object({
  allItems: PantryItemsSchema,
  usedItems: PantryItemsSchema,
});

export async function POST(req: NextRequest) {
  try {
    const tenantResult = await getTenantContext(req);
    if (!tenantResult.success) {
      return tenantResult.response;
    }

    const body = await req.json();
    const { action, ...data } = body;

    if (action === 'expiring') {
      const { items, daysThreshold = 3 } = ExpiringItemsSchema.parse(data);
      const expiringItems = getExpiringItems(items, daysThreshold);
      
      return NextResponse.json({ expiringItems });
    }

    if (action === 'use-soon') {
      const { items, daysThreshold = 3 } = ExpiringItemsSchema.parse(data);
      const useSoonItems = getUseSoonItems(items, daysThreshold);
      
      return NextResponse.json({ useSoonItems });
    }

    if (action === 'suggest-recipes') {
      const { items, daysThreshold = 3 } = ExpiringItemsSchema.parse(data);
      const expiringItems = getExpiringItems(items, daysThreshold);
      const suggestions = suggestRecipesForExpiringItems(expiringItems);
      
      return NextResponse.json({ suggestions });
    }

    if (action === 'waste-reduction') {
      const { allItems, usedItems } = WasteReductionSchema.parse(data);
      const metrics = calculateWasteReduction(allItems, usedItems);
      
      return NextResponse.json({ metrics });
    }

    if (action === 'estimate-expiration') {
      const { ingredient, addedDate } = z.object({
        ingredient: z.string(),
        addedDate: z.string().optional(),
      }).parse(data);
      
      const expirationDate = estimateExpirationDate(ingredient, addedDate);
      
      return NextResponse.json({ expirationDate });
    }

    if (action === 'efficiency-score') {
      const { allItems, usedItems } = WasteReductionSchema.parse(data);
      const score = getPantryEfficiencyScore(allItems, usedItems);
      
      return NextResponse.json({ score });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    // Error handled: Error processing pantry intelligence:
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process pantry intelligence' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
