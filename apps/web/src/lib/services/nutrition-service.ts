import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('nutrition-service');

/**
 * Nutrition Service - USDA FoodData Central API Integration
 * Provides accurate nutrition data for ingredients and recipes
 */

interface NutritionData {
  fdcId: number;
  description: string;
  foodNutrients: Array<{
    nutrientId: number;
    nutrientName: string;
    value: number;
    unitName: string;
  }>;
}

interface AggregatedNutrition {
  calories: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  fiber: number; // g
  sugar: number; // g
  sodium: number; // mg
  calcium: number; // mg
  iron: number; // mg
  vitaminA: number; // IU
  vitaminC: number; // mg
  cholesterol: number; // mg
  saturatedFat: number; // g
  potassium: number; // mg
  completeness: number; // 0-1, how complete the data is
}

const USDA_API_KEY = process.env.USDA_API_KEY || '';
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

// Cache for nutrition data (7 days TTL)
const nutritionCache = new Map<string, { data: AggregatedNutrition; expires: number }>();
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Search for food items in USDA database
 */
export async function searchUSDAFoods(query: string, limit = 10): Promise<any[]> {
  if (!USDA_API_KEY) {
    if (process.env.NODE_ENV === 'development') { _logger.warn('USDA API key not configured'); }
    return [];
  }

  try {
    const response = await fetch(
      `${USDA_BASE_URL}/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=${limit}`
    );

    if (!response.ok) {
      throw new Error(`USDA API error: ${response.status}`);
    }

    const data = await response.json();
    return data.foods || [];
  } catch (error) {
    // Error handled: Error searching USDA foods:
    return [];
  }
}

/**
 * Get nutrition data for a specific food ID
 */
export async function getFoodNutrition(fdcId: number): Promise<NutritionData | null> {
  if (!USDA_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(
      `${USDA_BASE_URL}/food/${fdcId}?api_key=${USDA_API_KEY}&nutrients=203,204,205,291,307,301,401,430,601,606,208`
    );

    if (!response.ok) {
      throw new Error(`USDA API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // Error handled: Error fetching USDA food nutrition:
    return null;
  }
}

/**
 * Aggregate nutrition data from USDA format to our format
 */
function aggregateNutrition(nutritionData: NutritionData): AggregatedNutrition {
  const nutrients = nutritionData.foodNutrients || [];
  
  // Nutrient IDs from USDA FoodData Central
  const nutrientMap: Record<number, string> = {
    208: 'calories',
    203: 'protein',
    205: 'carbs',
    204: 'fat',
    291: 'fiber',
    269: 'sugar',
    307: 'sodium',
    301: 'calcium',
    303: 'iron',
    320: 'vitaminA',
    401: 'vitaminC',
    601: 'cholesterol',
    606: 'saturatedFat',
    306: 'potassium',
  };

  const aggregated: Partial<AggregatedNutrition> = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    calcium: 0,
    iron: 0,
    vitaminA: 0,
    vitaminC: 0,
    cholesterol: 0,
    saturatedFat: 0,
    potassium: 0,
    completeness: 0,
  };

  let foundCount = 0;
  const totalExpected = Object.keys(nutrientMap).length;

  nutrients.forEach((nutrient) => {
    const key = nutrientMap[nutrient.nutrientId as keyof typeof nutrientMap];
    if (key) {
      (aggregated as any)[key] = nutrient.value || 0;
      foundCount++;
    }
  });

  aggregated.completeness = foundCount / totalExpected;

  return aggregated as AggregatedNutrition;
}

/**
 * Get nutrition for an ingredient
 * Uses caching to reduce API calls
 */
export async function getIngredientNutrition(
  ingredient: string,
  amount?: number,
  unit?: string
): Promise<AggregatedNutrition | null> {
  const cacheKey = `${ingredient.toLowerCase()}_${amount || 100}_${unit || 'g'}`;
  
  // Check cache
  const cached = nutritionCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  // Search for ingredient in USDA database
  const foods = await searchUSDAFoods(ingredient, 1);
  if (foods.length === 0) {
    // Fallback to estimated nutrition based on common values
    return getEstimatedNutrition(ingredient);
  }

  const food = foods[0];
  const nutritionData = await getFoodNutrition(food.fdcId);
  
  if (!nutritionData) {
    return getEstimatedNutrition(ingredient);
  }

  const aggregated = aggregateNutrition(nutritionData);
  
  // Scale by amount if provided (assuming base is 100g)
  const baseAmount = 100; // USDA data is typically per 100g
  if (amount && amount !== baseAmount) {
    const scale = amount / baseAmount;
    Object.keys(aggregated).forEach((key) => {
      if (key !== 'completeness' && typeof (aggregated as any)[key] === 'number') {
        (aggregated as any)[key] *= scale;
      }
    });
  }

  // Cache the result
  nutritionCache.set(cacheKey, {
    data: aggregated,
    expires: Date.now() + CACHE_TTL,
  });

  return aggregated;
}

/**
 * Get estimated nutrition for common ingredients (fallback)
 */
function getEstimatedNutrition(ingredient: string): AggregatedNutrition {
  const normalized = ingredient.toLowerCase();
  
  // Common ingredient estimates (per 100g)
  const estimates: Record<string, AggregatedNutrition> = {
    'chicken breast': {
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      fiber: 0,
      sugar: 0,
      sodium: 74,
      calcium: 15,
      iron: 0.9,
      vitaminA: 6,
      vitaminC: 0,
      cholesterol: 85,
      saturatedFat: 1,
      potassium: 256,
      completeness: 0.7,
    },
    'brown rice': {
      calories: 111,
      protein: 2.6,
      carbs: 23,
      fat: 0.9,
      fiber: 1.8,
      sugar: 0.4,
      sodium: 5,
      calcium: 10,
      iron: 0.4,
      vitaminA: 0,
      vitaminC: 0,
      cholesterol: 0,
      saturatedFat: 0.2,
      potassium: 43,
      completeness: 0.6,
    },
    // Add more common ingredients
  };

  const match = Object.keys(estimates).find((key) => normalized.includes(key));
  return match ? estimates[match] : getDefaultNutrition();
}

function getDefaultNutrition(): AggregatedNutrition {
  return {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    calcium: 0,
    iron: 0,
    vitaminA: 0,
    vitaminC: 0,
    cholesterol: 0,
    saturatedFat: 0,
    potassium: 0,
    completeness: 0,
  };
}

/**
 * Aggregate nutrition for a recipe (sum of all ingredients)
 */
export async function getRecipeNutrition(
  ingredients: Array<{ name: string; amount?: number; unit?: string }>
): Promise<AggregatedNutrition> {
  const nutritionPromises = ingredients.map((ing) =>
    getIngredientNutrition(ing.name, ing.amount, ing.unit)
  );

  const nutritionResults = await Promise.all(nutritionPromises);
  
  const aggregated = getDefaultNutrition();
  let validCount = 0;

  nutritionResults.forEach((nutrition) => {
    if (nutrition) {
      aggregated.calories += nutrition.calories;
      aggregated.protein += nutrition.protein;
      aggregated.carbs += nutrition.carbs;
      aggregated.fat += nutrition.fat;
      aggregated.fiber += nutrition.fiber;
      aggregated.sugar += nutrition.sugar;
      aggregated.sodium += nutrition.sodium;
      aggregated.calcium += nutrition.calcium;
      aggregated.iron += nutrition.iron;
      aggregated.vitaminA += nutrition.vitaminA;
      aggregated.vitaminC += nutrition.vitaminC;
      aggregated.cholesterol += nutrition.cholesterol;
      aggregated.saturatedFat += nutrition.saturatedFat;
      aggregated.potassium += nutrition.potassium;
      validCount++;
    }
  });

  // Average completeness
  aggregated.completeness = validCount > 0 
    ? nutritionResults.filter((n) => n?.completeness).reduce((sum, n) => sum + (n?.completeness || 0), 0) / validCount
    : 0;

  return aggregated;
}

/**
 * Check if nutrition data is USDA verified
 */
export function isNutritionVerified(nutrition: AggregatedNutrition): boolean {
  return nutrition.completeness > 0.8; // 80%+ completeness indicates USDA data
}
