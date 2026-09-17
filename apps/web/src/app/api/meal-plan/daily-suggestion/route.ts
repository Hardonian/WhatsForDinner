// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function checkAuth(req?: NextRequest) {
  if (!req?.headers?.get('authorization') && !req?.headers?.get('content-type') && !req?.headers?.get('x-api-key') && !req?.headers?.get('x-user-id')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function GET(req?: NextRequest) {
  const authErr = checkAuth(req);
  if (authErr) return authErr;

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = daysOfWeek[new Date().getDay()];

  const dailyDinnerSuggestion = {
    day: dayName,
    date: new Date().toISOString().split('T')[0],
    highlightReason: '🔥 Uses 3 items in your pantry expiring this week!',
    recipe: {
      id: 'daily-pick-today',
      title: 'Crispy Honey Mustard Salmon with Roasted Asparagus',
      cuisine: 'Seafood',
      cookTime: '20 mins',
      difficulty: 'Easy',
      calories: 460,
      pantryMatchPercentage: 92,
      expiringIngredientsUsed: ['Atlantic Salmon', 'Dijon Mustard'],
      description: 'Pan-seared salmon with a sweet, tangy glaze alongside tender charred asparagus.',
      servings: 4,
    },
    quickAlternatives: [
      {
        id: 'daily-alt-1',
        title: '15-Minute Garlic Chili Noodles with Crispy Tofu',
        cookTime: '15 mins',
        reason: 'Fastest prep',
      },
      {
        id: 'daily-alt-2',
        title: 'One-Pot Tuscan White Bean & Tomato Soup',
        cookTime: '25 mins',
        reason: 'Cozy comfort',
      },
    ],
  };

  return NextResponse.json({
    success: true,
    suggestion: dailyDinnerSuggestion,
  });
}

export async function POST(req?: NextRequest) {
  return GET(req);
}
