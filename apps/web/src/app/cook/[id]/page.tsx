'use client';

export const dynamic = 'force-dynamic';


import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CookingHUD, CookingRecipe } from '@/components/cooking/CookingHUD';

const DEMO_RECIPE: CookingRecipe = {
  id: 'demo-salmon-01',
  title: 'Pan-Seared Garlic Herb Salmon with Crispy Asparagus & Lemon Emulsion',
  cookTime: '22 mins',
  calories: 540,
  servings: 2,
  difficulty: 'Intermediate',
  imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
  pantryIngredientsUsed: [
    '2 Atlantic Salmon fillets (6 oz each)',
    '1 bunch fresh asparagus, trimmed',
    '3 cloves garlic, minced',
    '2 tbsp extra virgin olive oil',
    '1 tbsp butter',
    '1 fresh lemon (juiced and zested)',
    'Sea salt and freshly cracked black pepper',
  ],
  steps: [
    'Pat the salmon fillets completely dry with a paper towel. Season both sides generously with sea salt and cracked black pepper.',
    'Heat 1.5 tbsp olive oil in a stainless steel or cast-iron skillet over medium-high heat until the oil is shimmering and hot.',
    'Carefully place salmon fillets skin-side down (or flesh-side down if skinless). Press gently with a spatula for 10 seconds to ensure even contact. Sear undisturbed for 4 minutes until a crisp golden crust forms.',
    'Flip salmon. Add minced garlic, butter, and trimmed asparagus spears around the perimeter of the pan. Sauté the asparagus while spooning melted garlic butter over the salmon for 3 to 4 minutes.',
    'Squeeze fresh lemon juice over the fish and vegetables, garnish with lemon zest, and remove skillet from heat. Rest for 2 minutes before serving hot.',
  ],
  proTips: {
    0: 'Moisture is the enemy of a crispy sear! Really dry that fish skin with paper towels.',
    2: 'Do not move the fish for the first 3 minutes. It will naturally release from the pan when the crust is properly developed.',
    3: 'Basting with melted butter lowers the temperature shock and infuses rich aromatics into the center of the fillet.',
  },
  substitutions: {
    'salmon': 'Steelhead trout, halibut, chicken breast cutlets, or firm pressed tofu blocks',
    'asparagus': 'Broccolini, green beans, or sliced zucchini spears',
    'butter': 'Ghee, coconut oil, or additional rich extra virgin olive oil',
  },
};

import { OPEN_SOURCE_RECIPES } from '@/lib/ai/open-recipe-database';

export default function CookPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  // Find if requested ID matches a known open source or vector recipe
  const matchingOpenRecipe = OPEN_SOURCE_RECIPES.find(r => r.id === resolvedParams.id);
  const initialRecipe: CookingRecipe = matchingOpenRecipe
    ? {
        id: matchingOpenRecipe.id,
        title: matchingOpenRecipe.title,
        cookTime: matchingOpenRecipe.cookTime,
        calories: matchingOpenRecipe.calories,
        servings: 2,
        difficulty: matchingOpenRecipe.difficulty,
        imageUrl: matchingOpenRecipe.imageUrl,
        pantryIngredientsUsed: matchingOpenRecipe.pantryIngredients,
        steps: matchingOpenRecipe.steps,
        proTips: {
          0: `Technique: ${matchingOpenRecipe.culinaryTechnique}. Prep all ingredients before heating.`,
          1: `Flavor Profile: Umami ${Math.round(matchingOpenRecipe.flavorProfile.umami * 100)}%, Acidity ${Math.round(matchingOpenRecipe.flavorProfile.acid * 100)}%, Richness ${Math.round(matchingOpenRecipe.flavorProfile.richness * 100)}%.`,
        },
        substitutions: {
          butter: 'Olive oil or ghee',
          wine: 'Chicken stock with 1 tsp fresh lemon juice',
        },
      }
    : DEMO_RECIPE;

  const [recipe, setRecipe] = useState<CookingRecipe>(initialRecipe);

  useEffect(() => {
    // If dynamic recipe is cached in sessionStorage (e.g. from RAG generation or forks), load it
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('active_cooking_recipe');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.title && Array.isArray(parsed.steps) && (!resolvedParams.id || parsed.id === resolvedParams.id)) {
            setRecipe({
              ...initialRecipe,
              ...parsed,
            });
          }
        }
      } catch {
        // Fallback to initial resolved recipe
      }
    }
  }, [resolvedParams.id]);

  return (
    <CookingHUD
      recipe={recipe}
      onFinish={() => {
        router.push('/dashboard');
      }}
    />
  );
}