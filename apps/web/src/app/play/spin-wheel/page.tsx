/**
 * Spin the Wheel Game
 * Random recipe selection game
 */

'use client';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('page');



import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Sparkles, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AIPersonality } from '@/components/AIPersonality';
import { Celebration } from '@/components/AdvancedAnimations';
import { useRouter } from 'next/navigation';

const recipeCategories = [
  { id: 'pasta', label: 'Pasta', color: 'bg-yellow-500' },
  { id: 'chicken', label: 'Chicken', color: 'bg-orange-500' },
  { id: 'vegetarian', label: 'Vegetarian', color: 'bg-green-500' },
  { id: 'seafood', label: 'Seafood', color: 'bg-blue-500' },
  { id: 'dessert', label: 'Dessert', color: 'bg-pink-500' },
  { id: 'breakfast', label: 'Breakfast', color: 'bg-purple-500' },
];

export default function SpinWheelPage() {
  const router = useRouter();
  const [spinning, setSpinning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [recipe, setRecipe] = useState<unknown>(null);

  const spinWheel = async () => {
    setSpinning(true);
    setSelectedCategory(null);
    setRecipe(null);

    // Simulate spinning
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Random selection
    const randomCategory = recipeCategories[Math.floor(Math.random() * recipeCategories.length)];
    setSelectedCategory(randomCategory.id);

    // Generate recipe for selected category
    try {
      const response = await fetch('/api/meal-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: randomCategory.id,
          quickMode: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRecipe(data);
        setShowCelebration(true);
      }
    } catch (error) {
      _logger.error('Failed to generate recipe:', { error: error instanceof Error ? error.message : String(error) });
    }

    setSpinning(false);
  };

  return (
    <div className="min-h-screen p-4 pb-24 md:pb-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Spin the Wheel 🎡
          </h1>
          <p className="text-muted-foreground">
            Let chance decide your dinner tonight!
          </p>
        </div>

        {/* AI Personality */}
        <AIPersonality context="suggestion" />

        {/* Wheel */}
        <Card className="border-2 border-primary/20">
          <CardContent className="p-8">
            <div className="relative w-full aspect-square max-w-md mx-auto">
              {/* Wheel */}
              <motion.div
                animate={spinning ? { rotate: [0, 360 * 5 + Math.random() * 360] } : {}}
                transition={{ duration: 2, ease: 'easeOut' }}
                className="w-full h-full rounded-full border-8 border-primary/20 relative overflow-hidden"
                style={{
                  background: `conic-gradient(
                    ${recipeCategories.map((cat, i) => `${cat.color} ${(i * 360) / recipeCategories.length}deg ${((i + 1) * 360) / recipeCategories.length}deg`).join(', ')}
                  )`,
                }}
              >
                {recipeCategories.map((cat, i) => {
                  const angle = (i * 360) / recipeCategories.length;
                  return (
                    <div
                      key={cat.id}
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        transform: `rotate(${angle + 30}deg)`,
                      }}
                    >
                      <span className="text-white font-bold text-sm transform -rotate-90">
                        {cat.label}
                      </span>
                    </div>
                  );
                })}
              </motion.div>

              {/* Center pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[30px] border-l-transparent border-r-transparent border-t-primary" />
              </div>
            </div>

            {/* Spin Button */}
            <div className="mt-8 text-center">
              <Button
                onClick={spinWheel}
                disabled={spinning}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {spinning ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    Spinning...
                  </>
                ) : (
                  <>
                    <Shuffle className="w-5 h-5 mr-2" />
                    Spin the Wheel!
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        <AnimatePresence>
          {selectedCategory && recipe && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <CardTitle>Your Result!</CardTitle>
                  </div>
                  <Badge className="w-fit">
                    {recipeCategories.find(c => c.id === selectedCategory)?.label}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{recipe.title || 'Your Recipe'}</h3>
                    {recipe.description && (
                      <p className="text-muted-foreground">{recipe.description}</p>
                    )}
                  </div>
                  <Button
                    onClick={() => router.push(`/recipes/${recipe.id || 'new'}`)}
                    className="w-full"
                  >
                    View Recipe
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={spinWheel}
                    className="w-full"
                  >
                    <Shuffle className="w-4 h-4 mr-2" />
                    Spin Again
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {showCelebration && (
          <Celebration type="achievement" onComplete={() => setShowCelebration(false)} />
        )}
      </div>
    </div>
  );
}
