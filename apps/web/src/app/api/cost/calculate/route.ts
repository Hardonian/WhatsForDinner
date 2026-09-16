import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-dynamic";

import {
  getRecipeCost,
  getCostPerServing,
  getMealPlanCost,
  compareRecipeCosts,
  calculateSavingsVsEatingOut,
} from '@/lib/services/cost-calculator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, recipe, recipes, meals, servings, averageRestaurantMeal } = body;

    switch (type) {
      case 'recipe':
        if (!recipe) {
          return NextResponse.json({ error: 'Recipe required' }, { status: 400 });
        }
        const cost = await getRecipeCost(recipe);
        return NextResponse.json({ cost });

      case 'costPerServing':
        if (!recipe || !servings) {
          return NextResponse.json(
            { error: 'Recipe and servings required' },
            { status: 400 }
          );
        }
        const costPerServing = await getCostPerServing(recipe, servings);
        return NextResponse.json({ costPerServing });

      case 'mealPlan':
        if (!meals) {
          return NextResponse.json({ error: 'Meals required' }, { status: 400 });
        }
        const mealPlanCost = await getMealPlanCost(meals);
        return NextResponse.json({ cost: mealPlanCost });

      case 'compare':
        if (!recipes || !Array.isArray(recipes)) {
          return NextResponse.json(
            { error: 'Recipes array required' },
            { status: 400 }
          );
        }
        const comparisons = await compareRecipeCosts(recipes);
        return NextResponse.json({ comparisons });

      case 'savings':
        if (!body.homeCookedCost) {
          return NextResponse.json(
            { error: 'homeCookedCost required' },
            { status: 400 }
          );
        }
        const savings = calculateSavingsVsEatingOut(
          body.homeCookedCost,
          averageRestaurantMeal || 15
        );
        return NextResponse.json({ savings });

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    // Error handled: Cost calculation error:
    return NextResponse.json(
      { error: error.message || 'Failed to calculate cost' },
      { status: 500 }
    );
  }
}
