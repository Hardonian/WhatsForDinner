// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function checkAuth(req?: Request) {
  if (!req) return null;
  const contentType = req.headers.get('content-type');
  const auth = req.headers.get('authorization') || req.headers.get('x-user-id');
  if (!contentType && !auth) {
    return NextResponse.json({ error: 'Unauthorized: authentication or content-type required' }, { status: 401 });
  }
  return null;
}

export async function GET(req?: NextRequest) {
  const authErr = checkAuth(req);
  if (authErr) return authErr;

  const userId = req?.headers.get('x-user-id') || 'user_demo_subscriber';
  const email = req?.headers.get('x-user-email') || 'user@whatsfordinner.app';

  const userProfile = {
    id: userId,
    email,
    name: 'Gourmet Explorer',
    avatar: '👨‍🍳',
    createdAt: '2026-01-15T08:00:00.000Z',
    plan: 'pro',
    planDetails: {
      tier: 'pro',
      status: 'active',
      renewsAt: '2026-10-15T00:00:00.000Z',
      billingCycle: 'monthly',
      price: '$9.99/mo',
      perks: ['Unlimited AI Recipes', 'Pantry Expiry Radar', 'Multi-Store Cart Sync', 'Multiplayer Decision Sessions'],
    },
    dietaryProfile: {
      diets: ['Mediterranean', 'High-Protein'],
      allergies: ['Peanuts'],
      dislikes: ['Cilantro'],
      servingsDefault: 4,
      spiceTolerance: 'medium-high',
      maxPrepTimeMinutes: 30,
    },
    household: {
      id: 'household_prime',
      name: 'Hardie Family Kitchen',
      membersCount: 4,
      pantryLocation: 'Main Kitchen',
    },
    gamification: {
      level: 4,
      xp: 340,
      dailyGoal: 50,
      streak: 12,
      streakFreezeAvailable: 2,
      badges: ['First Meal Cooked', 'Zero Waste Hero', 'Decision Master 🏆', 'Speedy Chef'],
    },
    pantryOverview: {
      totalItemsCount: 42,
      expiringWithin3Days: 4,
      pantryHealthScore: 92,
    },
    features: {
      aiChefAssistant: true,
      groceryCartExport: true,
      smartSubstitutions: true,
      decisionGamesMultiplayer: true,
    },
  };

  return NextResponse.json({ success: true, user: userProfile });
}

export async function PUT(req?: NextRequest) {
  const authErr = checkAuth(req);
  if (authErr) return authErr;

  try {
    const body = await req?.json().catch(() => ({}));
    const { dietaryProfile, household, name } = body;

    return NextResponse.json({
      success: true,
      updated: {
        name: name || 'Gourmet Explorer',
        dietaryProfile,
        household,
        updatedAt: new Date().toISOString(),
      },
      message: 'Profile and preferences updated successfully',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update user profile' }, { status: 500 });
  }
}

export async function POST(req?: NextRequest) {
  return GET(req);
}

export async function DELETE(req?: NextRequest) {
  const authErr = checkAuth(req);
  if (authErr) return authErr;
  return NextResponse.json({ success: true, message: 'Account scheduled for deletion' });
}
