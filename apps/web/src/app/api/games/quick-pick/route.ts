import { NextResponse } from 'next/server';

export interface DecisionFactor {
  id: string;
  question: string;
  options: Array<{
    id: string;
    label: string;
    icon: string;
    desc: string;
  }>;
}

const FACTORS: DecisionFactor[] = [
  {
    id: 'time',
    question: 'How much time do you have tonight?',
    options: [
      { id: '15m', label: '15 Minutes', icon: '⚡', desc: 'Fast, minimal cook, hungry right now' },
      { id: '30m', label: '30 Minutes', icon: '⏱️', desc: 'Standard weeknight dinner pace' },
      { id: '45m', label: '45+ Minutes', icon: '🍷', desc: 'Relaxed evening, happy to simmer' },
    ],
  },
  {
    id: 'craving',
    question: 'What vibe are you craving?',
    options: [
      { id: 'comfort', label: 'Cozy & Hearty', icon: '🍲', desc: 'Cheesy, saucy, warm, and filling' },
      { id: 'fresh', label: 'Fresh & Crisp', icon: '🥗', desc: 'Greens, lemon, light, and energizing' },
      { id: 'bold', label: 'Spicy & Bold', icon: '🌶️', desc: 'Big spices, garlic, tangy zest' },
    ],
  },
  {
    id: 'effort',
    question: 'How much cleanup are you willing to do?',
    options: [
      { id: 'one-pot', label: 'One Pot / Pan', icon: '🍳', desc: 'Bare minimum dishes to wash' },
      { id: 'moderate', label: 'Normal Cook', icon: '🔪', desc: 'A cutting board and a couple pots' },
      { id: 'creative', label: 'Fun Project', icon: '👨‍🍳', desc: 'I want to feel like a real chef' },
    ],
  },
];

const RECIPE_DECISION_MATRIX: Record<string, any> = {
  '15m-comfort-one-pot': {
    title: '15-Min Cheesy Tortellini Skillet',
    cuisine: 'Italian-American',
    prepTime: '5 min',
    cookTime: '10 min',
    emoji: '🧀',
    description: 'Fresh refrigerated tortellini simmered right in marinara with melted mozzarella.',
  },
  '15m-fresh-one-pot': {
    title: 'Warm Sesame Salmon & Edamame Bowl',
    cuisine: 'Japanese-Inspired',
    prepTime: '5 min',
    cookTime: '10 min',
    emoji: '🥢',
    description: 'Quick-seared salmon fillet over microwave rice, avocado, and chili crisp.',
  },
  '15m-bold-one-pot': {
    title: '10-Minute Spicy Thai Basil Ground Turkey',
    cuisine: 'Thai Street Food',
    prepTime: '3 min',
    cookTime: '8 min',
    emoji: '🌶️',
    description: 'Crispy browned turkey wok-tossed with chili, garlic, sweet soy, and fresh basil.',
  },
  '30m-comfort-moderate': {
    title: 'Classic Chicken Parmesan with Penne',
    cuisine: 'Italian',
    prepTime: '10 min',
    cookTime: '20 min',
    emoji: '🍝',
    description: 'Golden panko chicken cutlets topped with rich pomodoro and bubbling parmesan.',
  },
  '30m-fresh-moderate': {
    title: 'Lemon Herb Mediterranean Sea Bass & Asparagus',
    cuisine: 'Mediterranean',
    prepTime: '10 min',
    cookTime: '15 min',
    emoji: '🐟',
    description: 'Pan-crisped white fish fillets with charred lemon wedges and tender asparagus.',
  },
  '30m-bold-one-pot': {
    title: 'One-Pot Mexican Street Corn Chicken Pasta',
    cuisine: 'Tex-Mex Fusion',
    prepTime: '8 min',
    cookTime: '20 min',
    emoji: '🌽',
    description: 'Penne simmered in chipotle cream with sweet corn, cotija, lime, and cilantro.',
  },
  '45m-comfort-creative': {
    title: 'Slow-Braised Short Rib Ragù over Pappardelle',
    cuisine: 'Rustic Italian',
    prepTime: '15 min',
    cookTime: '40 min',
    emoji: '🍷',
    description: 'Melt-in-your-mouth tender braised beef with red wine reduction and ribbon pasta.',
  },
  '45m-bold-creative': {
    title: 'Oven-Roasted Chicken Shawarma Feast',
    cuisine: 'Middle Eastern',
    prepTime: '20 min',
    cookTime: '30 min',
    emoji: '🧆',
    description: 'Spiced marinated chicken roasted with garlic toum, pickles, and homemade flatbreads.',
  },
};

const DEFAULT_MATCH = {
  title: 'Garlic Butter Glazed Steak Bites & Crispy Potatoes',
  cuisine: 'American',
  prepTime: '10 min',
  cookTime: '15 min',
  emoji: '🥩',
  description: 'Golden skillet-seared steak bites with rosemary butter and baby potatoes.',
};

export async function GET() {
  return NextResponse.json({
    factors: FACTORS,
    estimatedDecideTime: '30 seconds',
    xpReward: 20,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { time = '30m', craving = 'comfort', effort = 'moderate' } = body;

    const key = `${time}-${craving}-${effort}`;
    const recipe = RECIPE_DECISION_MATRIX[key] || DEFAULT_MATCH;

    return NextResponse.json({
      success: true,
      decisionTimeSeconds: 15,
      recipe: {
        id: `qp-${Date.now().toString(36)}`,
        ...recipe,
        tags: [time, craving, effort],
      },
      xpEarned: 20,
      confidenceScore: 0.98,
      message: `Optimal match calculated for ${time} ${craving} meal!`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to compute quick pick' }, { status: 500 });
  }
}
