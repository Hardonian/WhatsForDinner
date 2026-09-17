/**
 * Cost Calculator Service
 * Calculates ingredient and recipe costs using USDA price data and estimates
 */

interface IngredientPrice {
  ingredient: string;
  price: number;
  unit: string;
  source: 'usda' | 'estimated' | 'cache';
  date: string;
}

// Cache for prices (30 days TTL)
const priceCache = new Map<string, { price: IngredientPrice; expires: number }>();
const PRICE_CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

// Estimated prices per unit (per 100g or common unit)
const ESTIMATED_PRICES: Record<string, { price: number; unit: string }> = {
  // Produce (per lb or per unit)
  'chicken breast': { price: 3.99, unit: 'lb' },
  'chicken': { price: 3.99, unit: 'lb' },
  'ground beef': { price: 4.99, unit: 'lb' },
  'beef': { price: 5.99, unit: 'lb' },
  'salmon': { price: 8.99, unit: 'lb' },
  'fish': { price: 6.99, unit: 'lb' },
  
  // Produce
  'tomato': { price: 2.99, unit: 'lb' },
  'onion': { price: 0.99, unit: 'lb' },
  'garlic': { price: 0.50, unit: 'head' },
  'bell pepper': { price: 1.99, unit: 'lb' },
  'carrot': { price: 1.29, unit: 'lb' },
  'potato': { price: 0.99, unit: 'lb' },
  'lettuce': { price: 1.99, unit: 'head' },
  'spinach': { price: 2.99, unit: 'lb' },
  'broccoli': { price: 2.49, unit: 'lb' },
  'mushroom': { price: 3.99, unit: 'lb' },
  
  // Pantry staples
  'rice': { price: 1.50, unit: 'lb' },
  'pasta': { price: 1.99, unit: 'lb' },
  'flour': { price: 0.99, unit: 'lb' },
  'sugar': { price: 0.89, unit: 'lb' },
  'olive oil': { price: 7.99, unit: 'bottle' },
  'oil': { price: 4.99, unit: 'bottle' },
  
  // Dairy
  'milk': { price: 3.49, unit: 'gallon' },
  'cheese': { price: 4.99, unit: 'lb' },
  'butter': { price: 3.99, unit: 'lb' },
  'egg': { price: 2.99, unit: 'dozen' },
  'yogurt': { price: 4.99, unit: '32oz' },
  
  // Common ingredients
  'bread': { price: 2.99, unit: 'loaf' },
  'banana': { price: 0.59, unit: 'lb' },
  'apple': { price: 1.99, unit: 'lb' },
};

/**
 * Get price for an ingredient
 */
export async function getIngredientPrice(
  ingredient: string,
  quantity: number = 1,
  unit?: string
): Promise<number> {
  const cacheKey = `${ingredient.toLowerCase()}_${quantity}_${unit || 'default'}`;
  
  // Check cache
  const cached = priceCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.price.price * (quantity / normalizeQuantity(cached.price.unit, quantity, unit || 'unit'));
  }

  // Try USDA price data (if available)
  const usdaPrice = await getUSDAPrice(ingredient);
  if (usdaPrice) {
    priceCache.set(cacheKey, {
      price: usdaPrice,
      expires: Date.now() + PRICE_CACHE_TTL,
    });
    
    // Scale by quantity
    const normalizedQty = normalizeQuantity(usdaPrice.unit, quantity, unit || usdaPrice.unit);
    return usdaPrice.price * normalizedQty;
  }

  // Fall back to estimated prices
  const estimated = getEstimatedPrice(ingredient, quantity, unit);
  if (estimated) {
    const priceData: IngredientPrice = {
      ingredient,
      price: estimated / quantity,
      unit: unit || 'unit',
      source: 'estimated',
      date: new Date().toISOString(),
    };
    
    priceCache.set(cacheKey, {
      price: priceData,
      expires: Date.now() + PRICE_CACHE_TTL,
    });
    
    return estimated;
  }

  // Default fallback
  return 0;
}

/**
 * Get price from USDA (placeholder - would require USDA price database API)
 */
async function getUSDAPrice(ingredient: string): Promise<IngredientPrice | null> {
  // In production, this would call USDA price database API
  // For now, return null to use estimates
  return null;
}

/**
 * Get estimated price based on common market rates
 */
function getEstimatedPrice(
  ingredient: string,
  quantity: number,
  unit?: string
): number | null {
  const normalized = ingredient.toLowerCase();
  
  // Find matching ingredient
  for (const [key, priceData] of Object.entries(ESTIMATED_PRICES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      const basePrice = priceData.price;
      const baseUnit = priceData.unit;
      
      // Convert quantity to match base unit
      const normalizedQty = normalizeQuantity(baseUnit, quantity, unit || 'unit');
      
      return basePrice * normalizedQty;
    }
  }
  
  return null;
}

/**
 * Normalize quantity between different units
 */
function normalizeQuantity(
  targetUnit: string,
  quantity: number,
  sourceUnit: string
): number {
  // Simple conversions (would be more complex in production)
  const conversions: Record<string, Record<string, number>> = {
    lb: {
      oz: 16,
      g: 453.592,
      kg: 0.453592,
    },
    oz: {
      lb: 1 / 16,
      g: 28.3495,
    },
    g: {
      lb: 1 / 453.592,
      oz: 1 / 28.3495,
      kg: 0.001,
    },
    cup: {
      oz: 8,
      tbsp: 16,
      tsp: 48,
      ml: 236.588,
    },
    gallon: {
      quart: 4,
      pint: 8,
      cup: 16,
      oz: 128,
    },
    dozen: {
      unit: 12,
    },
  };

  if (sourceUnit === targetUnit) return quantity;
  
  const targetConversions = conversions[targetUnit];
  if (!targetConversions) return quantity; // Unknown unit, return as-is
  
  const conversion = targetConversions[sourceUnit];
  if (!conversion) return quantity; // No conversion available
  
  return quantity * conversion;
}

/**
 * Calculate total cost for a recipe
 */
export async function getRecipeCost(recipe: {
  ingredients: string[];
}): Promise<number> {
  let totalCost = 0;

  for (const ingredient of recipe.ingredients) {
    // Parse ingredient string (e.g., "2 cups flour" or "1 lb chicken breast")
    const match = ingredient.match(/^(\d+(?:\.\d+)?)\s*(\w+)?\s+(.+)$/);
    
    if (match) {
      const [, quantityStr, unit, name] = match;
      const quantity = parseFloat(quantityStr);
      
      const cost = await getIngredientPrice(name, quantity, unit);
      totalCost += cost;
    } else {
      // Ingredient without explicit quantity, use default
      const cost = await getIngredientPrice(ingredient, 1);
      totalCost += cost;
    }
  }

  return Math.round(totalCost * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate cost per serving
 */
export async function getCostPerServing(
  recipe: { ingredients: string[] },
  servings: number = 4
): Promise<number> {
  const totalCost = await getRecipeCost(recipe);
  return Math.round((totalCost / servings) * 100) / 100;
}

/**
 * Calculate weekly meal plan cost
 */
export async function getMealPlanCost(
  meals: Array<{ ingredients: string[] }>
): Promise<number> {
  let totalCost = 0;

  for (const meal of meals) {
    const cost = await getRecipeCost(meal);
    totalCost += cost;
  }

  return Math.round(totalCost * 100) / 100;
}

/**
 * Compare costs across different recipes
 */
export async function compareRecipeCosts(
  recipes: Array<{ title: string; ingredients: string[] }>
): Promise<Array<{ title: string; cost: number; costPerServing: number }>> {
  const comparisons = await Promise.all(
    recipes.map(async (recipe) => {
      const cost = await getRecipeCost(recipe);
      const servings = 4; // Default
      const costPerServing = cost / servings;
      
      return {
        title: recipe.title,
        cost,
        costPerServing: Math.round(costPerServing * 100) / 100,
      };
    })
  );

  return comparisons.sort((a, b) => a.cost - b.cost);
}

/**
 * Calculate estimated savings vs eating out
 */
export function calculateSavingsVsEatingOut(
  homeCookedCost: number,
  averageRestaurantMeal: number = 15 // Default average restaurant meal cost
): { savings: number; percentage: number } {
  const savings = averageRestaurantMeal - homeCookedCost;
  const percentage = (savings / averageRestaurantMeal) * 100;
  
  return {
    savings: Math.round(savings * 100) / 100,
    percentage: Math.round(percentage * 10) / 10,
  };
}
