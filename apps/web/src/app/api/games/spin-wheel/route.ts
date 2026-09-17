import { NextResponse } from 'next/server';

export interface WheelCategory {
  id: string;
  label: string;
  color: string;
  gradient: string;
  icon: string;
  description: string;
  exampleDishes: string[];
}

const DEFAULT_CATEGORIES: WheelCategory[] = [
  {
    id: 'quick-easy',
    label: '15-Min Quick',
    color: '#eab308',
    gradient: 'from-amber-500 to-yellow-400',
    icon: '⚡',
    description: 'Lightning fast recipes ready in under 15 minutes',
    exampleDishes: ['Garlic Butter Shrimp Pasta', 'Sesame Chili Noodles', '10-Minute Egg Roll Bowl'],
  },
  {
    id: 'comfort',
    label: 'Comfort Food',
    color: '#f97316',
    gradient: 'from-orange-500 to-amber-500',
    icon: '🍲',
    description: 'Hearty, cozy classics that warm the soul',
    exampleDishes: ['Creamy Tuscan Chicken', 'Slow-Simmered Beef Ragu', 'Classic Cheddar Mac & Cheese'],
  },
  {
    id: 'healthy-fresh',
    label: 'Healthy & Fresh',
    color: '#22c55e',
    gradient: 'from-emerald-500 to-green-400',
    icon: '🥗',
    description: 'Nutrient-rich, vibrant, low-carb options',
    exampleDishes: ['Mediterranean Salmon Bowl', 'Lemon Herb Quinoa Salad', 'Thai Basil Turkey Lettuce Wraps'],
  },
  {
    id: 'asian-fusion',
    label: 'Asian Fusion',
    color: '#06b6d4',
    gradient: 'from-cyan-500 to-blue-500',
    icon: '🥢',
    description: 'Bold umami, ginger, and wok-fired aromas',
    exampleDishes: ['Crispy Honey Soy Tofu', 'Spicy Korean Beef Rice Bowl', 'Japanese Chicken Katsu Curry'],
  },
  {
    id: 'italian',
    label: 'Italian Night',
    color: '#ef4444',
    gradient: 'from-rose-500 to-red-600',
    icon: '🍝',
    description: 'Rustic pastas, rich pomodoro, and aromatic basil',
    exampleDishes: ['Penne Alla Vodka', 'Classic Margherita Flatbread', 'Sun-Dried Tomato Pesto Chicken'],
  },
  {
    id: 'mexican-fiesta',
    label: 'Taco Fiesta',
    color: '#a855f7',
    gradient: 'from-purple-500 to-pink-500',
    icon: '🌮',
    description: 'Zesty salsas, lime, roasted peppers, and street tacos',
    exampleDishes: ['Street Style Carnitas Tacos', 'Chipotle Lime Chicken Fajitas', 'Cheesy Black Bean Enchiladas'],
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dietary = searchParams.get('dietary'); // vegetarian, gluten-free, keto, etc.

    let categories = [...DEFAULT_CATEGORIES];
    if (dietary === 'vegetarian') {
      categories = categories.map(cat => ({
        ...cat,
        exampleDishes: cat.exampleDishes.filter(d => !d.toLowerCase().includes('chicken') && !d.toLowerCase().includes('beef') && !d.toLowerCase().includes('pork') && !d.toLowerCase().includes('carnitas')),
      }));
    }

    return NextResponse.json({
      categories,
      totalCount: categories.length,
      bonusMultiplier: 1.5,
      rules: {
        minSpinsForQuest: 1,
        xpReward: 25,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch wheel categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { categoryId, excludedIds = [] } = body;

    const category = DEFAULT_CATEGORIES.find(c => c.id === categoryId) || 
      DEFAULT_CATEGORIES[Math.floor(Math.random() * DEFAULT_CATEGORIES.length)];

    const dishName = category.exampleDishes[Math.floor(Math.random() * category.exampleDishes.length)];
    const recipeId = `recipe-${category.id}-${Date.now().toString(36)}`;

    const recipe = {
      id: recipeId,
      title: dishName,
      category: category.label,
      categoryId: category.id,
      description: `A delicious ${category.description.toLowerCase()} featuring balanced flavors and pantry ingredients.`,
      prepTime: '10 mins',
      cookTime: '20 mins',
      servings: 4,
      difficulty: 'Easy',
      calories: 480,
      xpAwarded: 25,
      ingredients: [
        'Main protein / base ingredient',
        'Aromatic herbs & garlic',
        'Extra virgin olive oil or butter',
        'Fresh seasoning & spices',
        'Seasonal vegetables',
      ],
      instructions: [
        'Prepare and season your main ingredients.',
        'Sauté aromatics in a hot pan until fragrant.',
        'Combine with main elements and simmer to perfection.',
        'Garnish with fresh herbs and serve hot.',
      ],
    };

    return NextResponse.json({
      success: true,
      category,
      recipe,
      xpEarned: 25,
      message: `Wheel decided on ${category.label}!`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to process spin' }, { status: 500 });
  }
}
