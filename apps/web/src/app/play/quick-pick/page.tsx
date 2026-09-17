'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, Sparkles, ChefHat, ArrowRight, RotateCcw, Award, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Celebration } from '@/components/AdvancedAnimations';
import { awardXp } from '@/components/gamification/GamificationProvider';
import { useRouter } from 'next/navigation';

interface OptionItem {
  id: string;
  label: string;
  icon: string;
  desc: string;
}

interface FactorItem {
  id: string;
  question: string;
  options: OptionItem[];
}

export default function QuickPickPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [factors, setFactors] = useState<FactorItem[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [computing, setComputing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    fetch('/api/games/quick-pick')
      .then(res => res.json())
      .then(data => {
        if (data.factors) setFactors(data.factors);
      })
      .catch(() => {});
  }, []);

  const handleSelectOption = async (factorId: string, optionId: string) => {
    const updated = { ...selectedAnswers, [factorId]: optionId };
    setSelectedAnswers(updated);

    if (step < factors.length - 1) {
      setStep(prev => prev + 1);
    } else {
      // Final question answered - calculate result
      setComputing(true);
      try {
        const res = await fetch('/api/games/quick-pick', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            time: updated.time || '30m',
            craving: updated.craving || 'comfort',
            effort: updated.effort || 'moderate',
          }),
        });

        await new Promise(r => setTimeout(r, 1000));

        if (res.ok) {
          const data = await res.json();
          setResult(data);
          awardXp(20);
          setShowCelebration(true);
        }
      } catch {} finally {
        setComputing(false);
      }
    }
  };

  const resetGame = () => {
    setStep(0);
    setSelectedAnswers({});
    setResult(null);
  };

  const currentFactor = factors[step];

  return (
    <div className="min-h-screen p-4 pb-24 md:pb-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
          Decision Game #4
        </Badge>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
          Quick Pick ⚡
        </h1>
        <p className="text-muted-foreground text-sm">
          Exhausted after a long day? 3 quick taps to find the perfect dinner in under 15 seconds.
        </p>

        {/* Step Indicator */}
        {!result && factors.length > 0 && (
          <div className="flex justify-center items-center gap-2 pt-2">
            {factors.map((f, i) => (
              <div
                key={f.id}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step ? 'w-8 bg-amber-500' : i < step ? 'w-4 bg-amber-500/40' : 'w-4 bg-muted'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Questions Flow */}
      {!result && currentFactor && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentFactor.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="border-2 border-amber-500/30 shadow-xl overflow-hidden">
              <CardHeader className="text-center pb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Step {step + 1} of {factors.length}
                </span>
                <CardTitle className="text-2xl font-bold mt-1">
                  {currentFactor.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {currentFactor.options.map(option => (
                  <motion.div
                    key={option.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <button
                      type="button"
                      disabled={computing}
                      onClick={() => handleSelectOption(currentFactor.id, option.id)}
                      className="w-full text-left p-4 rounded-xl border-2 hover:border-amber-500 hover:bg-amber-500/5 transition-all flex items-center justify-between group shadow-sm bg-card"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{option.icon}</span>
                        <div>
                          <h4 className="font-bold text-foreground group-hover:text-amber-600 transition-colors">
                            {option.label}
                          </h4>
                          <p className="text-xs text-muted-foreground">{option.desc}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-amber-500 transition-transform group-hover:translate-x-1" />
                    </button>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Loading state during computation */}
      {computing && (
        <Card className="p-12 text-center border-2 border-amber-500/20 shadow-xl">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <h3 className="text-xl font-bold">Matching Your Cravings...</h3>
          <p className="text-xs text-muted-foreground mt-1">Analyzing optimal weeknight recipe</p>
        </Card>
      )}

      {/* Computed Winner Card */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-4 border-amber-500/40 shadow-2xl overflow-hidden text-center bg-gradient-to-b from-amber-500/10 via-card to-background">
              <div className="h-3 bg-gradient-to-r from-amber-500 to-orange-500" />
              <CardHeader className="space-y-2 pb-2">
                <div className="flex justify-center">
                  <Badge className="bg-amber-500 text-white font-bold flex items-center gap-1 px-3 py-1">
                    <Award className="w-4 h-4" /> Solved in {result.decisionTimeSeconds || 15}s! +20 XP
                  </Badge>
                </div>
                <div className="text-7xl pt-2 animate-bounce">{result.recipe?.emoji || '🍽️'}</div>
                <CardTitle className="text-3xl font-extrabold">{result.recipe?.title}</CardTitle>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">{result.recipe?.description}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="flex justify-center gap-4 text-xs text-muted-foreground border-y py-2.5">
                  <span className="flex items-center gap-1 font-medium"><Clock className="w-3.5 h-3.5" /> Prep: {result.recipe?.prepTime}</span>
                  <span className="flex items-center gap-1 font-medium"><ChefHat className="w-3.5 h-3.5" /> Cook: {result.recipe?.cookTime}</span>
                  <Badge variant="outline">{result.recipe?.cuisine}</Badge>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => router.push(`/recipes/${result.recipe?.id || 'new'}`)}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg"
                    size="lg"
                  >
                    Cook This Tonight
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetGame}
                    size="lg"
                    className="flex-1"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Quick Pick Again
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
