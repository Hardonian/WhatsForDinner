import { NextResponse } from 'next/server';

export interface SwipeCard {
  id: string;
  title: string;
  cuisine: string;
  cookTime: string;
  calories: number;
  pantryMatchPct: number;
  imageEmoji: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  dietary: string[];
  keyIngredients: string[];
  description: string;
}

const SWIPE_DECK: SwipeCard[] = [
  {
    id: 'swipe-1',
    title: 'Creamy Lemon Ricotta Pasta',
    cuisine: 'Italian',
    cookTime: '18 min',
    calories: 450,
    pantryMatchPct: 95,
    imageEmoji: '🍋',
    difficulty: 'Easy',
    dietary: ['Vegetarian'],
    keyIngredients: ['Rigatoni', 'Ricotta cheese', 'Fresh lemon', 'Parmesan', 'Cracked pepper'],
    description: 'Bright citrus oil emulsified with creamy ricotta and pasta water into velvety luxury.',
  },
  {
    id: 'swipe-2',
    title: 'Cast-Iron Ribeye with Herb Butter',
    cuisine: 'Steakhouse',
    cookTime: '20 min',
    calories: 640,
    pantryMatchPct: 80,
    imageEmoji: '🥩',
    difficulty: 'Medium',
    dietary: ['Keto', 'High-Protein', 'Gluten-Free'],
    keyIngredients: ['Ribeye steak', 'Butter', 'Fresh thyme & rosemary', 'Garlic cloves'],
    description: 'Deep mahogany crust basted with foaming herbal butter and garlic.',
  },
  {
    id: 'swipe-3',
    title: 'Honey Chipotle Glazed Salmon Bowl',
    cuisine: 'Fusion',
    cookTime: '22 min',
    calories: 490,
    pantryMatchPct: 90,
    imageEmoji: '🐟',
    difficulty: 'Easy',
    dietary: ['Pescatarian', 'Dairy-Free'],
    keyIngredients: ['Salmon fillet', 'Chipotle in adobo', 'Honey', 'Brown rice', 'Avocado'],
    description: 'Sweet and smoky caramelized salmon over fluffy cilantro rice and creamy avocado.',
  },
  {
    id: 'swipe-4',
    title: 'Street-Style Chicken Quesadillas',
    cuisine: 'Mexican',
    cookTime: '15 min',
    calories: 520,
    pantryMatchPct: 100,
    imageEmoji: '🧀',
    difficulty: 'Easy',
    dietary: ['Kid-Friendly'],
    keyIngredients: ['Flour tortillas', 'Shredded chicken', 'Monterey Jack', 'Salsa verde'],
    description: 'Crispy, butter-toasted tortillas stuffed with gooey melted cheese and tender seasoned chicken.',
  },
  {
    id: 'swipe-5',
    title: 'Crispy Pork & Chive Potstickers with Dipping Sauce',
    cuisine: 'Asian Dumplings',
    cookTime: '20 min',
    calories: 420,
    pantryMatchPct: 85,
    imageEmoji: '🥟',
    difficulty: 'Medium',
    dietary: ['Dairy-Free'],
    keyIngredients: ['Dumpling wrappers', 'Ground pork', 'Garlic chives', 'Soy sauce', 'Chili crisp'],
    description: 'Golden lace-bottom potstickers steamed tender and served with hot chili black vinegar.',
  },
  {
    id: 'swipe-6',
    title: 'Classic Margherita Sourdough Pizza',
    cuisine: 'Napoli',
    cookTime: '15 min',
    calories: 540,
    pantryMatchPct: 90,
    imageEmoji: '🍕',
    difficulty: 'Medium',
    dietary: ['Vegetarian'],
    keyIngredients: ['Pizza dough', 'San Marzano tomatoes', 'Fresh mozzarella', 'Fresh basil'],
    description: 'Blistered crust with sweet tomato passata and melted fresh mozzarella rounds.',
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6', 10);

    const shuffled = [...SWIPE_DECK].sort(() => 0.5 - Math.random()).slice(0, limit);

    return NextResponse.json({
      cards: shuffled,
      deckCount: shuffled.length,
      swipeModes: ['solo', 'couples_sync'],
      tips: 'Swipe Right or tap Heart to save, Swipe Left to pass, Tap Star to Cook Tonight!',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch swipe cards' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { cardId, action } = body; // action: 'like' | 'pass' | 'superlike'

    const card = SWIPE_DECK.find(c => c.id === cardId) || SWIPE_DECK[0];

    const isMatch = action === 'superlike' || (action === 'like' && Math.random() > 0.4);

    return NextResponse.json({
      success: true,
      cardId,
      action,
      isMatch,
      matchedMeal: isMatch ? card : null,
      xpEarned: action === 'superlike' ? 25 : (action === 'like' ? 10 : 2),
      message: isMatch 
        ? `🔥 It's a Dinner Match! You selected ${card.title}!` 
        : `Recorded ${action} for ${card.title}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to record swipe' }, { status: 500 });
  }
}
