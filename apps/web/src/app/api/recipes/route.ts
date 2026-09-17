import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export interface ApiRecipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookTime: string;
  prepTime: string;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cuisine: string;
  dietaryTags: string[];
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  pantryMatchScore?: number;
  author?: string;
  imageUrl?: string;
  createdAt: string;
}

const LIVE_RECIPES_STORE: ApiRecipe[] = [
  {
    id: 'recipe-salmon-01',
    title: 'Pan-Seared Garlic Herb Salmon',
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
      'Pat salmon dry; season with salt and pepper.',
      'Sear skin-side down in hot olive oil for 4 minutes.',
      'Flip salmon, toss in asparagus, butter, and garlic. Baste for 3 minutes.',
      'Finish with fresh lemon juice and serve hot.',
    ],
    cookTime: '20 min',
    prepTime: '10 min',
    servings: 2,
    difficulty: 'Easy',
    cuisine: 'Mediterranean',
    dietaryTags: ['gluten-free', 'keto', 'low-carb', 'pescatarian'],
    macros: { calories: 480, protein: 42, carbs: 8, fat: 32, fiber: 4 },
    author: 'Chef Gordon (Executive)',
    createdAt: '2026-03-01T12:00:00Z',
  },
  {
    id: 'recipe-chicken-tuscan',
    title: 'Creamy Tuscan Sun-Dried Tomato Chicken',
    description: 'Tender chicken cutlets in a velvety garlic cream sauce loaded with baby spinach and sun-dried tomatoes.',
    ingredients: [
      '2 large chicken breasts, sliced horizontally',
      '1/2 cup sun-dried tomatoes in oil',
      '2 cups fresh baby spinach',
      '4 cloves garlic, minced',
      '3/4 cup heavy cream',
      '1/3 cup grated Parmigiano-Reggiano',
      '1 tbsp olive oil',
    ],
    instructions: [
      'Brown chicken 5 min per side; set aside.',
      'Sauté garlic and sun-dried tomatoes in remaining pan juices.',
      'Pour cream and broth; simmer for 3 minutes.',
      'Fold in parmesan and spinach until melted and creamy.',
      'Return chicken and spoon sauce over cutlets.',
    ],
    cookTime: '25 min',
    prepTime: '10 min',
    servings: 3,
    difficulty: 'Easy',
    cuisine: 'Italian',
    dietaryTags: ['keto', 'gluten-free', 'high-protein'],
    macros: { calories: 520, protein: 48, carbs: 9, fat: 34, fiber: 2 },
    author: 'Chef Isabella',
    createdAt: '2026-03-05T14:30:00Z',
  },
  {
    id: 'recipe-tacos-blackbean',
    title: 'Charred Corn & Chipotle Black Bean Tacos',
    description: 'Crispy warm tortillas layered with smoky cumin black beans, fire-roasted sweet corn, and lime crema.',
    ingredients: [
      '8 yellow corn tortillas',
      '1 can (15 oz) black beans',
      '1 cup sweet corn kernels',
      '1/2 cup crumbled cotija cheese',
      '1/4 cup cilantro lime crema',
      '1/2 cup pickled red onions',
    ],
    instructions: [
      'Char corn kernels in smoking skillet.',
      'Warm and lightly mash black beans with cumin and oregano.',
      'Toast tortillas directly over flame.',
      'Assemble tacos with beans, corn, cotija, onions, and crema.',
    ],
    cookTime: '15 min',
    prepTime: '10 min',
    servings: 4,
    difficulty: 'Easy',
    cuisine: 'Mexican',
    dietaryTags: ['vegetarian', 'gluten-free'],
    macros: { calories: 360, protein: 14, carbs: 54, fat: 11, fiber: 9 },
    author: 'Chef Marco',
    createdAt: '2026-03-08T18:00:00Z',
  },
  {
    id: 'recipe-beef-stirfry',
    title: '15-Minute Ginger Tamari Beef & Broccoli Stir-Fry',
    description: 'Thinly sliced flank steak seared with crisp broccoli florets in a rich ginger-tamari glaze.',
    ingredients: [
      '1 lb flank steak, sliced thin',
      '3 cups fresh broccoli florets',
      '3 scallions, cut into 2-inch segments',
      '2 tbsp fresh ginger, grated',
      '3 cloves garlic, minced',
      '3 tbsp tamari',
      '1 tbsp toasted sesame oil',
    ],
    instructions: [
      'Toss flank steak with tamari and a pinch of starch.',
      'Sear beef in smoking hot wok 90 seconds; set aside.',
      'Steam broccoli florets with 2 tbsp water for 2 minutes.',
      'Return beef with garlic, ginger, and sesame oil; toss 1 minute.',
    ],
    cookTime: '15 min',
    prepTime: '10 min',
    servings: 4,
    difficulty: 'Medium',
    cuisine: 'Asian',
    dietaryTags: ['dairy-free', 'high-protein', 'gluten-free'],
    macros: { calories: 390, protein: 38, carbs: 12, fat: 21, fiber: 4 },
    author: 'Chef Kenji',
    createdAt: '2026-03-10T19:15:00Z',
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const query = searchParams.get('q')?.toLowerCase();
    const diet = searchParams.get('diet')?.toLowerCase();
    const cuisine = searchParams.get('cuisine')?.toLowerCase();
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);

    if (id) {
      const recipe = LIVE_RECIPES_STORE.find(r => r.id === id);
      if (!recipe) {
        return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
      }
      return NextResponse.json({ recipe });
    }

    let results = LIVE_RECIPES_STORE.filter(r => {
      if (query) {
        const titleMatch = r.title.toLowerCase().includes(query);
        const descMatch = r.description.toLowerCase().includes(query);
        const ingMatch = r.ingredients.some(i => i.toLowerCase().includes(query));
        if (!titleMatch && !descMatch && !ingMatch) return false;
      }
      if (diet) {
        if (!r.dietaryTags.some(t => t.toLowerCase() === diet)) return false;
      }
      if (cuisine) {
        if (!r.cuisine.toLowerCase().includes(cuisine)) return false;
      }
      return true;
    });

    const total = results.length;
    const startIndex = (page - 1) * limit;
    const paginated = results.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      recipes: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to search recipes' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { title, ingredients, instructions, cookTime, servings, cuisine, dietaryTags } = body;

    if (!title || !ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { error: 'Recipe requires title and at least one ingredient' },
        { status: 400 }
      );
    }

    const newRecipe: ApiRecipe = {
      id: `recipe-${Date.now()}`,
      title,
      description: body.description || `Delicious chef-crafted ${title} recipe.`,
      ingredients,
      instructions: instructions && Array.isArray(instructions) ? instructions : ['Prepare fresh ingredients and cook to perfection.'],
      cookTime: cookTime || '25 min',
      prepTime: body.prepTime || '10 min',
      servings: servings || 4,
      difficulty: body.difficulty || 'Easy',
      cuisine: cuisine || 'American',
      dietaryTags: dietaryTags && Array.isArray(dietaryTags) ? dietaryTags : [],
      macros: body.macros || {
        calories: 450,
        protein: 30,
        carbs: 40,
        fat: 18,
        fiber: 5,
      },
      author: body.author || 'Community Chef',
      createdAt: new Date().toISOString(),
    };

    LIVE_RECIPES_STORE.unshift(newRecipe);

    return NextResponse.json({ success: true, recipe: newRecipe }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to create recipe' },
      { status: 500 }
    );
  }
}
