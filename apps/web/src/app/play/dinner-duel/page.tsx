'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Swords, Sparkles, Clock, Flame, ArrowRight, RotateCcw, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Celebration } from '@/components/AdvancedAnimations';
import { awardXp } from '@/components/gamification/GamificationProvider';
import { useRouter } from 'next/navigation';

interface DuelCandidate {
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

export default function DinnerDuelPage() {
  const router = useRouter();
  const [round, setRound] = useState(1);
  const [totalRounds] = useState(3);
  const [optionA, setOptionA] = useState<DuelCandidate | null>(null);
  const [optionB, setOptionB] = useState<DuelCandidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [champion, setChampion] = useState<DuelCandidate | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const fetchNextMatchup = async (currentRound: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/games/duel?round=${currentRound}`);
      const data = await res.json();
      if (data.optionA && data.optionB) {
        setOptionA(data.optionA);
        setOptionB(data.optionB);
      }
    } catch {
      // Fallback if offline
      setOptionA({
        id: 'duel-1',
        title: 'Creamy Garlic Butter Steak Bites',
        cuisine: 'Steakhouse',
        time: '20 min',
        calories: 550,
        difficulty: 'Easy',
        imageEmoji: '🥩',
        tags: ['High Protein', 'Keto'],
        description: 'Tender sirloin cubes seared in garlic butter and rosemary.',
      });
      setOptionB({
        id: 'duel-2',
        title: 'Authentic Thai Green Curry',
        cuisine: 'Thai',
        time: '25 min',
        calories: 420,
        difficulty: 'Medium',
        imageEmoji: '🍲',
        tags: ['Aromatic', 'Spicy'],
        description: 'Fragrant coconut curry with lemongrass and chicken.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNextMatchup(1);
  }, []);

  const handleVote = async (chosenOption: DuelCandidate) => {
    if (voting) return;
    setVoting(true);

    const isFinal = round >= totalRounds;

    try {
      await fetch('/api/games/duel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerId: chosenOption.id,
          round,
          isFinal,
        }),
      });
    } catch {}

    if (isFinal) {
      setChampion(chosenOption);
      awardXp(35);
      setShowCelebration(true);
      setVoting(false);
    } else {
      awardXp(10);
      setRound(prev => prev + 1);
      await fetchNextMatchup(round + 1);
      setVoting(false);
    }
  };

  const restartTournament = () => {
    setChampion(null);
    setRound(1);
    fetchNextMatchup(1);
  };

  return (
    <div className="min-h-screen p-4 pb-24 md:pb-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30">
          Decision Game #2
        </Badge>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 bg-clip-text text-transparent">
          Dinner Duel ⚔️
        </h1>
        <p className="text-muted-foreground text-sm">
          Head-to-head showdown! Pick your favorite each round to crown tonight&apos;s ultimate dinner champion.
        </p>

        {/* Tournament Progress */}
        {!champion && (
          <div className="max-w-md mx-auto pt-2">
            <div className="flex justify-between text-xs text-muted-foreground font-semibold mb-1">
              <span>Round {round} of {totalRounds}</span>
              <span>{round === 1 ? 'Quarter-Finals' : round === 2 ? 'Semi-Finals' : '🏆 Grand Championship!'}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-rose-500 to-orange-500 h-2.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(round / totalRounds) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Duel Matchup Arena */}
      {!champion && (
        <div className="relative">
          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative items-stretch">
              {/* VS Center Badge */}
              <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-16 h-16 rounded-full bg-background border-4 border-rose-500 shadow-xl items-center justify-center">
                <Swords className="w-7 h-7 text-rose-500 animate-pulse" />
              </div>

              {/* Option A */}
              {optionA && (
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="h-full"
                >
                  <Card 
                    className="h-full border-2 hover:border-rose-500 transition-all cursor-pointer shadow-lg hover:shadow-2xl overflow-hidden flex flex-col justify-between"
                    onClick={() => handleVote(optionA)}
                  >
                    <div className="h-2 bg-gradient-to-r from-rose-500 to-pink-500" />
                    <CardHeader className="text-center pb-2">
                      <div className="text-6xl mb-2">{optionA.imageEmoji}</div>
                      <Badge variant="secondary" className="mx-auto text-xs">{optionA.cuisine}</Badge>
                      <CardTitle className="text-2xl font-bold mt-2">{optionA.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">{optionA.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-2">
                      <div className="flex justify-center gap-4 text-xs text-muted-foreground border-y py-2">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {optionA.time}</span>
                        <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> {optionA.calories} kcal</span>
                        <span>{optionA.difficulty}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {optionA.tags?.map(t => (
                          <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                        ))}
                      </div>
                      <Button className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold">
                        Pick {optionA.title} 👉
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Option B */}
              {optionB && (
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="h-full"
                >
                  <Card 
                    className="h-full border-2 hover:border-orange-500 transition-all cursor-pointer shadow-lg hover:shadow-2xl overflow-hidden flex flex-col justify-between"
                    onClick={() => handleVote(optionB)}
                  >
                    <div className="h-2 bg-gradient-to-r from-orange-500 to-amber-500" />
                    <CardHeader className="text-center pb-2">
                      <div className="text-6xl mb-2">{optionB.imageEmoji}</div>
                      <Badge variant="secondary" className="mx-auto text-xs">{optionB.cuisine}</Badge>
                      <CardTitle className="text-2xl font-bold mt-2">{optionB.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">{optionB.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-2">
                      <div className="flex justify-center gap-4 text-xs text-muted-foreground border-y py-2">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {optionB.time}</span>
                        <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> {optionB.calories} kcal</span>
                        <span>{optionB.difficulty}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {optionB.tags?.map(t => (
                          <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                        ))}
                      </div>
                      <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">
                        Pick {optionB.title} 👉
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tournament Winner Announcement */}
      <AnimatePresence>
        {champion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-xl mx-auto"
          >
            <Card className="border-4 border-amber-500/40 shadow-2xl overflow-hidden text-center bg-gradient-to-b from-amber-500/10 to-background">
              <div className="h-3 bg-gradient-to-r from-amber-400 via-rose-500 to-orange-500" />
              <CardHeader className="space-y-2">
                <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 mb-2">
                  <Trophy className="w-12 h-12 animate-bounce" />
                </div>
                <Badge className="bg-amber-500 text-white font-bold mx-auto px-3 py-1 flex items-center gap-1.5">
                  <Award className="w-4 h-4" /> Tournament Champion (+35 XP)
                </Badge>
                <div className="text-7xl pt-2">{champion.imageEmoji}</div>
                <CardTitle className="text-3xl font-extrabold">{champion.title}</CardTitle>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">{champion.description}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="flex justify-center gap-6 text-sm text-muted-foreground border-y py-3">
                  <span className="flex items-center gap-1 font-medium"><Clock className="w-4 h-4 text-primary" /> {champion.time}</span>
                  <span className="flex items-center gap-1 font-medium"><Flame className="w-4 h-4 text-orange-500" /> {champion.calories} calories</span>
                  <Badge variant="outline">{champion.cuisine}</Badge>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => router.push(`/recipes/${champion.id}`)}
                    className="flex-1 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white font-bold shadow-lg"
                    size="lg"
                  >
                    Cook Winner Tonight
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={restartTournament}
                    size="lg"
                    className="flex-1"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    New Tournament
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
