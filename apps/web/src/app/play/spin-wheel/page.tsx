'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Sparkles, ArrowRight, ChefHat, Clock, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AIPersonality } from '@/components/AIPersonality';
import { Celebration } from '@/components/AdvancedAnimations';
import { awardXp } from '@/components/gamification/GamificationProvider';
import { useRouter } from 'next/navigation';
import { soundEffects } from '@/lib/audio/sound-effects';

interface CategoryItem {
  id: string;
  label: string;
  color: string;
  gradient: string;
  icon: string;
  description: string;
  exampleDishes: string[];
}

const FALLBACK_CATEGORIES: CategoryItem[] = [
  { id: 'quick-easy', label: '15-Min Quick', color: '#eab308', gradient: 'from-amber-500 to-yellow-400', icon: '⚡', description: 'Quick dinner', exampleDishes: ['Garlic Butter Shrimp Pasta'] },
  { id: 'comfort', label: 'Comfort Food', color: '#f97316', gradient: 'from-orange-500 to-amber-500', icon: '🍲', description: 'Cozy classics', exampleDishes: ['Creamy Tuscan Chicken'] },
  { id: 'healthy-fresh', label: 'Healthy & Fresh', color: '#22c55e', gradient: 'from-emerald-500 to-green-400', icon: '🥗', description: 'Nutrient-rich', exampleDishes: ['Mediterranean Salmon Bowl'] },
  { id: 'asian-fusion', label: 'Asian Fusion', color: '#06b6d4', gradient: 'from-cyan-500 to-blue-500', icon: '🥢', description: 'Umami flavours', exampleDishes: ['Crispy Honey Soy Tofu'] },
  { id: 'italian', label: 'Italian Night', color: '#ef4444', gradient: 'from-rose-500 to-red-600', icon: '🍝', description: 'Rustic pastas', exampleDishes: ['Penne Alla Vodka'] },
  { id: 'mexican-fiesta', label: 'Taco Fiesta', color: '#a855f7', gradient: 'from-purple-500 to-pink-500', icon: '🌮', description: 'Street style tacos', exampleDishes: ['Street Style Carnitas Tacos'] },
];

export default function SpinWheelPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryItem[]>(FALLBACK_CATEGORIES);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [recipe, setRecipe] = useState<any>(null);
  const [xpGained, setXpGained] = useState(0);

  useEffect(() => {
    fetch('/api/games/spin-wheel')
      .then(res => res.json())
      .then(data => {
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
        }
      })
      .catch(() => {});
  }, []);

  const spinWheel = async () => {
    if (spinning) return;
    setSpinning(true);
    setSelectedCategory(null);
    setRecipe(null);
    setXpGained(0);

    const segmentAngle = 360 / categories.length;
    const targetIndex = Math.floor(Math.random() * categories.length);
    const chosen = categories[targetIndex];

    // Compute rotation so pointer (at top, angle 0) lands on chosen segment
    const extraSpins = 5 * 360;
    const targetAngle = extraSpins + (360 - (targetIndex * segmentAngle + segmentAngle / 2));
    setRotation(prev => prev + targetAngle);

    // Audio clicks during wheel deceleration
    let ticks = 0;
    const tickInterval = setInterval(() => {
      ticks++;
      soundEffects.playClick();
      if (ticks >= 20) clearInterval(tickInterval);
    }, 120);

    try {
      const response = await fetch('/api/games/spin-wheel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: chosen.id }),
      });

      // Wait for spin animation to complete (2.5s)
      await new Promise(resolve => setTimeout(resolve, 2500));

      if (response.ok) {
        const data = await response.json();
        setSelectedCategory(data.category || chosen);
        setRecipe(data.recipe);
        awardXp(25);
        setXpGained(25);
        setShowCelebration(true);
        soundEffects.playVictory();
      } else {
        setSelectedCategory(chosen);
        awardXp(15);
        setXpGained(15);
        soundEffects.playVictory();
      }
    } catch {
      await new Promise(resolve => setTimeout(resolve, 2500));
      setSelectedCategory(chosen);
      soundEffects.playVictory();
    } finally {
      clearInterval(tickInterval);
      setSpinning(false);
    }
  };

  return (
    <div className="min-h-screen p-4 pb-24 md:pb-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30">
          Decision Game #1
        </Badge>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 bg-clip-text text-transparent">
          Spin the Wheel 🎡
        </h1>
        <p className="text-muted-foreground text-sm">
          Let fate pick your meal tonight. Spin the wheel to generate a personalized recipe!
        </p>
      </div>

      <AIPersonality context="suggestion" />

      {/* Interactive Wheel Card */}
      <Card className="border-2 border-primary/20 shadow-xl overflow-hidden backdrop-blur-sm">
        <CardContent className="p-8 flex flex-col items-center">
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 my-4">
            {/* Pointer Marker at the Top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 flex flex-col items-center filter drop-shadow-md">
              <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[22px] border-l-transparent border-r-transparent border-t-primary" />
              <div className="w-3 h-3 bg-white rounded-full -mt-4 shadow" />
            </div>

            {/* Rotating Wheel */}
            <motion.div
              animate={{ rotate: rotation }}
              transition={{ duration: 2.5, ease: [0.15, 0.9, 0.3, 1] }}
              className="w-full h-full rounded-full border-4 border-primary/30 relative overflow-hidden shadow-2xl"
              style={{
                background: `conic-gradient(
                  ${categories.map((cat, i) => `${cat.color} ${(i * 360) / categories.length}deg ${((i + 1) * 360) / categories.length}deg`).join(', ')}
                )`,
              }}
            >
              {categories.map((cat, i) => {
                const angle = (i * 360) / categories.length;
                return (
                  <div
                    key={cat.id}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{
                      transform: `rotate(${angle + 360 / categories.length / 2}deg)`,
                    }}
                  >
                    <div className="transform -rotate-90 translate-x-20 text-white font-bold text-xs flex items-center gap-1 drop-shadow-md">
                      <span>{cat.icon}</span>
                      <span className="hidden sm:inline">{cat.label}</span>
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* Center Hub */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-background border-4 border-primary rounded-full shadow-lg flex items-center justify-center z-10">
              <ChefHat className="w-6 h-6 text-primary" />
            </div>
          </div>

          {/* Action Trigger */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            <Button
              onClick={spinWheel}
              disabled={spinning}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold shadow-lg"
            >
              {spinning ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Spinning the Wheel...
                </>
              ) : (
                <>
                  <Shuffle className="w-5 h-5 mr-2" />
                  Spin the Wheel! (+25 XP)
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Result Display */}
      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-2 border-primary/30 shadow-2xl overflow-hidden bg-card/90 backdrop-blur-md">
              <div className={`h-3 bg-gradient-to-r ${selectedCategory.gradient || 'from-purple-500 to-pink-500'}`} />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500 animate-bounce" />
                    <CardTitle className="text-2xl font-bold">The Wheel Has Spoken!</CardTitle>
                  </div>
                  {xpGained > 0 && (
                    <Badge className="bg-amber-500 text-white font-bold flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> +{xpGained} XP Earned
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl">{selectedCategory.icon}</span>
                  <Badge variant="secondary" className="text-sm font-semibold">
                    {selectedCategory.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{selectedCategory.description}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {recipe && (
                  <div className="p-4 rounded-xl bg-muted/50 border space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold">{recipe.title}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{recipe.description}</p>
                      </div>
                      <Badge variant="outline" className="flex items-center gap-1 shrink-0">
                        <Clock className="w-3.5 h-3.5" /> {recipe.cookTime || '20 min'}
                      </Badge>
                    </div>

                    {recipe.ingredients && (
                      <div className="pt-2 border-t text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Key Ingredients: </span>
                        {recipe.ingredients.slice(0, 4).join(', ')}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    onClick={() => router.push(recipe?.id ? `/recipes/${recipe.id}` : '/dashboard')}
                    className="flex-1 bg-primary text-primary-foreground font-semibold shadow"
                  >
                    Cook This Tonight
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={spinWheel}
                    disabled={spinning}
                    className="flex-1"
                  >
                    <Shuffle className="w-4 h-4 mr-2" />
                    Spin Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {showCelebration && (
        <Celebration type="achievement" onComplete={() => setShowCelebration(false)} />
      )}
    </div>
  );
}