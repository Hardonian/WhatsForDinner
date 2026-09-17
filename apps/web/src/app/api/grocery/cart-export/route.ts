// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function checkAuth(req?: NextRequest) {
  if (!req?.headers?.get('authorization') && !req?.headers?.get('content-type') && !req?.headers?.get('x-api-key') && !req?.headers?.get('x-user-id')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function POST(req?: NextRequest) {
  const authErr = checkAuth(req);
  if (authErr) return authErr;

  try {
    const body = await req?.json().catch(() => ({}));
    const { items = [], retailer = 'all', affiliateTag = 'whatsfordinner-20' } = body || {};

    const defaultItems = items.length > 0 ? items : [
      { name: 'Salmon Fillets', quantity: 2, unit: 'lbs' },
      { name: 'Fresh Spinach', quantity: 1, unit: 'bag' },
      { name: 'Gnocchi', quantity: 2, unit: 'packages' },
      { name: 'Sun-Dried Tomatoes', quantity: 1, unit: 'jar' },
    ];

    // Build plain text checklist
    const textExport = [
      '🛒 What\'s For Dinner - Grocery Checklist',
      '────────────────────────────',
      ...defaultItems.map((it: any) => `• ${it.name} (${it.quantity} ${it.unit || ''})`),
      '────────────────────────────',
      'Exported from WhatsForDinner.app',
    ].join('\n');

    const itemNamesQuery = encodeURIComponent(defaultItems.map((i: any) => i.name).join(', '));

    const retailerExports = {
      instacart: {
        retailer: 'Instacart',
        logo: '🥕',
        url: `https://www.instacart.com/store/partner_recipe?ingredients=${encodeURIComponent(JSON.stringify(defaultItems.map((i: any) => i.name)))}&tag=${affiliateTag}`,
        itemsCount: defaultItems.length,
        supportedDelivery: true,
      },
      kroger: {
        retailer: 'Kroger',
        logo: '🛒',
        url: `https://www.kroger.com/search?query=${itemNamesQuery}`,
        itemsCount: defaultItems.length,
        supportedDelivery: true,
      },
      walmart: {
        retailer: 'Walmart Grocery',
        logo: '🌟',
        url: `https://www.walmart.com/search?q=${itemNamesQuery}`,
        itemsCount: defaultItems.length,
        supportedDelivery: true,
      },
      amazonFresh: {
        retailer: 'Amazon Fresh / Whole Foods',
        logo: '🍎',
        url: `https://www.amazon.com/alm/search?almBrandId=VUZHIEZyZXNo&k=${itemNamesQuery}&tag=${affiliateTag}`,
        itemsCount: defaultItems.length,
        supportedDelivery: true,
      },
    };

    return NextResponse.json({
      success: true,
      totalItems: defaultItems.length,
      textExport,
      retailers: retailerExports,
      selectedRetailerUrl: retailer !== 'all' ? (retailerExports as any)[retailer]?.url : null,
      message: 'Cart exported with one-click multi-retailer deep links',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to export cart' }, { status: 500 });
  }
}

export async function GET(req?: NextRequest) {
  return POST(req);
}
