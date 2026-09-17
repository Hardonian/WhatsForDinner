'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Package, HelpCircle, Flame, Clock, ArrowRight, RotateCcw, Award, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Celebration } from '@/components/AdvancedAnimations';
import { awardXp } from '@/components/gamification/GamificationProvider';
import { useRouter } from 'next/navigation';

interface MysteryBoxItem {
  boxNumber: number;
  id: string;
  difficulty: 'Beginner' | 'Adventurous' | 'MasterChef';
  category: string;
  hint: string;
  cookTime: string;
}

export default function MysteryIngredientPage() {
  const router = useRouter();
  const [boxes, setBoxes] = useState<MysteryBoxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [revealedResult, setRevealedResult] = useState<any>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    fetch('/api/games/mystery-ingredient')
      .then(res => res.json())
      .then(data => {
        if (data.boxes) setBoxes(data.boxes);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openBox = async (boxId: string) => {
    if (revealing) return;
    setRevealing(true);

    try {
      const res = await fetch('/api/games/mystery-ingredient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boxId }),
      });

      // Suspense delay for reveal animation
      await new Promise(r => setTimeout(r, 1500));

      if (res.ok) {
        const data = await res.json();
        setRevealedResult(data);
        awardXp(30);
        setShowCelebration(true);
      }
    } catch {} finally {
      setRevealing(false);
    }
  };

  const resetGame = () => {
    setRevealedResult(null);
  };

  return (
    <div className="min-h-screen p-4 pb-24 md:pb-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
          Decision Game #3
        </Badge>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-600 bg-clip-text text-transparent">
          Mystery Ingredient Box 🎁
        </h1>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Shake up boring dinners! Pick a mystery crate to uncover a secret ingredient and unlock an AI-crafted dinner recipe.
        </p>
      </div>

      {/* Mystery Boxes Grid */}
      {!revealedResult && (
        <div className="space-y-6">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {boxes.map((box, index) => (
                <motion.div
                  key={box.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Card 
                    className="border-2 hover:border-blue-500 transition-all cursor-pointer shadow-md hover:shadow-xl bg-gradient-to-br from-card to-blue-500/5 text-center flex flex-col justify-between h-full"
                    onClick={() => openBox(box.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-2 border border-blue-500/20">
                        <Package className="w-8 h-8 animate-pulse" />
                      </div>
                      <Badge variant="outline" className="mx-auto text-xs">
                        Box #{box.boxNumber} · {box.difficulty}
                      </Badge>
                      <CardTitle className="text-lg font-bold mt-2">{box.category}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-1">
                      <div className="p-3 bg-muted/60 rounded-xl text-xs text-muted-foreground italic flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 shrink-0 text-blue-500" />
                        <span>&quot;{box.hint}&quot;</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground pt-1 border-t">
                        <span>Cook Time: {box.cookTime}</span>
                        <span className="text-amber-500 font-semibold">+30 XP</span>
                      </div>
                      <Button 
                        disabled={revealing} 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                      >
                        {revealing ? 'Unlocking Box...' : 'Reveal Secret Ingredient 🔓'}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Revealed Ingredient & Chef Recipe */}
      <AnimatePresence>
        {revealedResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            <Card className="border-4 border-blue-500/40 shadow-2xl overflow-hidden bg-gradient-to-b from-blue-500/10 via-card to-background">
              <div className="h-3 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-600" />
              <CardHeader className="text-center space-y-2 pb-3">
                <div className="flex justify-center">
                  <Badge className="bg-amber-500 text-white font-bold flex items-center gap-1.5 px-3 py-1">
                    <Award className="w-4 h-4" /> Mystery Solved! +30 XP
                  </Badge>
                </div>
                <div className="text-7xl pt-2 animate-bounce">{revealedResult.ingredient?.emoji}</div>
                <h2 className="text-3xl font-extrabold text-foreground">{revealedResult.ingredient?.name}</h2>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {revealedResult.ingredient?.flavorProfile}
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Recipe Card */}
                {revealedResult.recipe && (
                  <div className="p-5 rounded-2xl bg-muted/60 border space-y-4 text-left">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="secondary" className="text-xs mb-1">Chef-Crafted Dinner Match</Badge>
                        <h3 className="text-xl font-bold">{revealedResult.recipe.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{revealedResult.recipe.description}</p>
                      </div>
                      <Badge variant="outline" className="flex items-center gap-1 shrink-0">
                        <Clock className="w-3.5 h-3.5" /> {revealedResult.ingredient?.cookTime || '25 min'}
                      </Badge>
                    </div>

                    {/* Pantry Requirements */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Required Pantry Staples
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {revealedResult.recipe.pantryNeeds?.map((item: string) => (
                          <Badge key={item} variant="outline" className="text-xs bg-background">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Quick Steps */}
                    <div className="space-y-2 pt-2 border-t">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Cooking Blueprint
                      </h4>
                      <ol className="space-y-1.5 text-xs text-muted-foreground">
                        {revealedResult.recipe.steps?.map((step: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-[10px]">
                              {i + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => router.push('/recipes/mystery')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg"
                    size="lg"
                  >
                    Cook This Recipe Tonight
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetGame}
                    size="lg"
                    className="flex-1"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Pick Another Box
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
