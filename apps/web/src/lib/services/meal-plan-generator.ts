/**
 * Meal Plan Generator Service
 * Generates intelligent weekly meal plans based on preferences, pantry, and constraints
 */

import { Recipe } from '@whats-for-dinner/utils';
import { getRecipeNutrition } from './nutrition-service';

export interface MealPlanPreferences {
  dietaryRestrictions: string[]; // 'vegetarian', 'vegan', 'keto', 'paleo', etc.
  cuisinePreferences: string[]; // 'italian', 'mexican', 'asian', etc.
  mealPrepDay?: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
  familySize?: number; // Number of servings
  maxPrepTime?: number; // Maximum prep time per meal in minutes
  budget?: number; // Weekly budget in dollars
}

export interface MealPlanDay {
  date: string;
  breakfast?: Recipe;
  lunch?: Recipe;
  dinner: Recipe;
  snack?: Recipe;
}

export interface WeeklyMealPlan {
  weekStartDate: string;
  days: MealPlanDay[];
  shoppingList: ShoppingListItem[];
  totalCost?: number;
  nutritionSummary?: {
    avgDailyCalories: number;
    avgDailyProtein: number;
    avgDailyCarbs: number;
    avgDailyFat: number;
  };
}

export interface ShoppingListItem {
  ingredient: string;
  quantity: number;
  unit: string;
  category: string; // 'produce', 'dairy', 'meat', 'pantry', etc.
  estimatedCost?: number;
}

/**
 * Generate a weekly meal plan
 */
export async function generateWeeklyMealPlan(
  pantryItems: string[],
  preferences: MealPlanPreferences,
  generateRecipeFn: (ingredients: string[], preferences: string) => Promise<{ recipes: Recipe[] }>
): Promise<WeeklyMealPlan> {
  const weekStart = getWeekStartDate();
  const days: MealPlanDay[] = [];
  const allIngredients = new Map<string, { quantity: number; unit: string; category: string }>();

  // Generate meals for each day
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Adjust pantry for what we've used
    const remainingPantry = [...pantryItems];
    
    // Generate dinner (always required)
    const dinnerIngredients = selectPantryItems(remainingPantry, 3, 6);
    const preferencesStr = buildPreferencesString(preferences);
    
    const dinnerResult = await generateRecipeFn(dinnerIngredients, preferencesStr);
    const dinner = dinnerResult.recipes[0];
    
    if (dinner) {
      // Extract ingredients from dinner
      extractIngredients(dinner, allIngredients);
    }

    // Generate lunch (optional, skip on weekends for simplicity)
    let lunch: Recipe | undefined;
    if (!['Saturday', 'Sunday'].includes(dayOfWeek)) {
      const lunchIngredients = selectPantryItems(remainingPantry, 2, 4);
      const lunchResult = await generateRecipeFn(lunchIngredients, preferencesStr);
      lunch = lunchResult.recipes[0];
      
      if (lunch) {
        extractIngredients(lunch, allIngredients);
      }
    }

    days.push({
      date: date.toISOString().split('T')[0],
      dinner,
      lunch,
    });
  }

  // Build shopping list
  const shoppingList = buildShoppingList(allIngredients, pantryItems);
  
  // Calculate nutrition summary
  const nutritionSummary = await calculateNutritionSummary(days);

  return {
    weekStartDate: weekStart,
    days,
    shoppingList,
    nutritionSummary,
  };
}

/**
 * Get start of current week (Monday)
 */
function getWeekStartDate(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Monday = 1
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

/**
 * Select random items from pantry
 */
function selectPantryItems(
  pantry: string[],
  min: number,
  max: number
): string[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...pantry].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, pantry.length));
}

/**
 * Build preferences string for recipe generation
 */
function buildPreferencesString(preferences: MealPlanPreferences): string {
  const parts: string[] = [];
  
  if (preferences.dietaryRestrictions.length > 0) {
    parts.push(`Dietary: ${preferences.dietaryRestrictions.join(', ')}`);
  }
  
  if (preferences.cuisinePreferences.length > 0) {
    parts.push(`Cuisines: ${preferences.cuisinePreferences.join(', ')}`);
  }
  
  if (preferences.maxPrepTime) {
    parts.push(`Max prep time: ${preferences.maxPrepTime} minutes`);
  }
  
  if (preferences.familySize && preferences.familySize > 1) {
    parts.push(`Serves ${preferences.familySize}`);
  }

  return parts.join('. ');
}

/**
 * Extract ingredients from recipe
 */
function extractIngredients(
  recipe: Recipe,
  ingredientMap: Map<string, { quantity: number; unit: string; category: string }>
): void {
  if (!recipe.ingredients) return;

  recipe.ingredients.forEach((ingredient) => {
    const match = ingredient.match(/^(\d+(?:\.\d+)?)\s*(\w+)?\s+(.+)$/);
    if (match) {
      const [, quantityStr, unit, name] = match;
      const quantity = parseFloat(quantityStr);
      const normalizedUnit = unit || 'unit';
      const category = categorizeIngredient(name);

      const existing = ingredientMap.get(name.toLowerCase());
      if (existing) {
        existing.quantity += quantity;
      } else {
        ingredientMap.set(name.toLowerCase(), {
          quantity,
          unit: normalizedUnit,
          category,
        });
      }
    } else {
      // Handle ingredients without explicit quantities
      const name = ingredient;
      const category = categorizeIngredient(name);
      ingredientMap.set(name.toLowerCase(), {
        quantity: 1,
        unit: 'unit',
        category,
      });
    }
  });
}

/**
 * Categorize ingredient for shopping list organization
 */
function categorizeIngredient(ingredient: string): string {
  const normalized = ingredient.toLowerCase();
  
  if (normalized.match(/chicken|beef|pork|fish|turkey|meat|bacon|sausage/)) {
    return 'meat';
  }
  if (normalized.match(/milk|cheese|yogurt|cream|butter|egg/)) {
    return 'dairy';
  }
  if (normalized.match(/apple|banana|orange|berry|fruit|avocado|tomato|lettuce|spinach|carrot|pepper|onion|garlic|vegetable/)) {
    return 'produce';
  }
  if (normalized.match(/rice|pasta|bread|flour|sugar|salt|pepper|spice|oil|vinegar/)) {
    return 'pantry';
  }
  if (normalized.match(/frozen|ice/)) {
    return 'frozen';
  }
  
  return 'other';
}

/**
 * Build aggregated shopping list
 */
function buildShoppingList(
  allIngredients: Map<string, { quantity: number; unit: string; category: string }>,
  existingPantry: string[]
): ShoppingListItem[] {
  const shoppingList: ShoppingListItem[] = [];
  
  // Filter out items already in pantry
  const pantryLower = existingPantry.map((item) => item.toLowerCase());
  
  allIngredients.forEach((data, ingredient) => {
    // Check if we have enough in pantry (simplified: just check if ingredient exists)
    const inPantry = pantryLower.some((pantryItem) =>
      pantryItem.includes(ingredient) || ingredient.includes(pantryItem)
    );
    
    if (!inPantry) {
      // Add to shopping list if not in pantry
      shoppingList.push({
        ingredient,
        quantity: data.quantity,
        unit: data.unit,
        category: data.category,
      });
    }
  });

  // Group by category and sort
  return shoppingList.sort((a, b) => {
    const categoryOrder = ['produce', 'meat', 'dairy', 'pantry', 'frozen', 'other'];
    const aIndex = categoryOrder.indexOf(a.category);
    const bIndex = categoryOrder.indexOf(b.category);
    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }
    return a.ingredient.localeCompare(b.ingredient);
  });
}

/**
 * Calculate nutrition summary for meal plan
 */
async function calculateNutritionSummary(
  days: MealPlanDay[]
): Promise<WeeklyMealPlan['nutritionSummary']> {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let mealCount = 0;

  for (const day of days) {
    const meals = [day.breakfast, day.lunch, day.dinner, day.snack].filter(Boolean) as Recipe[];
    
    for (const meal of meals) {
      // Extract ingredients from recipe
      const ingredients = (meal.ingredients || []).map((ing) => {
        const match = ing.match(/^(\d+(?:\.\d+)?)\s*(\w+)?\s+(.+)$/);
        if (match) {
          return {
            name: match[3],
            amount: parseFloat(match[1]),
            unit: match[2] || 'unit',
          };
        }
        return { name: ing, amount: 100, unit: 'g' };
      });

      const nutrition = await getRecipeNutrition(ingredients);
      totalCalories += nutrition.calories;
      totalProtein += nutrition.protein;
      totalCarbs += nutrition.carbs;
      totalFat += nutrition.fat;
      mealCount++;
    }
  }

  if (mealCount === 0) return undefined;

  return {
    avgDailyCalories: totalCalories / 7,
    avgDailyProtein: totalProtein / 7,
    avgDailyCarbs: totalCarbs / 7,
    avgDailyFat: totalFat / 7,
  };
}
