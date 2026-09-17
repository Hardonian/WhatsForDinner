import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface PantryItemData {
  id: string | number;
  name: string;
  ingredient: string; // compatibility alias
  quantity: number;
  unit: string;
  category: string;
  daysRemaining: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
  addedDate: string;
}

const LIVE_PANTRY_STORE: PantryItemData[] = [
  {
    id: 1,
    name: 'Wild Salmon Fillets',
    ingredient: 'Wild Salmon Fillets',
    quantity: 2,
    unit: 'count',
    category: 'Meat & Seafood',
    daysRemaining: 2,
    isExpiringSoon: true,
    isExpired: false,
    addedDate: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Fresh Asparagus',
    ingredient: 'Fresh Asparagus',
    quantity: 1,
    unit: 'bunch',
    category: 'Produce',
    daysRemaining: 3,
    isExpiringSoon: true,
    isExpired: false,
    addedDate: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Garlic Cloves',
    ingredient: 'Garlic Cloves',
    quantity: 8,
    unit: 'cloves',
    category: 'Produce',
    daysRemaining: 18,
    isExpiringSoon: false,
    isExpired: false,
    addedDate: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'Extra Virgin Olive Oil',
    ingredient: 'Extra Virgin Olive Oil',
    quantity: 1,
    unit: 'bottle (750ml)',
    category: 'Pantry & Oils',
    daysRemaining: 180,
    isExpiringSoon: false,
    isExpired: false,
    addedDate: new Date().toISOString(),
  },
  {
    id: 5,
    name: 'Organic Penne Pasta',
    ingredient: 'Organic Penne Pasta',
    quantity: 2,
    unit: 'boxes (16 oz)',
    category: 'Pantry & Grains',
    daysRemaining: 240,
    isExpiringSoon: false,
    isExpired: false,
    addedDate: new Date().toISOString(),
  },
  {
    id: 6,
    name: 'Parmigiano-Reggiano',
    ingredient: 'Parmigiano-Reggiano',
    quantity: 1,
    unit: 'wedge (8 oz)',
    category: 'Dairy & Cheese',
    daysRemaining: 25,
    isExpiringSoon: false,
    isExpired: false,
    addedDate: new Date().toISOString(),
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const expiringOnly = searchParams.get('expiring') === 'true';

    let items = LIVE_PANTRY_STORE;
    if (category) {
      items = items.filter(i => i.category.toLowerCase() === category.toLowerCase());
    }
    if (expiringOnly) {
      items = items.filter(i => i.isExpiringSoon || i.isExpired);
    }

    const expiringCount = LIVE_PANTRY_STORE.filter(i => i.isExpiringSoon).length;
    const expiredCount = LIVE_PANTRY_STORE.filter(i => i.isExpired).length;

    return NextResponse.json({
      success: true,
      items,
      count: items.length,
      metrics: {
        totalItems: LIVE_PANTRY_STORE.length,
        expiringCount,
        expiredCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch pantry items' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = body.name || body.ingredient;
    const quantity = Number(body.quantity) || 1;
    const unit = body.unit || 'unit';

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Ingredient name is required' },
        { status: 400 }
      );
    }

    const daysRemaining = typeof body.daysRemaining === 'number' ? body.daysRemaining : 14;
    const newItem: PantryItemData = {
      id: Date.now(),
      name: name.trim(),
      ingredient: name.trim(),
      quantity,
      unit,
      category: body.category || 'Pantry & Grains',
      daysRemaining,
      isExpiringSoon: daysRemaining <= 3,
      isExpired: daysRemaining <= 0,
      addedDate: new Date().toISOString(),
    };

    LIVE_PANTRY_STORE.unshift(newItem);

    return NextResponse.json({ success: true, item: newItem }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to add pantry item' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id, quantity, name, daysRemaining } = body;

    const item = LIVE_PANTRY_STORE.find(i => String(i.id) === String(id));
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (quantity !== undefined) item.quantity = Number(quantity);
    if (name) {
      item.name = name;
      item.ingredient = name;
    }
    if (daysRemaining !== undefined) {
      item.daysRemaining = daysRemaining;
      item.isExpiringSoon = daysRemaining <= 3;
      item.isExpired = daysRemaining <= 0;
    }

    return NextResponse.json({ success: true, item });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to update pantry item' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    const idx = LIVE_PANTRY_STORE.findIndex(i => String(i.id) === String(id));
    if (idx === -1) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const [removed] = LIVE_PANTRY_STORE.splice(idx, 1);
    return NextResponse.json({ success: true, removedItem: removed });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to delete pantry item' },
      { status: 500 }
    );
  }
}
