// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function checkAuth(req?: NextRequest) {
  if (!req?.headers?.get('authorization') && !req?.headers?.get('content-type') && !req?.headers?.get('x-api-key') && !req?.headers?.get('x-user-id')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

interface CartItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  checked: boolean;
  estimatedPrice: number;
  recipeSource?: string;
}

// In-memory cart store per tenant/user
const carts = new Map<string, CartItem[]>();

const DEFAULT_CART_ITEMS: CartItem[] = [
  { id: 'item-1', name: 'Atlantic Salmon Fillets', quantity: 2, unit: 'lbs', category: 'Meat & Seafood', checked: false, estimatedPrice: 18.99, recipeSource: 'Crispy Honey Mustard Salmon' },
  { id: 'item-2', name: 'Fresh Baby Spinach', quantity: 1, unit: 'bag (10oz)', category: 'Produce', checked: false, estimatedPrice: 3.49, recipeSource: 'Tuscan Gnocchi' },
  { id: 'item-3', name: 'Potato Gnocchi', quantity: 2, unit: 'packages (16oz)', category: 'Pasta & Grains', checked: true, estimatedPrice: 5.98, recipeSource: 'Tuscan Gnocchi' },
  { id: 'item-4', name: 'Sun-Dried Tomatoes in Olive Oil', quantity: 1, unit: 'jar (8oz)', category: 'Pantry', checked: false, estimatedPrice: 4.29, recipeSource: 'Tuscan Gnocchi' },
  { id: 'item-5', name: 'Heavy Whipping Cream', quantity: 1, unit: 'pint', category: 'Dairy', checked: true, estimatedPrice: 2.99, recipeSource: 'Tuscan Gnocchi' },
  { id: 'item-6', name: 'Fresh Garlic Bulb', quantity: 1, unit: 'head', category: 'Produce', checked: false, estimatedPrice: 0.89, recipeSource: 'Garlic Butter Steak Bites' },
];

export async function GET(req?: NextRequest) {
  const authErr = checkAuth(req);
  if (authErr) return authErr;

  const userId = req?.headers?.get('x-user-id') || 'default_user';
  let items = carts.get(userId);
  if (!items) {
    items = [...DEFAULT_CART_ITEMS];
    carts.set(userId, items);
  }

  const subtotal = items.reduce((sum, item) => sum + (item.checked ? 0 : item.estimatedPrice), 0);
  const totalItems = items.length;
  const uncheckedCount = items.filter(i => !i.checked).length;

  return NextResponse.json({
    success: true,
    items,
    summary: {
      totalItems,
      uncheckedCount,
      estimatedSubtotal: parseFloat(subtotal.toFixed(2)),
      currency: 'USD',
    },
  });
}

export async function POST(req?: NextRequest) {
  const authErr = checkAuth(req);
  if (authErr) return authErr;

  try {
    const body = await req?.json().catch(() => ({}));
    const { items: newItems, item } = body || {};
    const userId = req?.headers?.get('x-user-id') || 'default_user';

    let current = carts.get(userId) || [...DEFAULT_CART_ITEMS];

    if (Array.isArray(newItems)) {
      for (const ni of newItems) {
        current.push({
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: ni.name || 'Pantry Item',
          quantity: ni.quantity || 1,
          unit: ni.unit || 'item',
          category: ni.category || 'Pantry',
          checked: false,
          estimatedPrice: ni.estimatedPrice || 3.50,
          recipeSource: ni.recipeSource,
        });
      }
    } else if (item) {
      current.push({
        id: `item-${Date.now().toString(36)}`,
        name: item.name || 'New Item',
        quantity: item.quantity || 1,
        unit: item.unit || 'unit',
        category: item.category || 'Produce',
        checked: false,
        estimatedPrice: item.estimatedPrice || 2.99,
        recipeSource: item.recipeSource,
      });
    }

    carts.set(userId, current);

    return NextResponse.json({
      success: true,
      items: current,
      message: 'Cart updated successfully',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to add items to cart' }, { status: 500 });
  }
}

export async function PUT(req?: NextRequest) {
  const authErr = checkAuth(req);
  if (authErr) return authErr;

  try {
    const body = await req?.json().catch(() => ({}));
    const { itemId, checked, quantity } = body || {};
    const userId = req?.headers?.get('x-user-id') || 'default_user';

    const current = carts.get(userId) || [...DEFAULT_CART_ITEMS];
    const target = current.find(i => i.id === itemId);
    if (target) {
      if (typeof checked === 'boolean') target.checked = checked;
      if (typeof quantity === 'number') target.quantity = quantity;
    }

    carts.set(userId, current);

    return NextResponse.json({ success: true, item: target, items: current });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(req?: NextRequest) {
  const authErr = checkAuth(req);
  if (authErr) return authErr;

  const userId = req?.headers?.get('x-user-id') || 'default_user';
  const { searchParams } = new URL(req?.url || 'http://localhost/api/grocery/cart');
  const itemId = searchParams.get('id');

  if (itemId) {
    let current = carts.get(userId) || [...DEFAULT_CART_ITEMS];
    current = current.filter(i => i.id !== itemId);
    carts.set(userId, current);
    return NextResponse.json({ success: true, remainingCount: current.length });
  }

  // Clear all checked items
  let current = carts.get(userId) || [...DEFAULT_CART_ITEMS];
  current = current.filter(i => !i.checked);
  carts.set(userId, current);

  return NextResponse.json({ success: true, message: 'Completed items cleared', items: current });
}
