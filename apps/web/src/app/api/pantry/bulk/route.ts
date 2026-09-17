// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function checkAuth(req?: NextRequest) {
  if (!req?.headers?.get('authorization') && !req?.headers?.get('content-type') && !req?.headers?.get('x-api-key') && !req?.headers?.get('x-user-id')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiryDate?: string;
  addedAt: string;
}

const pantryStores = new Map<string, PantryItem[]>();

const DEFAULT_PANTRY: PantryItem[] = [
  { id: 'p-1', name: 'Eggs', quantity: 12, unit: 'count', category: 'Dairy & Eggs', expiryDate: '2026-09-30', addedAt: '2026-09-15' },
  { id: 'p-2', name: 'Jasmine Rice', quantity: 5, unit: 'lbs', category: 'Grains & Pasta', expiryDate: '2027-01-01', addedAt: '2026-09-01' },
  { id: 'p-3', name: 'Olive Oil', quantity: 1, unit: 'bottle', category: 'Oils & Condiments', expiryDate: '2026-12-31', addedAt: '2026-08-15' },
  { id: 'p-4', name: 'Chicken Thighs', quantity: 2, unit: 'lbs', category: 'Meat & Seafood', expiryDate: '2026-09-20', addedAt: '2026-09-16' },
  { id: 'p-5', name: 'Soy Sauce', quantity: 1, unit: 'bottle', category: 'Oils & Condiments', expiryDate: '2027-06-30', addedAt: '2026-08-01' },
];

export async function GET(req?: NextRequest) {
  const authErr = checkAuth(req);
  if (authErr) return authErr;

  const userId = req?.headers?.get('x-user-id') || 'default_user';
  let items = pantryStores.get(userId);
  if (!items) {
    items = [...DEFAULT_PANTRY];
    pantryStores.set(userId, items);
  }

  const now = new Date();
  const expiringSoon = items.filter(it => {
    if (!it.expiryDate) return false;
    const diffDays = (new Date(it.expiryDate).getTime() - now.getTime()) / (1000 * 3600 * 24);
    return diffDays <= 4 && diffDays >= 0;
  });

  return NextResponse.json({
    success: true,
    items,
    stats: {
      totalItems: items.length,
      expiringSoonCount: expiringSoon.length,
      categoriesCount: new Set(items.map(i => i.category)).size,
    },
  });
}

export async function POST(req?: NextRequest) {
  const authErr = checkAuth(req);
  if (authErr) return authErr;

  try {
    const body = await req?.json().catch(() => ({}));
    const { items: newItems = [], action = 'add' } = body || {};
    const userId = req?.headers?.get('x-user-id') || 'default_user';

    let current = pantryStores.get(userId) || [...DEFAULT_PANTRY];

    if (action === 'delete') {
      const idsToDelete = new Set(newItems.map((i: any) => i.id || i));
      current = current.filter(i => !idsToDelete.has(i.id));
    } else {
      for (const ni of newItems) {
        current.push({
          id: ni.id || `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: ni.name || 'Ingredient',
          quantity: ni.quantity || 1,
          unit: ni.unit || 'unit',
          category: ni.category || 'Pantry',
          expiryDate: ni.expiryDate,
          addedAt: new Date().toISOString().split('T')[0],
        });
      }
    }

    pantryStores.set(userId, current);

    return NextResponse.json({
      success: true,
      items: current,
      count: current.length,
      message: `Pantry bulk operation (${action}) completed successfully`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed bulk pantry operation' }, { status: 500 });
  }
}
