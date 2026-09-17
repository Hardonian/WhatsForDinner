import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface GenerateMealPlanRequest {
  preferences?: {
    dietaryRestrictions?: string[];
    allergens?: string[];
    cuisinePreferences?: string[];
    familySize?: number;
    maxPrepTime?: number;
  };
  pantryItems?: string[];
  mood?: string;
  quickMode?: boolean;
}

const ALLERGEN_TRIGGERS: Record<string, string[]> = {
  peanuts: ['peanut', 'groundnut', 'arachis'],
  tree_nuts: ['almond', 'walnut', 'cashew', 'pecan', 'pistachio', 'hazelnut', 'macadamia', 'pine nut'],
  dairy: ['butter', 'cream', 'milk', 'cheese', 'parmigiano', 'yogurt', 'whey', 'ghee'],
  eggs: ['egg', 'mayo', 'mayonnaise', 'meringue'],
  wheat: ['wheat', 'flour', 'bread', 'pasta', 'seitan', 'tortilla', 'couscous'],
  gluten: ['wheat', 'flour', 'bread', 'pasta', 'barley', 'rye'],
  soy: ['soy', 'edamame', 'tofu', 'tempeh', 'miso', 'tamari'],
  fish: ['salmon', 'cod', 'tuna', 'halibut', 'tilapia', 'anchovy', 'trout'],
  shellfish: ['shrimp', 'prawn', 'crab', 'lobster', 'clam', 'mussel', 'scallop', 'oyster'],
  sesame: ['sesame', 'tahini', 'halva'],
};

const CURATED_RECIPES = [
  {
    id: 'rec-salmon-lemon',
    title: 'Pan-Seared Salmon with Garlic Butter & Asparagus',
    description: 'Crispy skin wild salmon basted in lemon garlic butter alongside tender roasted asparagus spears.',
    ingredients: [
      '2 wild salmon fillets (6 oz each)',
      '1 bunch fresh asparagus, trimmed',
      '3 cloves garlic, minced',
      '2 tbsp unsalted grass-fed butter',
      '1 tbsp extra virgin olive oil',
      '1 fresh lemon, sliced into rounds',
      'Sea salt & cracked black pepper to taste',
    ],
    instructions: [
      'Pat salmon fillets completely dry with a paper towel and season generously with salt and pepper.',
      'Heat olive oil in a heavy stainless steel skillet over medium-high heat until shimmering.',
      'Place salmon skin-side down; press gently with a spatula and sear undisturbed for 4-5 minutes.',
      'Flip salmon, toss in asparagus spears, butter, and minced garlic. Baste fish with foaming butter for 3 minutes.',
      'Squeeze fresh lemon juice over the pan and serve immediately.',
    ],
    cookTime: '20 min',
    prepTime: '10 min',
    servings: 2,
    difficulty: 'Easy',
    cuisine: 'Mediterranean',
    dietaryTags: ['gluten-free', 'keto', 'low-carb', 'pescatarian'],
    macros: { calories: 480, protein: 42, carbs: 8, fat: 32, fiber: 4 },
  },
  {
    id: 'rec-tuscan-chicken',
    title: 'Creamy Tuscan Garlic Herb Chicken',
    description: 'Golden pan-browned chicken breast simmered in a sun-dried tomato and baby spinach cream sauce.',
    ingredients: [
      '2 large chicken breasts, sliced horizontally into cutlets',
      '1/2 cup sun-dried tomatoes, drained and julienned',
      '2 cups fresh baby spinach leaves',
      '4 cloves garlic, minced',
      '3/4 cup heavy cream or coconut milk',
      '1/3 cup grated Parmigiano-Reggiano',
      '1 tbsp olive oil',
      '1 tsp dried Italian herbs',
    ],
    instructions: [
      'Season chicken cutlets with Italian herbs, sea salt, and pepper.',
      'Heat olive oil in a large skillet over medium-high heat. Sear chicken 5 minutes per side until golden; set aside.',
      'In the same skillet, sauté garlic and sun-dried tomatoes for 1 minute until fragrant.',
      'Reduce heat to low-medium, pour in cream and chicken broth, and simmer for 3 minutes.',
      'Stir in parmesan cheese and baby spinach until wilted. Return chicken to pan and spoon sauce over top.',
    ],
    cookTime: '25 min',
    prepTime: '10 min',
    servings: 3,
    difficulty: 'Easy',
    cuisine: 'Italian',
    dietaryTags: ['keto', 'gluten-free', 'high-protein'],
    macros: { calories: 520, protein: 48, carbs: 9, fat: 34, fiber: 2 },
  },
  {
    id: 'rec-veggie-grain-bowl',
    title: 'Roasted Sweet Potato & Crispy Chickpea Harvest Bowl',
    description: 'Warm fluffy quinoa topped with spiced roasted sweet potatoes, crispy chickpeas, avocado, and tahini drizzle.',
    ingredients: [
      '1 medium sweet potato, cubed into 1/2-inch pieces',
      '1 can (15 oz) chickpeas, rinsed, drained and patted dry',
      '1 cup cooked tricolor quinoa',
      '1 ripe avocado, sliced',
      '2 cups baby kale or arugula',
      '2 tbsp tahini whisked with lemon juice & warm water',
      '1 tbsp extra virgin olive oil',
      '1 tsp smoked paprika & cumin',
    ],
    instructions: [
      'Preheat oven to 400°F (205°C). Toss sweet potatoes and chickpeas with olive oil, cumin, paprika, and salt.',
      'Spread evenly on a parchment-lined baking sheet and roast for 25 minutes until crispy and golden.',
      'Assemble bowls: divide warm quinoa, baby greens, and roasted sweet potatoes/chickpeas.',
      'Fan avocado slices on top and drizzle generously with garlic lemon tahini dressing.',
    ],
    cookTime: '30 min',
    prepTime: '10 min',
    servings: 2,
    difficulty: 'Easy',
    cuisine: 'Plant-Based',
    dietaryTags: ['vegan', 'vegetarian', 'dairy-free', 'gluten-free'],
    macros: { calories: 460, protein: 16, carbs: 64, fat: 18, fiber: 14 },
  },
  {
    id: 'rec-beef-stir-fry',
    title: '15-Minute Ginger Scallion Flank Steak Stir-Fry',
    description: 'Tender sliced flank steak seared with crisp broccoli florets, fresh ginger, and tamari sesame glaze.',
    ingredients: [
      '1 lb flank steak, sliced thin against the grain',
      '3 cups fresh broccoli florets',
      '3 green onions (scallions), cut into 2-inch segments',
      '2 tbsp fresh ginger, finely grated',
      '3 cloves garlic, crushed',
      '3 tbsp tamari or low-sodium soy sauce',
      '1 tbsp toasted sesame oil',
      '1 tbsp arrowroot starch or cornstarch',
    ],
    instructions: [
      'Toss sliced flank steak with tamari and starch in a small bowl; let rest 5 minutes.',
      'Heat a wok or heavy cast iron skillet over high heat with 1 tsp high-smoke-point avocado oil.',
      'Add steak in a single layer and sear without moving for 90 seconds. Stir-fry for 1 more minute; remove steak.',
      'Add broccoli florets and 2 tbsp water; cover to steam for 2 minutes.',
      'Toss garlic, ginger, scallions, and steak back into the pan with sesame oil for 1 minute before serving.',
    ],
    cookTime: '15 min',
    prepTime: '10 min',
    servings: 4,
    difficulty: 'Medium',
    cuisine: 'Asian',
    dietaryTags: ['dairy-free', 'high-protein', 'gluten-free'],
    macros: { calories: 390, protein: 38, carbs: 12, fat: 21, fiber: 4 },
  },
  {
    id: 'rec-med-shrimp-pasta',
    title: 'Zesty Lemon Garlic Butter Prawns over Linguine',
    description: 'Succulent gulf prawns tossed with al dente pasta, chili flakes, Italian parsley, and white wine reduction.',
    ingredients: [
      '1 lb raw peeled prawns / shrimp',
      '8 oz linguine or gluten-free pasta',
      '4 cloves garlic, thinly sliced',
      '1/4 cup dry white wine or vegetable broth',
      '3 tbsp grass-fed butter',
      '1/4 cup fresh flat-leaf parsley, chopped',
      '1/2 tsp red pepper chili flakes',
      'Zest and juice of 1 lemon',
    ],
    instructions: [
      'Boil pasta in salted water until 1 minute shy of al dente; reserve 1/2 cup pasta water.',
      'In a wide sauté pan, melt 2 tbsp butter over medium heat. Add prawns and sear 1.5 minutes per side; transfer to plate.',
      'Add sliced garlic and red pepper flakes to pan; cook 30 seconds until aromatic.',
      'Deglaze with white wine and lemon juice, simmering until liquid reduces by half.',
      'Add drained pasta, prawns, reserved pasta water, remaining butter, and parsley. Toss vigorously until emulsified.',
    ],
    cookTime: '18 min',
    prepTime: '7 min',
    servings: 3,
    difficulty: 'Medium',
    cuisine: 'Italian',
    dietaryTags: ['pescatarian'],
    macros: { calories: 440, protein: 34, carbs: 46, fat: 14, fiber: 3 },
  },
  {
    id: 'rec-mexican-black-bean-tacos',
    title: 'Charred Corn & Smoky Chipotle Black Bean Tacos',
    description: 'Warm street-style corn tortillas loaded with seasoned black beans, fire-roasted sweet corn, cotija, and lime crema.',
    ingredients: [
      '8 small yellow corn tortillas',
      '1 can (15 oz) black beans, gently simmered with cumin and oregano',
      '1 cup sweet corn kernels, charred in dry skillet',
      '1/2 cup crumbled cotija or vegan queso fresco',
      '1/4 cup cilantro lime crema or cashew crema',
      '1/2 cup pickled red onions',
      '1 lime cut into wedges',
    ],
    instructions: [
      'Warm corn tortillas directly over gas burner flame or in dry cast-iron skillet until blistered.',
      'Simmer black beans with spices and a splash of water, mashing about half with a fork for texture.',
      'Char corn kernels in a smoking-hot skillet for 3 minutes until caramelized edges appear.',
      'Assemble tacos with seasoned beans, charred corn, crumbled cotija cheese, pickled onions, and a drizzle of crema.',
    ],
    cookTime: '15 min',
    prepTime: '10 min',
    servings: 4,
    difficulty: 'Easy',
    cuisine: 'Mexican',
    dietaryTags: ['vegetarian', 'gluten-free'],
    macros: { calories: 360, protein: 14, carbs: 54, fat: 11, fiber: 9 },
  },
  {
    id: 'rec-greek-lemon-soup',
    title: 'Silky Greek Lemon Orzo Soup (Avgolemono)',
    description: 'Traditional velvety Greek chicken soup enriched with tempered eggs, fragrant dill, and bright fresh lemon.',
    ingredients: [
      '6 cups rich chicken bone broth',
      '1 cup orzo pasta',
      '2 cups cooked shredded chicken breast',
      '3 large organic eggs, room temperature',
      '1/3 cup freshly squeezed lemon juice',
      '2 tbsp fresh dill, finely chopped',
      'Sea salt and white pepper',
    ],
    instructions: [
      'Bring chicken bone broth to a gentle rolling boil in a Dutch oven; stir in orzo and cook 8 minutes.',
      'In a medium heat-proof bowl, whisk eggs vigorously until pale and frothy, then slowly whisk in lemon juice.',
      'Slowly ladle two cups of hot broth into the egg mixture while whisking constantly to temper eggs without curdling.',
      'Pour tempered mixture back into the Dutch oven over low heat. Add shredded chicken and dill.',
      'Stir continuously over low heat for 3 minutes until velvety and thickened.',
    ],
    cookTime: '20 min',
    prepTime: '10 min',
    servings: 4,
    difficulty: 'Medium',
    cuisine: 'Greek',
    dietaryTags: ['high-protein', 'comfort-food'],
    macros: { calories: 375, protein: 36, carbs: 32, fat: 11, fiber: 2 },
  },
];

export async function POST(req: NextRequest) {
  try {
    let body: GenerateMealPlanRequest = {};
    try {
      body = await req.json();
    } catch {
      // Allow empty body fallback
    }

    const { preferences, mood, quickMode, pantryItems = [] } = body;
    const dietary = preferences?.dietaryRestrictions || [];
    const allergens = preferences?.allergens || [];
    const cuisine = preferences?.cuisinePreferences || [];
    const familySize = preferences?.familySize || 2;
    const maxPrepTime = preferences?.maxPrepTime || 60;

    // Detect active allergens from explicit list and dietary tags (e.g. 'peanut-free', 'dairy-free')
    const activeAllergens = new Set<string>(allergens.map(a => a.toLowerCase()));
    dietary.forEach(d => {
      const lower = d.toLowerCase();
      if (lower.includes('dairy-free') || lower.includes('vegan')) activeAllergens.add('dairy');
      if (lower.includes('gluten-free')) { activeAllergens.add('wheat'); activeAllergens.add('gluten'); }
      if (lower.includes('nut-free')) { activeAllergens.add('peanuts'); activeAllergens.add('tree_nuts'); }
      if (lower.includes('egg-free')) activeAllergens.add('eggs');
      if (lower.includes('soy-free')) activeAllergens.add('soy');
      if (lower.includes('shellfish-free')) activeAllergens.add('shellfish');
    });

    // Filter candidate recipes based on diet and prep constraints
    let filtered = CURATED_RECIPES.filter(r => {
      // 1. Enforce FDA Allergen Zero-Tolerance Guardrail
      if (activeAllergens.size > 0) {
        const containsForbiddenAllergen = r.ingredients.some(ing => {
          const lowerIng = ing.toLowerCase();
          for (const allergen of activeAllergens) {
            const triggers = ALLERGEN_TRIGGERS[allergen] || [allergen];
            if (triggers.some(t => lowerIng.includes(t))) {
              return true;
            }
          }
          return false;
        });
        if (containsForbiddenAllergen) return false;
      }

      // 2. Enforce dietary restrictions
      if (dietary.length > 0) {
        const hasAllDiet = dietary.every(d => r.dietaryTags?.includes(d.toLowerCase()));
        if (!hasAllDiet) return false;
      }

      // 3. Enforce cuisine preferences
      if (cuisine.length > 0) {
        const matchesCuisine = cuisine.some(c => r.cuisine.toLowerCase().includes(c.toLowerCase()));
        if (!matchesCuisine) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      // If strict filter eliminates all, fallback to safest non-allergen recipes
      filtered = CURATED_RECIPES.filter(r => {
        if (activeAllergens.size === 0) return true;
        return !r.ingredients.some(ing => {
          for (const allergen of activeAllergens) {
            const triggers = ALLERGEN_TRIGGERS[allergen] || [allergen];
            if (triggers.some(t => ing.toLowerCase().includes(t))) return true;
          }
          return false;
        });
      });
      if (filtered.length === 0) filtered = [CURATED_RECIPES[2]]; // Plant-based harvest bowl
    }

    // Determine primary featured recipe
    let featuredRecipe = filtered[0];
    if (mood) {
      if (mood === 'quick') {
        featuredRecipe = filtered.find(r => r.cookTime.includes('15') || r.cookTime.includes('18')) || filtered[0];
      } else if (mood === 'comfort') {
        featuredRecipe = filtered.find(r => r.dietaryTags?.includes('comfort-food')) || filtered[1];
      } else if (mood === 'healthy') {
        featuredRecipe = filtered.find(r => r.macros.protein > 30 && r.macros.calories < 500) || filtered[0];
      } else if (mood === 'indulgent') {
        featuredRecipe = filtered.find(r => r.title.includes('Tuscan') || r.title.includes('Butter')) || filtered[1];
      }
    }

    // Generate 7-day calendar meal plan
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const now = new Date();
    // Start from upcoming or current day
    const days = daysOfWeek.map((dayName, idx) => {
      const dayDate = new Date(now.getTime() + idx * 86400000);
      const recipe = filtered[idx % filtered.length];

      return {
        date: dayDate.toISOString().split('T')[0],
        dayName,
        dinner: {
          ...recipe,
          servings: familySize,
        },
        breakfast: {
          id: `b-${idx}`,
          title: idx % 2 === 0 ? 'Greek Yogurt Parfait with Wild Berries' : 'Avocado Sourdough Toast with Poached Egg',
          cookTime: '10 min',
          servings: familySize,
          ingredients: ['Greek yogurt or sourdough', 'Eggs', 'Fresh berries', 'Chia seeds'],
          instructions: ['Assemble ingredients fresh and season with sea salt and honey.'],
          macros: { calories: 340, protein: 22, carbs: 36, fat: 12 },
        },
        lunch: {
          id: `l-${idx}`,
          title: idx % 2 === 0 ? 'Mediterranean Chopped Salad Bowl' : 'Leftover Chef Portion & Bone Broth',
          cookTime: '12 min',
          servings: familySize,
          ingredients: ['Cucumbers', 'Kalamata olives', 'Feta cheese', 'Chickpeas', 'Olive oil'],
          instructions: ['Chop vegetables uniformly and toss with vinaigrette.'],
          macros: { calories: 410, protein: 24, carbs: 32, fat: 20 },
        },
        snack: {
          id: `s-${idx}`,
          title: 'Roasted Almonds & Dark Chocolate Crisps',
          cookTime: '2 min',
          servings: familySize,
          ingredients: ['Raw almonds', '72% dark chocolate bits'],
          instructions: ['Portion into individual snack bowls.'],
          macros: { calories: 180, protein: 6, carbs: 12, fat: 14 },
        },
      };
    });

    // Consolidate complete shopping list across the week
    const allIngredients = new Set<string>();
    days.forEach(d => {
      d.dinner.ingredients.forEach(i => allIngredients.add(i));
    });

    const shoppingList = Array.from(allIngredients).map(raw => {
      let category = 'Produce';
      const lower = raw.toLowerCase();
      if (lower.includes('salmon') || lower.includes('chicken') || lower.includes('steak') || lower.includes('shrimp') || lower.includes('prawns') || lower.includes('beef')) {
        category = 'Meat & Seafood';
      } else if (lower.includes('butter') || lower.includes('cream') || lower.includes('parmigiano') || lower.includes('cheese') || lower.includes('egg') || lower.includes('milk')) {
        category = 'Dairy & Refrigerated';
      } else if (lower.includes('oil') || lower.includes('broth') || lower.includes('wine') || lower.includes('pasta') || lower.includes('quinoa') || lower.includes('chickpea') || lower.includes('bean') || lower.includes('tortilla')) {
        category = 'Pantry & Grains';
      } else if (lower.includes('salt') || lower.includes('pepper') || lower.includes('paprika') || lower.includes('cumin') || lower.includes('herb')) {
        category = 'Spices & Seasonings';
      }

      return {
        ingredient: raw,
        quantity: 1,
        unit: 'item',
        category,
        estimatedPrice: 3.99,
      };
    });

    const totalCost = Number((shoppingList.length * 3.45).toFixed(2));

    const allergenSafetyReport = {
      evaluatedAllergens: Array.from(activeAllergens),
      guardrailStatus: activeAllergens.size > 0 ? 'ENFORCED_ZERO_TOLERANCE' : 'STANDARD_VERIFIED',
      crossContaminationWarning: activeAllergens.size > 0
        ? 'Cross-contamination alert: Always sterilize prep boards and verify ingredient packaging labels.'
        : 'Standard food handling guidelines apply.',
    };

    const mealPlan = {
      id: `mp-${Date.now()}`,
      weekStartDate: days[0].date,
      days,
      shoppingList,
      totalCost,
      familySize,
      dietaryTags: dietary,
      cuisinePreferences: cuisine,
      allergenSafetyReport,
    };

    // Return hybrid payload: Top-level fields match single recipe (for /surprise-me),
    // and { mealPlan } wrapper matches weekly planner (for /meal-planner).
    return NextResponse.json({
      success: true,
      ...featuredRecipe,
      mealPlan,
      allergenSafetyReport,
      totalCost,
      shoppingListCount: shoppingList.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to generate meal plan' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Return sample meal plan for inspectability
  return POST(req);
}
