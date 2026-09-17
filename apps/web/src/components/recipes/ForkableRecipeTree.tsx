'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitFork,
  GitBranch,
  GitCommit,
  Plus,
  Minus,
  Coins,
  Clock,
  Flame,
  Utensils,
  Shuffle,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  DynamicRecipe,
  applyIngredientSwap,
  shuffleRecipeRemix,
} from '@/lib/recipes/recipe-mutator';

export interface RecipeBranch {
  id: string;
  commitHash: string;
  author: string;
  branchName: string;
  stars: number;
  added: string[];
  removed: string[];
  description: string;
  recipe: DynamicRecipe;
}

interface ForkableRecipeTreeProps {
  baseRecipeTitle?: string;
  baseRecipeId?: string;
  className?: string;
}

const DEFAULT_BRANCHES: RecipeBranch[] = [
  {
    id: 'branch-main',
    commitHash: 'a7b3c2e',
    author: 'Chef Gordon (Executive)',
    branchName: 'main (Master)',
    stars: 1240,
    added: ['Pan-Seared Garlic Butter', 'Lemon Zest Emulsion'],
    removed: [],
    description: 'The golden baseline standard with crispy skin and balanced acidity.',
    recipe: {
      id: 'branch-main',
      title: 'Pan-Seared Garlic Herb Salmon with Crispy Asparagus & Lemon Emulsion',
      cookTime: '22 mins',
      calories: 540,
      servings: 2,
      difficulty: 'Intermediate',
      cuisine: 'Mediterranean Classic',
      imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1200&q=80',
      pantryIngredientsUsed: [
        '2 Atlantic Salmon fillets (6 oz each)',
        '1 bunch fresh asparagus, trimmed',
        '3 cloves garlic, minced',
        '2 tbsp extra virgin olive oil',
        '1 tbsp butter',
        '1 fresh lemon (juiced and zested)',
        'Sea salt and cracked black pepper',
      ],
      steps: [
        'Pat salmon fillets completely dry with paper towels. Season both sides generously with sea salt and cracked black pepper.',
        'Heat 1.5 tbsp olive oil in a stainless steel or cast-iron skillet over medium-high heat until shimmering.',
        'Carefully place salmon fillets skin-side down; press gently with spatula for 10 seconds. Sear undisturbed for 4 minutes until a crisp golden crust forms.',
        'Flip salmon. Add minced garlic, butter, and trimmed asparagus spears around the perimeter. Sauté while spooning melted garlic butter over salmon for 3 to 4 minutes.',
        'Squeeze fresh lemon juice over fish and asparagus, garnish with zest, and rest for 2 minutes before serving hot.',
      ],
      proTips: {
        0: 'Moisture is the enemy of a crisp skin sear! Really pat that salmon dry.',
        2: 'Do not move the fish for the first 3 minutes—it releases naturally when crust is formed.',
      },
      substitutions: {
        salmon: 'Extra-Firm Pressed Tofu or Steelhead Trout',
        butter: 'Extra virgin olive oil or ghee',
        asparagus: 'Trimmed broccolini florets',
      },
      activeSwaps: [],
      macros: { calories: 540, protein: 42, carbs: 6, fat: 34 },
    },
  },
  {
    id: 'branch-spicy',
    commitHash: 'f4e912b',
    author: 'Maya Lin (@SpicyKitchen)',
    branchName: 'spicy-chili-crunch',
    stars: 890,
    added: ['Crispy Chili Oil (2 tbsp)', 'Smoked Paprika', 'Scallions'],
    removed: ['Lemon Zest Emulsion'],
    description: 'Infuses Sichuan peppercorn heat and crispy garlic crunch into the fish crust.',
    recipe: {
      id: 'branch-spicy',
      title: 'Sichuan Spicy Chili Crunch Salmon with Blistered Broccolini',
      cookTime: '18 mins',
      calories: 590,
      servings: 2,
      difficulty: 'Intermediate',
      cuisine: 'Sichuan Fusion',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
      pantryIngredientsUsed: [
        '2 Atlantic Salmon fillets (6 oz each)',
        '2 tbsp Lao Gan Ma spicy chili crunch oil',
        '1 bunch tender broccolini florets',
        '3 cloves garlic, crushed',
        '2 scallions, thinly sliced',
        '1 tsp ground Sichuan peppercorn',
        '1 tbsp toasted sesame oil',
      ],
      steps: [
        'Rub salmon fillets on both sides with ground Sichuan peppercorn and coarse sea salt.',
        'Heat 1 tbsp chili crunch oil in a heavy wok or skillet until smoking hot and fragrant.',
        'Sear salmon skin-side down undisturbed for 3.5 minutes until a fiery red chili lacquer develops.',
        'Flip salmon, toss in sliced scallions, garlic, and broccolini. Spoon sizzling chili oil over salmon for 3 minutes.',
        'Finish with a drizzle of toasted sesame oil and raw scallion ribbons. Serve hot over steamed rice.',
      ],
      proTips: {
        0: 'Sichuan peppercorn provides the signature numbing sensation that balances the fiery fried chili flakes.',
      },
      substitutions: {
        salmon: 'Pressed tofu planks or chicken cutlets',
        broccolini: 'Snap peas or asparagus',
      },
      activeSwaps: [],
      macros: { calories: 590, protein: 43, carbs: 10, fat: 39 },
    },
  },
  {
    id: 'branch-airfryer',
    commitHash: 'c88109d',
    author: 'Dave (@QuickMacros)',
    branchName: 'air-fryer-12min',
    stars: 645,
    added: ['Avocado Oil Spray', 'Garlic Herb Rub'],
    removed: ['Butter', 'Pan Sauté Step'],
    description: 'Adapts cooking technique for 12-min 400°F air fryer with 0 messy cleanup.',
    recipe: {
      id: 'branch-airfryer',
      title: '12-Minute Turbo Air-Fryer Garlic Herb Salmon (Zero Cleanup)',
      cookTime: '12 mins',
      calories: 440,
      servings: 2,
      difficulty: 'Easy',
      cuisine: 'Modern Fast & Clean',
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
      pantryIngredientsUsed: [
        '2 Atlantic Salmon fillets (6 oz each)',
        'Avocado oil spray (100% pure)',
        '1.5 tsp garlic herb seasoning rub',
        '1 bunch trimmed asparagus spears',
        '1 fresh lemon wedge',
      ],
      steps: [
        'Preheat your convective air fryer to 400°F (205°C) for 3 minutes.',
        'Mist salmon fillets and asparagus spears with avocado oil spray and coat with garlic herb seasoning.',
        'Arrange salmon skin-side down in the air fryer basket with asparagus arranged alongside.',
        'Air fry at 400°F for 10-12 minutes without flipping until the exterior is shatteringly crisp and center is moist.',
        'Transfer directly to plates and finish with a squeeze of fresh lemon. Zero stovetop splatter or pans to scrub.',
      ],
      proTips: {
        0: 'Air fryers circulate 400°F dry air at high velocity, rendering salmon skin extra crispy in half the time of an oven.',
      },
      substitutions: {
        salmon: 'Chicken tenders or firm tofu planks',
        asparagus: 'Green beans or broccoli crowns',
      },
      activeSwaps: [],
      macros: { calories: 440, protein: 44, carbs: 5, fat: 26 },
    },
  },
];

export function ForkableRecipeTree({
  baseRecipeTitle = 'Pan-Seared Garlic Herb Salmon',
  baseRecipeId = 'recipe-salmon-01',
  className = '',
}: ForkableRecipeTreeProps) {
  const router = useRouter();
  const [branches, setBranches] = useState<RecipeBranch[]>(DEFAULT_BRANCHES);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('branch-main');
  const [isForkModalOpen, setIsForkModalOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchDescription, setNewBranchDescription] = useState('');
  const [newAddIngredient, setNewAddIngredient] = useState('');

  const activeBranch = branches.find(b => b.id === selectedBranchId) || branches[0];

  const handleBranchIngredientSwap = (ingredientKey: string) => {
    const updatedRecipe = applyIngredientSwap(activeBranch.recipe, ingredientKey);
    const updatedBranch: RecipeBranch = {
      ...activeBranch,
      recipe: updatedRecipe,
      description: `Adapted recipe with ${ingredientKey} swap. Instructions and cook times updated.`,
    };

    setBranches(prev => prev.map(b => (b.id === activeBranch.id ? updatedBranch : b)));
    toast.success(`Swapped ${ingredientKey} in branch "${activeBranch.branchName}"!`, {
      description: `Cooking steps and nutritional macros dynamically recalculated.`,
    });
  };

  const handleShuffleBranch = () => {
    const remixedRecipe = shuffleRecipeRemix(activeBranch.recipe);
    const remixedBranch: RecipeBranch = {
      ...activeBranch,
      recipe: remixedRecipe,
      branchName: `${activeBranch.branchName}-remix`,
      description: `Culinary remix: ${remixedRecipe.variationName}.`,
    };

    setBranches(prev => [remixedBranch, ...prev]);
    setSelectedBranchId(remixedBranch.id);
    toast.success(`Shuffled Recipe: ${remixedRecipe.variationName}!`, {
      description: `Created new live variation with adapted cooking techniques and timings.`,
    });
  };

  const handleCookBranchInHUD = () => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('active_cooking_recipe', JSON.stringify(activeBranch.recipe));
      } catch {}
    }
    router.push(`/cook/${activeBranch.id}`);
  };

  const handleFork = async () => {
    if (!newBranchName) {
      toast.error('Please enter a branch name');
      return;
    }

    try {
      const res = await fetch('/api/recipes/fork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseRecipeId,
          baseRecipeTitle,
          branchName: newBranchName,
          changeSummary: newBranchDescription || 'Personal flavor adaptation',
          addedIngredients: newAddIngredient ? [newAddIngredient] : ['Special spice blend'],
        }),
      });

      const data = await res.json();
      if (data.success) {
        const baseRecipe = activeBranch.recipe;
        const newIngredients = newAddIngredient
          ? [...baseRecipe.pantryIngredientsUsed, newAddIngredient]
          : baseRecipe.pantryIngredientsUsed;

        const newSteps = [
          ...baseRecipe.steps.slice(0, 2),
          `Incorporate ${newAddIngredient || 'custom twist'} into the cooking process to infuse signature flavor.`,
          ...baseRecipe.steps.slice(2),
        ];

        const createdBranch: RecipeBranch = {
          id: data.fork.id,
          commitHash: data.fork.commitHash,
          author: 'You (Author)',
          branchName: data.fork.branchName,
          stars: 1,
          added: data.fork.diff.added,
          removed: data.fork.diff.removed,
          description: data.fork.changeSummary,
          recipe: {
            ...baseRecipe,
            id: data.fork.id,
            title: `${data.fork.branchName}: ${baseRecipe.title}`,
            pantryIngredientsUsed: newIngredients,
            steps: newSteps,
          },
        };

        setBranches(prev => [createdBranch, ...prev]);
        setSelectedBranchId(createdBranch.id);
        setIsForkModalOpen(false);
        setNewBranchName('');
        setNewBranchDescription('');
        setNewAddIngredient('');

        toast.success(`Forked to branch "${createdBranch.branchName}"!`, {
          description: 'You now earn 30% royalties on grocery carts generated from this fork.',
        });
      }
    } catch {
      toast.error('Failed to fork recipe');
    }
  };

  return (
    <Card className={`border shadow-xl overflow-hidden ${className}`}>
      <CardHeader className="bg-gradient-to-r from-purple-500/10 via-primary/5 to-transparent pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <GitFork className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Culinary Git™ Forkable Recipe Network</span>
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Fork, swap ingredients, shuffle culinary styles, and track recipe lineage. Creators earn 30% royalties when groceries are bought through their branch.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleShuffleBranch}
              className="font-bold text-xs h-9 border-purple-400/40 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300"
            >
              <Shuffle className="w-4 h-4 mr-1.5 text-purple-500" />
              <span>Shuffle Recipe Style</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setIsForkModalOpen(true)}
              className="font-bold text-xs h-9 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <GitFork className="w-4 h-4 mr-1.5" />
              <span>Fork This Recipe</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Branch Selector Pills */}
        <div className="flex flex-wrap gap-2">
          {branches.map(branch => {
            const isSelected = selectedBranchId === branch.id;
            return (
              <Button
                key={branch.id}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedBranchId(branch.id)}
                className={`text-xs h-8 font-mono ${
                  isSelected
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md'
                    : 'border-muted'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5 mr-1" />
                <span>{branch.branchName}</span>
                <span className="ml-1.5 opacity-70">★{branch.stars}</span>
              </Button>
            );
          })}
        </div>

        {/* Active Branch Commit Details Card */}
        {activeBranch && (
          <motion.div
            key={activeBranch.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl border bg-muted/20 space-y-5"
          >
            {/* Branch Hero Photography */}
            <div className="relative w-full h-48 sm:h-56 rounded-xl overflow-hidden bg-muted shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeBranch.recipe.imageUrl || '/recipe-placeholder.jpg'}
                alt={activeBranch.recipe.title}
                onError={e => {
                  (e.target as HTMLImageElement).src = '/recipe-placeholder.jpg';
                }}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <Badge className="bg-purple-600 text-white font-mono text-[10px] mb-1">
                    branch: {activeBranch.branchName}
                  </Badge>
                  <h3 className="text-lg sm:text-xl font-black text-white drop-shadow-md">
                    {activeBranch.recipe.title}
                  </h3>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300">
                  commit #{activeBranch.commitHash}
                </span>
                <span className="text-xs text-muted-foreground">• by {activeBranch.author}</span>
              </div>

              <Badge className="bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1">
                <Coins className="w-3 h-3" />
                <span>30% Creator Royalties Active</span>
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground">
              {activeBranch.description}
            </p>

            {/* Branch Metrics Bar */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary" />
                <span>{activeBranch.recipe.cookTime}</span>
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-500" />
                <span>{activeBranch.recipe.calories} kcal</span>
              </Badge>
              <Badge variant="outline">
                <span>{activeBranch.recipe.difficulty}</span>
              </Badge>
              <Badge variant="secondary">
                <span>{activeBranch.recipe.cuisine}</span>
              </Badge>
            </div>

            {/* Semantic Diff View (Green for added, Red for removed) */}
            <div className="space-y-2 pt-2 border-t">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ingredient & Technique Delta (Diff)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Additions */}
                {activeBranch.added.length > 0 ? (
                  <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 space-y-1">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Added to this branch ({activeBranch.added.length}):
                    </span>
                    {activeBranch.added.map((item, i) => (
                      <div key={i} className="text-emerald-800 dark:text-emerald-300 font-medium pl-4">
                        + {item}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl border text-muted-foreground text-xs">
                    Baseline ingredients (no additions)
                  </div>
                )}

                {/* Removals */}
                {activeBranch.removed.length > 0 ? (
                  <div className="p-3 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900 space-y-1">
                    <span className="font-bold text-red-700 dark:text-red-400 flex items-center gap-1">
                      <Minus className="w-3.5 h-3.5" /> Removed / Substituted:
                    </span>
                    {activeBranch.removed.map((item, i) => (
                      <div key={i} className="text-red-800 dark:text-red-300 line-through pl-4">
                        - {item}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl border text-muted-foreground text-xs">
                    No ingredients removed
                  </div>
                )}
              </div>
            </div>

            {/* Full Adapted Ingredients with 1-Click Interactive Swapper */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Complete Ingredients List (Tap to Swap in Real-Time):
                </span>
                <span className="text-[11px] text-primary">Live Recalculation Engine</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeBranch.recipe.pantryIngredientsUsed.map((ing, idx) => {
                  const lower = ing.toLowerCase();
                  const canSwapSalmon = lower.includes('salmon');
                  const canSwapButter = lower.includes('butter');
                  const canSwapAsparagus = lower.includes('asparagus');
                  const canSwapChicken = lower.includes('chicken');

                  let swapKey: string | null = null;
                  if (canSwapSalmon) swapKey = 'salmon';
                  else if (canSwapButter) swapKey = 'butter';
                  else if (canSwapAsparagus) swapKey = 'asparagus';
                  else if (canSwapChicken) swapKey = 'chicken';

                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border bg-background/80 flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="text-foreground/90 font-medium">• {ing}</span>
                      {swapKey && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleBranchIngredientSwap(swapKey!)}
                          className="h-6 text-[11px] text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 px-2 font-bold shrink-0"
                        >
                          Swap
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Adapted Step-By-Step Cooking Technique Instructions */}
            <div className="space-y-2 pt-2 border-t">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Adapted Step-by-Step Cooking Instructions:
              </span>
              <div className="space-y-2">
                {activeBranch.recipe.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-background/60 border flex items-start gap-3 text-xs leading-relaxed"
                  >
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-foreground/90">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Launch & Action Toolbar */}
            <div className="pt-2 flex flex-wrap gap-3">
              <Button
                onClick={handleCookBranchInHUD}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm h-11 px-6 rounded-xl shadow-lg shadow-primary/20 flex-1 sm:flex-initial"
              >
                <Utensils className="w-4 h-4 mr-2" />
                <span>Cook This Branch in OmniChef HUD</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>

              <Button
                variant="outline"
                onClick={handleShuffleBranch}
                className="font-bold text-sm h-11 px-5 rounded-xl border-purple-500/30 text-purple-600 dark:text-purple-300"
              >
                <Shuffle className="w-4 h-4 mr-2 text-purple-500" />
                <span>Shuffle & Remix Style</span>
              </Button>
            </div>
          </motion.div>
        )}

        {/* Fork Modal */}
        <AnimatePresence>
          {isForkModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <Card className="max-w-md w-full bg-background border shadow-2xl rounded-3xl overflow-hidden p-6 space-y-4">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <GitFork className="w-5 h-5 text-purple-600" />
                    <span>Create New Recipe Branch</span>
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Fork &ldquo;{baseRecipeTitle}&rdquo; and attach your unique spin. You will receive 30% of all affiliate grocery revenue generated through your branch.
                  </CardDescription>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Branch Name</label>
                    <Input
                      placeholder="e.g. crispy-garlic-airfryer"
                      value={newBranchName}
                      onChange={e => setNewBranchName(e.target.value)}
                      className="mt-1 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Added Ingredient or Twist</label>
                    <Input
                      placeholder="e.g. Truffle butter + fresh chives"
                      value={newAddIngredient}
                      onChange={e => setNewAddIngredient(e.target.value)}
                      className="mt-1 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Culinary Note / Technique</label>
                    <Input
                      placeholder="e.g. Swapped regular butter for truffle butter to elevate the umami."
                      value={newBranchDescription}
                      onChange={e => setNewBranchDescription(e.target.value)}
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button variant="ghost" size="sm" onClick={() => setIsForkModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleFork}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                  >
                    Commit & Create Branch
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
