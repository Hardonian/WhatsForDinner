'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Heart, X, Star, Clock, Flame, Sparkles, ArrowRight, RotateCcw, Award, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Celebration } from '@/components/AdvancedAnimations';
import { awardXp } from '@/components/gamification/GamificationProvider';
import { useRouter } from 'next/navigation';

interface SwipeCardItem {
  id: string;
  title: string;
  cuisine: string;
  cookTime: string;
  calories: number;
  pantryMatchPct: number;
  imageEmoji: string;
  difficulty: string;
  dietary: string[];
  keyIngredients: string[];
  description: string;
}

function TinderCard({
  card,
  onSwipe,
}: {
  card: SwipeCardItem;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.6, 1, 1, 1, 0.6]);

  const likeOpacity = useTransform(x, [10, 100], [0, 1]);
  const passOpacity = useTransform(x, [-10, -100], [0, 1]);

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 100) {
          onSwipe('right');
        } else if (info.offset.x < -100) {
          onSwipe('left');
        }
      }}
      className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
    >
      <Card className="h-full border-2 border-primary/20 shadow-2xl overflow-hidden bg-card/95 backdrop-blur-md flex flex-col justify-between">
        {/* Swipe Overlays */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-6 right-6 z-30 border-4 border-emerald-500 text-emerald-500 px-4 py-1 rounded-xl font-extrabold text-2xl rotate-12 bg-background/80 pointer-events-none"
        >
          CRAVE ❤️
        </motion.div>
        <motion.div
          style={{ opacity: passOpacity }}
          className="absolute top-6 left-6 z-30 border-4 border-rose-500 text-rose-500 px-4 py-1 rounded-xl font-extrabold text-2xl -rotate-12 bg-background/80 pointer-events-none"
        >
          PASS ❌
        </motion.div>

        {/* Card Header & Visual */}
        <div>
          <div className="h-2 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500" />
          <div className="p-6 text-center">
            <div className="text-8xl my-4 filter drop-shadow-md">{card.imageEmoji}</div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">{card.cuisine}</Badge>
              <Badge className="bg-emerald-500 text-white text-xs">
                {card.pantryMatchPct}% In Pantry
              </Badge>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{card.title}</h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">{card.description}</p>
          </div>
        </div>

        {/* Card Stats & Ingredients */}
        <div className="p-6 pt-0 space-y-4">
          <div className="flex justify-around text-xs text-muted-foreground border-y py-2.5 bg-muted/40 rounded-xl">
            <span className="flex items-center gap-1 font-medium"><Clock className="w-3.5 h-3.5" /> {card.cookTime}</span>
            <span className="flex items-center gap-1 font-medium"><Flame className="w-3.5 h-3.5" /> {card.calories} kcal</span>
            <span className="font-medium">{card.difficulty}</span>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1.5">
              Key Ingredients:
            </div>
            <div className="flex flex-wrap gap-1">
              {card.keyIngredients?.map(ing => (
                <Badge key={ing} variant="outline" className="text-[11px]">
                  {ing}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function SwipeGamePage() {
  const router = useRouter();
  const [deck, setDeck] = useState<SwipeCardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchResult, setMatchResult] = useState<SwipeCardItem | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [likedCount, setLikedCount] = useState(0);

  useEffect(() => {
    fetch('/api/games/swipe?limit=8')
      .then(res => res.json())
      .then(data => {
        if (data.cards) setDeck(data.cards);
      })
      .catch(() => {});
  }, []);

  const handleSwipe = async (direction: 'left' | 'right' | 'up') => {
    if (currentIndex >= deck.length) return;
    const currentCard = deck[currentIndex];

    const action = direction === 'right' ? 'like' : direction === 'up' ? 'superlike' : 'pass';

    if (action === 'like' || action === 'superlike') {
      setLikedCount(prev => prev + 1);
    }

    try {
      const res = await fetch('/api/games/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: currentCard.id, action }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.isMatch || action === 'superlike') {
          setMatchResult(data.matchedMeal || currentCard);
          awardXp(data.xpEarned || 25);
          setShowCelebration(true);
          return;
        }
      }
    } catch {}

    setCurrentIndex(prev => prev + 1);
  };

  const currentCard = deck[currentIndex];
  const isDeckEmpty = currentIndex >= deck.length;

  return (
    <div className="min-h-screen p-4 pb-24 md:pb-6 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="text-center space-y-1">
        <Badge variant="outline" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30">
          Decision Game #5
        </Badge>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 to-rose-600 bg-clip-text text-transparent">
          Dinner Swipe 🔥
        </h1>
        <p className="text-xs text-muted-foreground">
          Swipe right on meals you crave, left to pass. Find tonight&apos;s match in seconds!
        </p>
      </div>

      {/* Swipe Deck Container */}
      <div className="relative w-full h-[470px] flex items-center justify-center my-2">
        <AnimatePresence>
          {!isDeckEmpty && currentCard && (
            <TinderCard
              key={currentCard.id}
              card={currentCard}
              onSwipe={handleSwipe}
            />
          )}
        </AnimatePresence>

        {isDeckEmpty && !matchResult && (
          <Card className="w-full h-full p-8 text-center flex flex-col items-center justify-center space-y-4 border-2 border-dashed">
            <div className="text-6xl">🎉</div>
            <CardTitle className="text-2xl font-bold">You&apos;ve Seen All Dishes!</CardTitle>
            <p className="text-xs text-muted-foreground max-w-xs">
              You liked {likedCount} recipes. Shuffle the deck to discover more dinner inspirations.
            </p>
            <Button
              onClick={() => {
                setCurrentIndex(0);
                setLikedCount(0);
              }}
              className="bg-primary text-primary-foreground font-semibold"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Shuffle Deck Again
            </Button>
          </Card>
        )}
      </div>

      {/* Bottom Action Controls */}
      {!isDeckEmpty && (
        <div className="flex items-center justify-center gap-6 pt-2">
          {/* Pass Button */}
          <Button
            size="lg"
            variant="outline"
            onClick={() => handleSwipe('left')}
            className="w-14 h-14 rounded-full border-2 border-rose-500/40 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-md p-0 flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Super Like / Cook Tonight Button */}
          <Button
            size="lg"
            onClick={() => handleSwipe('up')}
            className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-xl hover:scale-110 transition-transform p-0 flex items-center justify-center"
          >
            <Star className="w-7 h-7 fill-white" />
          </Button>

          {/* Crave Button */}
          <Button
            size="lg"
            variant="outline"
            onClick={() => handleSwipe('right')}
            className="w-14 h-14 rounded-full border-2 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-md p-0 flex items-center justify-center"
          >
            <Heart className="w-6 h-6 fill-current" />
          </Button>
        </div>
      )}

      {/* Match Result Overlay Modal */}
      <AnimatePresence>
        {matchResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8 }}
              className="w-full max-w-md"
            >
              <Card className="border-4 border-rose-500/40 shadow-2xl text-center overflow-hidden bg-gradient-to-b from-rose-500/15 via-card to-background">
                <div className="h-3 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500" />
                <CardHeader className="space-y-2 pb-2">
                  <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-2">
                    <Heart className="w-8 h-8 fill-rose-500 animate-pulse" />
                  </div>
                  <Badge className="bg-rose-600 text-white font-bold mx-auto px-3 py-1 flex items-center gap-1">
                    <Award className="w-4 h-4" /> It&apos;s a Dinner Match! +25 XP
                  </Badge>
                  <div className="text-7xl pt-2">{matchResult.imageEmoji}</div>
                  <CardTitle className="text-2xl font-extrabold">{matchResult.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">{matchResult.description}</p>
                </CardHeader>

                <CardContent className="space-y-4 pt-2">
                  <div className="flex justify-around text-xs text-muted-foreground border-y py-2.5">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {matchResult.cookTime}</span>
                    <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> {matchResult.calories} kcal</span>
                    <Badge variant="outline">{matchResult.cuisine}</Badge>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      onClick={() => router.push(`/recipes/${matchResult.id}`)}
                      className="w-full bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white font-bold shadow-lg"
                      size="lg"
                    >
                      Cook This Tonight
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setMatchResult(null);
                        setCurrentIndex(prev => prev + 1);
                      }}
                      className="text-xs"
                    >
                      Keep Swiping
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showCelebration && (
        <Celebration type="achievement" onComplete={() => setShowCelebration(false)} />
      )}
    </div>
  );
}
