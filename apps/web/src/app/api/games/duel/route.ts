import { NextResponse } from 'next/server';

export interface DuelCandidate {
  id: string;
  title: string;
  cuisine: string;
  time: string;
  calories: number;
  difficulty: string;
  imageEmoji: string;
  tags: string[];
  description: string;
}

const DUEL_ROSTER: DuelCandidate[] = [
  {
    id: 'duel-1',
    title: 'Creamy Garlic Butter Steak Bites',
    cuisine: 'American Steakhouse',
    time: '20 min',
    calories: 550,
    difficulty: 'Easy',
    imageEmoji: '🥩',
    tags: ['High Protein', 'Keto', 'Quick'],
    description: 'Tender sirloin cubes seared in garlic butter and finished with fresh rosemary.',
  },
  {
    id: 'duel-2',
    title: 'Authentic Thai Green Curry',
    cuisine: 'Thai',
    time: '25 min',
    calories: 420,
    difficulty: 'Medium',
    imageEmoji: '🍲',
    tags: ['Aromatic', 'Spicy', 'Dairy-Free'],
    description: 'Rich coconut milk broth infused with kaffir lime leaves, bamboo shoots, and tender chicken.',
  },
  {
    id: 'duel-3',
    title: 'Crispy Honey Mustard Salmon',
    cuisine: 'Seafood',
    time: '18 min',
    calories: 460,
    difficulty: 'Easy',
    imageEmoji: '🐟',
    tags: ['Omega-3', 'Gluten-Free', 'Healthy'],
    description: 'Flaky Atlantic salmon glazed with dijon honey sauce and baked until caramelized.',
  },
  {
    id: 'duel-4',
    title: 'Truffle Mushroom Risotto',
    cuisine: 'Italian',
    time: '30 min',
    calories: 510,
    difficulty: 'Medium',
    imageEmoji: '🍄',
    tags: ['Vegetarian', 'Gourmet', 'Comfort'],
    description: 'Creamy arborio rice with wild cremini and shiitake mushrooms, parmesan, and white truffle oil.',
  },
  {
    id: 'duel-5',
    title: 'Street-Style Birria Tacos',
    cuisine: 'Mexican',
    time: '35 min',
    calories: 580,
    difficulty: 'Medium',
    imageEmoji: '🌮',
    tags: ['Crowd Favorite', 'Cheesy', 'Bold'],
    description: 'Crispy corn tortillas dipped in savory consommé broth with melted Oaxaca cheese and shredded beef.',
  },
  {
    id: 'duel-6',
    title: 'Classic Chicken Tikka Masala',
    cuisine: 'Indian',
    time: '30 min',
    calories: 490,
    difficulty: 'Medium',
    imageEmoji: '🍛',
    tags: ['Hearty', 'Warm Spices', 'Family Friendly'],
    description: 'Roasted marinated chicken chunks in an aromatic, spiced creamy tomato curry sauce.',
  },
  {
    id: 'duel-7',
    title: 'Fresh Mediterranean Mezze Bowl',
    cuisine: 'Mediterranean',
    time: '15 min',
    calories: 380,
    difficulty: 'Easy',
    imageEmoji: '🥙',
    tags: ['Vegetarian', 'High Fiber', 'No-Cook'],
    description: 'Crisp cucumbers, kalamata olives, creamy hummus, crumbled feta, and warm pita wedges.',
  },
  {
    id: 'duel-8',
    title: 'Smash Burger with Caramelized Onions',
    cuisine: 'Classic Diner',
    time: '20 min',
    calories: 620,
    difficulty: 'Easy',
    imageEmoji: '🍔',
    tags: ['Comfort Food', 'Cheesy', 'Indulgent'],
    description: 'Lacy, crispy-edged beef patties with melted American cheese and sweet balsamic onions.',
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const round = parseInt(searchParams.get('round') || '1', 10);
    const mode = searchParams.get('mode') || 'single'; // 'single' or 'bracket'

    if (mode === 'bracket') {
      // Return 4 pairs for a tournament bracket
      const shuffled = [...DUEL_ROSTER].sort(() => 0.5 - Math.random());
      const pairs = [
        { id: 'b1', optionA: shuffled[0], optionB: shuffled[1] },
        { id: 'b2', optionA: shuffled[2], optionB: shuffled[3] },
        { id: 'b3', optionA: shuffled[4], optionB: shuffled[5] },
        { id: 'b4', optionA: shuffled[6], optionB: shuffled[7] },
      ];
      return NextResponse.json({
        mode: 'bracket',
        totalRounds: 3,
        currentRound: round,
        matchups: pairs,
      });
    }

    // Default single head-to-head match
    const indexA = Math.floor(Math.random() * DUEL_ROSTER.length);
    let indexB = Math.floor(Math.random() * DUEL_ROSTER.length);
    while (indexB === indexA) {
      indexB = Math.floor(Math.random() * DUEL_ROSTER.length);
    }

    return NextResponse.json({
      matchId: `duel-${Date.now().toString(36)}`,
      optionA: DUEL_ROSTER[indexA],
      optionB: DUEL_ROSTER[indexB],
      round,
      totalRounds: 4,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch duel candidates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { winnerId, round = 1, isFinal = false } = body;

    const winner = DUEL_ROSTER.find(c => c.id === winnerId) || DUEL_ROSTER[0];

    return NextResponse.json({
      success: true,
      winner,
      round: round + 1,
      isFinal,
      xpAwarded: isFinal ? 35 : 10,
      recipe: {
        id: `recipe-${winner.id}`,
        title: winner.title,
        cuisine: winner.cuisine,
        time: winner.time,
        calories: winner.calories,
        description: winner.description,
        isChampionshipWinner: isFinal,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to record duel vote' }, { status: 500 });
  }
}
