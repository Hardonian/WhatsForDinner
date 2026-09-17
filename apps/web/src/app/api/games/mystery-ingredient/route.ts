import { NextResponse } from 'next/server';

export interface MysteryIngredient {
  id: string;
  name: string;
  emoji: string;
  flavorProfile: string;
  difficulty: 'Beginner' | 'Adventurous' | 'MasterChef';
  category: 'Spices' | 'Sauces & Pastes' | 'Produce' | 'Pantry Wonder';
  hint: string;
  suggestedDish: string;
  cookTime: string;
  recipeDetails: {
    title: string;
    description: string;
    pantryNeeds: string[];
    steps: string[];
  };
}

const MYSTERY_INGREDIENTS: MysteryIngredient[] = [
  {
    id: 'gochujang',
    name: 'Korean Gochujang',
    emoji: '🌶️',
    flavorProfile: 'Sweet, savory, deep fermented umami heat',
    difficulty: 'Adventurous',
    category: 'Sauces & Pastes',
    hint: 'A ruby-red fermented paste packed with spicy-sweet magic',
    suggestedDish: 'Gochujang Honey-Glazed Chicken with Sesame Rice',
    cookTime: '25 min',
    recipeDetails: {
      title: 'Gochujang Honey-Glazed Chicken Thighs',
      description: 'Juicy chicken thighs seared crisp and tossed in a sticky, spicy Korean glaze.',
      pantryNeeds: ['Chicken thighs', 'Gochujang', 'Honey', 'Soy sauce', 'Garlic', 'Sesame oil'],
      steps: [
        'Whisk together gochujang, honey, soy sauce, minced garlic, and sesame oil.',
        'Sear chicken thighs skin-side down in a hot skillet for 6-8 minutes until crispy.',
        'Flip chicken, pour glaze into pan, and baste until thickened and bubbly.',
        'Serve over steaming jasmine rice with sliced scallions and toasted sesame seeds.',
      ],
    },
  },
  {
    id: 'black-garlic',
    name: 'Aged Black Garlic',
    emoji: '🧄',
    flavorProfile: 'Balsamic sweetness, molasses, tamarind, mellow umami',
    difficulty: 'MasterChef',
    category: 'Pantry Wonder',
    hint: 'Slow-aged for weeks until dark as obsidian and sweet as fruit',
    suggestedDish: 'Black Garlic & Shiitake Butter Tagliatelle',
    cookTime: '20 min',
    recipeDetails: {
      title: 'Silky Black Garlic & Mushroom Pasta',
      description: 'Earthy wild mushrooms and sweet fermented black garlic melted into rich cream sauce.',
      pantryNeeds: ['Tagliatelle or fettuccine', 'Black garlic cloves', 'Mushrooms', 'Butter', 'Parmesan'],
      steps: [
        'Mash black garlic cloves with softened butter into a smooth compound paste.',
        'Boil pasta in salted water until al dente.',
        'Sauté mushrooms in olive oil until golden, then melt in the black garlic butter.',
        'Toss hot pasta with sauce, adding pasta water and plenty of freshly grated parmesan.',
      ],
    },
  },
  {
    id: 'smoked-paprika',
    name: 'Spanish Smoked Paprika (Pimentón)',
    emoji: '🪵',
    flavorProfile: 'Oak-smoked, rich, earth-sweet warmth',
    difficulty: 'Beginner',
    category: 'Spices',
    hint: 'Dried over wood smoke in Extremadura, Spain',
    suggestedDish: 'One-Skillet Spanish Rice with Crispy Chorizo & Chickpeas',
    cookTime: '25 min',
    recipeDetails: {
      title: 'Smoky Spanish Skillet Rice & Chickpeas',
      description: 'A vibrant one-pan dinner bursting with smoked paprika, crispy chickpeas, and tomatoes.',
      pantryNeeds: ['Rice', 'Smoked paprika', 'Chickpeas', 'Diced tomatoes', 'Garlic', 'Bell pepper'],
      steps: [
        'Sauté diced onion, bell pepper, and garlic with generous smoked paprika.',
        'Stir in uncooked rice and toast for 2 minutes.',
        'Add canned chickpeas, diced tomatoes, and broth; bring to a simmer.',
        'Cover and cook for 18 minutes until rice is tender and fragrant.',
      ],
    },
  },
  {
    id: 'sun-dried-tomatoes',
    name: 'Sun-Dried Tomatoes in Olive Oil',
    emoji: '🍅',
    flavorProfile: 'Concentrated tomato tartness, herbal, sweet olive oil',
    difficulty: 'Beginner',
    category: 'Produce',
    hint: 'Sun-ripened under the Mediterranean sun and packed in fragrant herb oil',
    suggestedDish: 'Creamy Sun-Dried Tomato & Spinach Gnocchi',
    cookTime: '15 min',
    recipeDetails: {
      title: 'Tuscan Sun-Dried Tomato Gnocchi Skillet',
      description: 'Pillowy potato gnocchi pan-crisped with sun-dried tomatoes, baby spinach, and cream.',
      pantryNeeds: ['Potato gnocchi', 'Sun-dried tomatoes', 'Heavy cream or coconut cream', 'Fresh spinach', 'Garlic'],
      steps: [
        'Pan-fry gnocchi in olive oil directly in skillet until lightly golden (no boiling needed).',
        'Stir in sliced sun-dried tomatoes and minced garlic for 1 minute.',
        'Pour in cream, let simmer for 2 minutes to thicken.',
        'Fold in baby spinach until wilted and finish with crushed black pepper.',
      ],
    },
  },
  {
    id: 'tahini',
    name: 'Creamy Toasted Tahini',
    emoji: '🥜',
    flavorProfile: 'Nutty, rich, creamy roasted sesame depth',
    difficulty: 'Adventurous',
    category: 'Pantry Wonder',
    hint: 'Silky ground sesame seeds that bridge Mediterranean & Middle Eastern kitchens',
    suggestedDish: 'Spiced Chickpea & Roasted Cauliflower Bowl with Lemon Tahini Drizzle',
    cookTime: '25 min',
    recipeDetails: {
      title: 'Golden Turmeric Cauliflower & Crispy Chickpeas with Tahini',
      description: 'Warm roasted vegetables and spiced chickpeas drizzled with vibrant lemon-garlic tahini sauce.',
      pantryNeeds: ['Tahini', 'Cauliflower', 'Chickpeas', 'Lemon', 'Cumin & turmeric', 'Olive oil'],
      steps: [
        'Toss cauliflower florets and chickpeas with olive oil, cumin, turmeric, and sea salt.',
        'Roast at 425°F (220°C) for 20 minutes until browned and crispy.',
        'Whisk tahini with fresh lemon juice, warm water, and garlic until pale and creamy.',
        'Drizzle sauce generously over warm roasted bowl.',
      ],
    },
  },
];

export async function GET() {
  try {
    // Return mystery box options without revealing the secret ingredient yet
    const mysteryBoxes = MYSTERY_INGREDIENTS.map((item, index) => ({
      boxNumber: index + 1,
      id: item.id,
      difficulty: item.difficulty,
      category: item.category,
      hint: item.hint,
      cookTime: item.cookTime,
    }));

    return NextResponse.json({
      boxes: mysteryBoxes,
      dailyBonusXp: 30,
      instructions: 'Pick a mystery box to reveal the secret ingredient and cook tonight’s dinner!',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch mystery boxes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { boxId } = body;

    let ingredient = MYSTERY_INGREDIENTS.find(i => i.id === boxId);
    if (!ingredient) {
      ingredient = MYSTERY_INGREDIENTS[Math.floor(Math.random() * MYSTERY_INGREDIENTS.length)];
    }

    return NextResponse.json({
      success: true,
      revealed: true,
      ingredient: {
        id: ingredient.id,
        name: ingredient.name,
        emoji: ingredient.emoji,
        flavorProfile: ingredient.flavorProfile,
        difficulty: ingredient.difficulty,
        suggestedDish: ingredient.suggestedDish,
        cookTime: ingredient.cookTime,
      },
      recipe: ingredient.recipeDetails,
      xpEarned: 30,
      badge: 'Mystery Chef 🕵️',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to reveal mystery ingredient' }, { status: 500 });
  }
}
