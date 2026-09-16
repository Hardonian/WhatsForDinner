import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('grocery-cart-api');

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { storeId, items } = body;

    if (!storeId || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'storeId and items array required' },
        { status: 400 }
      );
    }

    await groceryManager.initialize();

    const cartItems: GroceryCartItem[] = items.map((item: any) => ({
      productId: item.productId,
      product: item.product,
      quantity: item.quantity || 1,
      unitPrice: item.product.price || 0,
      totalPrice: (item.product.price || 0) * (item.quantity || 1),
      notes: item.notes,
    }));

    const cart = await groceryManager.addToCart(storeId, cartItems);
    cart.userId = user.id;

    // Award points
    // await groceryGamification.awardPoints(user.id, 'ADD_TO_CART');

    return NextResponse.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    _logger.error('Grocery cart API error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: 'Failed to add to cart' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
