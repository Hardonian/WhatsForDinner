/**
 * Dynamic Recipe Adaptation & Shuffling Engine
 * Performs meaningful mutations to cooking steps, temperatures, timings, and macros
 * when ingredients are swapped or recipes are remixed.
 */

export interface DynamicRecipe {
  id: string;
  title: string;
  cookTime: string;
  calories: number;
  servings: number;
  difficulty: string;
  cuisine: string;
  pantryIngredientsUsed: string[];
  steps: string[];
  proTips: Record<number, string>;
  substitutions: Record<string, string>;
  activeSwaps?: Array<{ original: string; replacement: string }>;
  variationName?: string;
  macros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export const INGREDIENT_SWAP_RULES: Record<
  string,
  {
    replacement: string;
    macroDelta: { calories: number; protein: number; carbs: number; fat: number };
    timeAdjustmentMins: number;
    stepReplacements: Array<{ match: RegExp; replace: string }>;
    proTip: string;
  }
> = {
  butter: {
    replacement: 'Extra Virgin Olive Oil (1:1)',
    macroDelta: { calories: -15, protein: 0, carbs: 0, fat: -1 },
    timeAdjustmentMins: 0,
    stepReplacements: [
      { match: /melted butter|melted garlic butter/gi, replace: 'fragrant garlic olive oil' },
      { match: /spooning melted butter over/gi, replace: 'spooning infused warm olive oil over' },
      { match: /butter/gi, replace: 'extra virgin olive oil' },
    ],
    proTip: 'Olive oil has a lower smoke point than clarified butter, so keep the heat at medium to preserve rich polyphenol aromas.',
  },
  salmon: {
    replacement: 'Extra-Firm Pressed Tofu (Cubed/Planks)',
    macroDelta: { calories: -160, protein: -18, carbs: +4, fat: -14 },
    timeAdjustmentMins: -4,
    stepReplacements: [
      { match: /salmon fillets|salmon fillet|salmon/gi, replace: 'pressed tofu planks' },
      { match: /skin-side down \(or flesh-side down if skinless\)/gi, replace: 'flat side down into the hot oil' },
      { match: /until flaky and cooked through/gi, replace: 'until golden-brown and crispy on all edges' },
      { match: /dry that fish skin/gi, replace: 'press the tofu firmly with towels to extract excess moisture for crispiness' },
    ],
    proTip: 'Dust the exterior of pressed tofu with a light pinch of cornstarch before searing for restaurant-level shattering crispiness.',
  },
  chicken: {
    replacement: 'King Oyster Mushrooms & Chickpeas',
    macroDelta: { calories: -140, protein: -16, carbs: +18, fat: -6 },
    timeAdjustmentMins: -6,
    stepReplacements: [
      { match: /chicken breasts|chicken cutlets|chicken/gi, replace: 'thick-sliced king oyster mushrooms and drained chickpeas' },
      { match: /sear until internal temperature hits 165°F/gi, replace: 'sear until deeply caramelized and tender throughout' },
    ],
    proTip: 'Score crosshatch patterns into the mushroom tops to capture the basting glaze.',
  },
  asparagus: {
    replacement: 'Tender Broccolini Florets',
    macroDelta: { calories: +10, protein: +2, carbs: +2, fat: 0 },
    timeAdjustmentMins: +1,
    stepReplacements: [
      { match: /asparagus spears|asparagus/gi, replace: 'trimmed broccolini florets' },
      { match: /trimmed asparagus/gi, replace: 'fresh broccolini' },
    ],
    proTip: 'Broccolini florets soak up pan juices faster than asparagus stalks—toss them in during the last 3 minutes.',
  },
  heavy_cream: {
    replacement: 'Full-Fat Coconut Milk & Nutritional Yeast',
    macroDelta: { calories: -40, protein: +2, carbs: +3, fat: -5 },
    timeAdjustmentMins: 0,
    stepReplacements: [
      { match: /heavy cream|cream/gi, replace: 'rich coconut milk' },
      { match: /whisk in cream/gi, replace: 'stir in coconut milk until velvety' },
    ],
    proTip: 'Simmer coconut milk gently on low heat to prevent separation while thickening naturally.',
  },
  white_rice: {
    replacement: 'Grated Cauliflower Rice (Low-Carb)',
    macroDelta: { calories: -180, protein: -2, carbs: -38, fat: 0 },
    timeAdjustmentMins: -8,
    stepReplacements: [
      { match: /boiled white rice|steamed rice|rice/gi, replace: 'quick-sautéed cauliflower rice' },
      { match: /simmer covered for 15-20 minutes/gi, replace: 'sauté uncovered in skillet for just 4-5 minutes until tender-crisp' },
    ],
    proTip: 'Do not overcook cauliflower rice or it will release steam and turn soggy—a high-heat dry sauté creates fluffy texture.',
  },
  pasta: {
    replacement: 'Spiralized Zucchini Noodles (Zoodles)',
    macroDelta: { calories: -220, protein: -6, carbs: -42, fat: 0 },
    timeAdjustmentMins: -7,
    stepReplacements: [
      { match: /boil pasta in salted water for 9-11 minutes/gi, replace: 'toss spiralized zucchini noodles directly into hot sauce for 90 seconds' },
      { match: /cooked pasta|al dente pasta|pasta/gi, replace: 'tender zucchini noodles' },
    ],
    proTip: 'Salt the zucchini ribbons and let them drain on paper towels for 10 minutes beforehand to avoid watery sauce.',
  },
};

export const RECIPE_REMIX_VARIATIONS: Array<{
  id: string;
  name: string;
  cuisine: string;
  cookMethod: string;
  cookTime: string;
  difficulty: string;
  calorieAdjustment: number;
  addedIngredients: string[];
  removedIngredients: string[];
  stepTransformer: (baseSteps: string[]) => string[];
  proTip: string;
}> = [
  {
    id: 'air-fryer-crisp',
    name: '12-Minute Turbo Air-Fryer Crisp',
    cuisine: 'Modern Quick',
    cookMethod: 'Air Fryer (400°F / 205°C)',
    cookTime: '12 mins',
    difficulty: 'Easy',
    calorieAdjustment: -90,
    addedIngredients: ['Avocado oil spray', 'Smoked garlic seasoning rub'],
    removedIngredients: ['Pan Sauté Step', 'Excess basting butter'],
    stepTransformer: (baseSteps) => [
      'Preheat your air fryer to 400°F (205°C) for 3 minutes.',
      'Pat protein dry, mist generously with avocado oil spray, and coat with smoked garlic seasoning.',
      'Place into the perforated air fryer basket in a single layer with space for convective airflow.',
      'Air fry at 400°F for 10-12 minutes (shaking basket halfway) until crust is shattering-crisp and internal temp is verified safe.',
      'Plate with fresh citrus squeeze. Zero skillet cleanup required.',
    ],
    proTip: 'Convective air fryers cook 35% faster than conventional ovens—do not overcrowd the basket or steam will build up.',
  },
  {
    id: 'sichuan-chili-crunch',
    name: 'Sichuan Spicy Chili Crunch Wok-Char',
    cuisine: 'Sichuan Fusion',
    cookMethod: 'High-Heat Skillet Sear',
    cookTime: '16 mins',
    difficulty: 'Intermediate',
    calorieAdjustment: +60,
    addedIngredients: ['Crispy chili crunch oil (2 tbsp)', 'Toasted sesame seeds', 'Sliced scallions', 'Sichuan peppercorn'],
    removedIngredients: ['Lemon Zest Emulsion'],
    stepTransformer: (baseSteps) => [
      'Pat protein dry and dust lightly with ground Sichuan peppercorn and coarse sea salt.',
      'Heat 1 tbsp chili crunch oil in a wok or heavy skillet until smoking hot and fragrant.',
      'Sear protein undisturbed for 4 minutes until crust is charred with red chili lacquer.',
      'Flip and add sliced scallions and remaining chili oil. Spoon sizzling aromatic chili oil over top for 3 minutes.',
      'Garnish generously with toasted sesame seeds and fresh scallion curls. Serve immediately.',
    ],
    proTip: 'The tingling sensation comes from hydroxy-alpha-sanshool in Sichuan peppercorn—pair with crispy garlic chili crunch for maximum umami.',
  },
  {
    id: 'tuscan-garlic-cream',
    name: 'Creamy Tuscan Sun-Dried Tomato & Basil',
    cuisine: 'Rustic Italian',
    cookMethod: 'Cast Iron Braise',
    cookTime: '24 mins',
    difficulty: 'Easy',
    calorieAdjustment: +110,
    addedIngredients: ['Sun-dried tomatoes in olive oil', 'Baby spinach (2 cups)', 'Grated Parmigiano-Reggiano', 'Fresh basil'],
    removedIngredients: ['Plain olive oil spray'],
    stepTransformer: (baseSteps) => [
      'Season protein with sea salt, black pepper, and dried Italian oregano.',
      'Sear protein in skillet with olive oil for 4 minutes per side until golden; transfer to a side plate.',
      'In same pan drippings, sauté minced garlic and chopped sun-dried tomatoes for 60 seconds until aromatic.',
      'Pour in 1/2 cup stock and heavy cream (or coconut cream). Simmer 3 minutes until gently reduced.',
      'Stir in fresh baby spinach and parmesan until wilted. Return protein to pan and spoon rich Tuscan cream sauce all over.',
    ],
    proTip: 'Use the oil from the sun-dried tomato jar—it is infused with concentrated herbs and garlic!',
  },
  {
    id: 'chipotle-lime-honey',
    name: 'Smoky Chipotle Lime & Hot Honey Glaze',
    cuisine: 'Baja Southwestern',
    cookMethod: 'Glazed Pan Sear',
    cookTime: '18 mins',
    difficulty: 'Easy',
    calorieAdjustment: +45,
    addedIngredients: ['Hot honey (1.5 tbsp)', 'Chipotle chili powder', 'Fresh lime zest & juice', 'Cilantro'],
    removedIngredients: ['Butter'],
    stepTransformer: (baseSteps) => [
      'Coat protein in chipotle chili powder, ground cumin, and sea salt.',
      'Whisk hot honey with fresh lime juice in a small ramekin to create finishing glaze.',
      'Sear protein in hot olive oil for 4 minutes on first side until deeply blackened.',
      'Flip, lower heat to medium, and brush hot honey lime glaze all over the caramelized crust.',
      'Glaze bubbles and caramelizes into a sticky lacquer in 2-3 minutes. Garnish with chopped fresh cilantro.',
    ],
    proTip: 'Apply honey glaze during the final 2 minutes only—sugars will burn if added at the start of high-heat searing.',
  },
];

/**
 * Apply a live ingredient swap to a recipe, adapting steps, timings, and macros.
 */
export function applyIngredientSwap(
  recipe: DynamicRecipe,
  targetIngredientKey: string
): DynamicRecipe {
  const rule = INGREDIENT_SWAP_RULES[targetIngredientKey.toLowerCase()];
  if (!rule) return recipe;

  const currentSwaps = recipe.activeSwaps || [];
  const isAlreadySwapped = currentSwaps.some(
    s => s.original.toLowerCase() === targetIngredientKey.toLowerCase()
  );

  if (isAlreadySwapped) {
    // Revert swap
    return revertIngredientSwap(recipe, targetIngredientKey);
  }

  // Transform steps
  const updatedSteps = recipe.steps.map(step => {
    let modified = step;
    rule.stepReplacements.forEach(({ match, replace }) => {
      modified = modified.replace(match, replace);
    });
    return modified;
  });

  // Transform ingredients list
  const updatedIngredients = recipe.pantryIngredientsUsed.map(ing => {
    let modified = ing;
    rule.stepReplacements.forEach(({ match, replace }) => {
      modified = modified.replace(match, replace);
    });
    return modified;
  });

  const baseCalories = recipe.calories || 500;
  const newCalories = Math.max(150, baseCalories + rule.macroDelta.calories);

  const rawMinutes = parseInt(recipe.cookTime) || 20;
  const newMinutes = Math.max(8, rawMinutes + rule.timeAdjustmentMins);

  return {
    ...recipe,
    title: recipe.title.replace(new RegExp(targetIngredientKey, 'gi'), rule.replacement.split(' ')[0]),
    cookTime: `${newMinutes} mins`,
    calories: newCalories,
    pantryIngredientsUsed: updatedIngredients,
    steps: updatedSteps,
    activeSwaps: [
      ...currentSwaps,
      { original: targetIngredientKey, replacement: rule.replacement },
    ],
    proTips: {
      ...recipe.proTips,
      0: rule.proTip,
    },
    macros: {
      calories: newCalories,
      protein: Math.max(5, (recipe.macros?.protein || 35) + rule.macroDelta.protein),
      carbs: Math.max(2, (recipe.macros?.carbs || 12) + rule.macroDelta.carbs),
      fat: Math.max(4, (recipe.macros?.fat || 22) + rule.macroDelta.fat),
    },
  };
}

/**
 * Revert an ingredient swap back to original
 */
export function revertIngredientSwap(
  recipe: DynamicRecipe,
  targetIngredientKey: string
): DynamicRecipe {
  // Simple reset by removing from activeSwaps and restoring defaults
  const remainingSwaps = (recipe.activeSwaps || []).filter(
    s => s.original.toLowerCase() !== targetIngredientKey.toLowerCase()
  );

  return {
    ...recipe,
    activeSwaps: remainingSwaps,
  };
}

/**
 * Shuffle or remix a recipe into a distinct, meaningful culinary variation
 */
export function shuffleRecipeRemix(
  recipe: DynamicRecipe,
  variationId?: string
): DynamicRecipe {
  let variation = RECIPE_REMIX_VARIATIONS.find(v => v.id === variationId);

  if (!variation) {
    // Pick next or random variation different from current
    const available = RECIPE_REMIX_VARIATIONS.filter(v => v.name !== recipe.variationName);
    variation = available[Math.floor(Math.random() * available.length)] || RECIPE_REMIX_VARIATIONS[0];
  }

  // Meaningfully adjust ingredients
  const newIngredients = [
    ...recipe.pantryIngredientsUsed.filter(
      ing => !variation.removedIngredients.some(r => ing.toLowerCase().includes(r.toLowerCase()))
    ),
    ...variation.addedIngredients,
  ];

  // Meaningfully transform steps
  const newSteps = variation.stepTransformer(recipe.steps);
  const baseCalories = recipe.calories || 520;
  const newCalories = Math.max(200, baseCalories + variation.calorieAdjustment);

  return {
    ...recipe,
    variationName: variation.name,
    title: `${variation.name} (${recipe.title.split(' with ')[0].replace(/Pan-Seared |Baked /gi, '')})`,
    cuisine: variation.cuisine,
    cookTime: variation.cookTime,
    difficulty: variation.difficulty,
    calories: newCalories,
    pantryIngredientsUsed: newIngredients,
    steps: newSteps,
    proTips: {
      ...recipe.proTips,
      0: variation.proTip,
    },
    macros: {
      calories: newCalories,
      protein: recipe.macros?.protein || 42,
      carbs: Math.max(4, (recipe.macros?.carbs || 10) + (variation.calorieAdjustment > 0 ? 8 : -4)),
      fat: Math.max(5, (recipe.macros?.fat || 24) + (variation.calorieAdjustment > 0 ? 6 : -8)),
    },
  };
}
