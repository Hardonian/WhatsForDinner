import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('grocery-cart-export-api');

const GroceryItemEntry = z.union([
  z.string().min(1),
  z.object({
    name: z.string().min(1),
    amount: z.string().optional(),
    unit: z.string().optional(),
  }),
]);

const CartExportSchema = z.object({
  items: z.array(GroceryItemEntry).min(1).max(50).optional(),
  ingredients: z.array(GroceryItemEntry).min(1).max(50).optional(),
  retailer: z.enum(['instacart', 'amazon_fresh', 'walmart', 'kroger', 'all']).optional().default('instacart'),
  postalCode: z.string().optional().default('94105'),
  recipeTitle: z.string().optional(),
}).refine(data => (data.items && data.items.length > 0) || (data.ingredients && data.ingredients.length > 0), {
  message: 'At least one item or ingredient is required',
});

interface RetailerLink {
  name: string;
  id: string;
  cartUrl: string;
  logo: string;
  estimatedTotal: number;
  deliveryTime: string;
  affiliateTag: string;
}

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const parseResult = CartExportSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const rawItems = parseResult.data.items || parseResult.data.ingredients || [];
    const items = rawItems.map(item => typeof item === 'string' ? item : item.name);
    const { retailer, postalCode, recipeTitle } = parseResult.data;
    _logger.info('Generating grocery cart export', { itemCount: items.length, retailer, recipeTitle });

    // Build retailer deep-links with affiliate attribution
    const encodedQuery = encodeURIComponent(items.join(' '));
    const encodedList = items.map((item) => encodeURIComponent(item.trim())).join(',');

    const retailerConfigs: Record<string, RetailerLink> = {
      instacart: {
        name: 'Instacart',
        id: 'instacart',
        cartUrl: `https://www.instacart.com/store/partner_recipe?title=${encodeURIComponent(recipeTitle || 'WhatsForDinner Recipe')}&ingredients=${encodedList}&partner=whatsfordinner&utm_source=whatsfordinner&utm_medium=affiliate`,
        logo: '🛒',
        estimatedTotal: Number((items.length * 3.49).toFixed(2)),
        deliveryTime: 'Within 2 hours',
        affiliateTag: 'whatsfordinner-ic',
      },
      amazon_fresh: {
        name: 'Amazon Fresh',
        id: 'amazon_fresh',
        cartUrl: `https://www.amazon.com/afx/ingredients/cart?ingredients=${encodedList}&tag=whatsfordinner-20&utm_source=whatsfordinner`,
        logo: '📦',
        estimatedTotal: Number((items.length * 3.19).toFixed(2)),
        deliveryTime: 'Same-day delivery',
        affiliateTag: 'whatsfordinner-20',
      },
      walmart: {
        name: 'Walmart Grocery',
        id: 'walmart',
        cartUrl: `https://www.walmart.com/search?q=${encodedQuery}&facet=pickup_and_delivery&affil_id=whatsfordinner`,
        logo: '🏪',
        estimatedTotal: Number((items.length * 2.89).toFixed(2)),
        deliveryTime: 'Curbside or Delivery',
        affiliateTag: 'whatsfordinner-wm',
      },
      kroger: {
        name: 'Kroger Delivery',
        id: 'kroger',
        cartUrl: `https://www.kroger.com/search?query=${encodedQuery}&searchType=natural&affil=whatsfordinner`,
        logo: '🥑',
        estimatedTotal: Number((items.length * 3.29).toFixed(2)),
        deliveryTime: 'Same-day delivery',
        affiliateTag: 'whatsfordinner-kr',
      },
    };

    const targetRetailers = retailer === 'all'
      ? Object.values(retailerConfigs)
      : [retailerConfigs[retailer] || retailerConfigs.instacart];

    return NextResponse.json({
      success: true,
      itemCount: items.length,
      items,
      postalCode,
      recipeTitle: recipeTitle || null,
      retailers: targetRetailers,
      primaryRetailer: targetRetailers[0],
      monetization: {
        commissionRate: '3% - 5%',
        attributionActive: true,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    _logger.error('Grocery cart export failed', { error: message });
    return NextResponse.json(
      { error: 'Failed to export grocery cart' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'grocery-cart-export-api',
    supportedRetailers: ['instacart', 'amazon_fresh', 'walmart', 'kroger'],
  });
}

export const dynamic = "force-dynamic";
