'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Clock,
  Sparkles,
  HelpCircle,
  X,
  Flame,
  Utensils,
  Maximize2,
  Minimize2,
  AlertCircle,
  Thermometer,
  ShieldCheck,
  Shuffle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { soundEffects } from '@/lib/audio/sound-effects';
import {
  DynamicRecipe,
  applyIngredientSwap,
  shuffleRecipeRemix,
} from '@/lib/recipes/recipe-mutator';

export const USDA_TEMPERATURE_GUIDE = [
  { item: 'Poultry (Whole, Ground, Breasts)', tempF: 165, tempC: 74, rest: '0 min' },
  { item: 'Ground Meats (Beef, Pork, Lamb)', tempF: 160, tempC: 71, rest: '0 min' },
  { item: 'Beef, Pork, Veal, Lamb (Steaks, Chops)', tempF: 145, tempC: 63, rest: '3 min rest' },
  { item: 'Fish & Shellfish (Salmon, Shrimp)', tempF: 145, tempC: 63, rest: '0 min' },
  { item: 'Leftovers & Casseroles', tempF: 165, tempC: 74, rest: '0 min' },
];

export interface CookingRecipe {
  id: string;
  title: string;
  cookTime: string;
  calories: number;
  servings: number;
  difficulty?: string;
  pantryIngredientsUsed: string[];
  missingIngredients?: string[];
  steps: string[];
  proTips?: Record<number, string>;
  substitutions?: Record<string, string>;
}

interface CookingHUDProps {
  recipe: CookingRecipe;
  onFinish?: () => void;
}

interface ActiveTimer {
  id: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
}

const COMMON_SUBSTITUTIONS: Record<string, string> = {
  'butter': 'Olive oil or coconut oil (1:1 ratio) or mashed avocado in baking',
  'eggs': '1/4 cup applesauce, or 1 tbsp chia seeds + 3 tbsp water (per egg)',
  'heavy cream': 'Full-fat coconut milk or 3/4 cup milk + 1/4 cup melted butter',
  'buttermilk': '1 cup whole milk + 1 tbsp fresh lemon juice or white vinegar (let sit 5m)',
  'garlic': '1/8 tsp garlic powder per clove or 1 shallot finely minced',
  'soy sauce': 'Tamari (gluten-free) or coconut aminos with pinch of sea salt',
  'white wine': 'Chicken or vegetable stock with 1 tsp lemon juice or white vinegar',
  'brown sugar': 'White sugar + 1 tsp molasses or maple syrup / honey',
  'sour cream': 'Plain whole-milk Greek yogurt (1:1 replacement)',
  'parmesan': 'Pecorino Romano, nutritional yeast, or toasted breadcrumbs with garlic',
};

export function CookingHUD({ recipe, onFinish }: CookingHUDProps) {
  const [activeRecipe, setActiveRecipe] = useState<DynamicRecipe>({
    ...recipe,
    difficulty: recipe.difficulty || 'Easy',
    cuisine: 'Chef Specialty',
    proTips: recipe.proTips || {},
    substitutions: recipe.substitutions || {},
    activeSwaps: [],
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);
  const [isSubstitutionsOpen, setIsSubstitutionsOpen] = useState(false);
  const [selectedSubIngredient, setSelectedSubIngredient] = useState<string | null>(null);
  const [isTempsGuideOpen, setIsTempsGuideOpen] = useState(false);

  useEffect(() => {
    setActiveRecipe({
      ...recipe,
      difficulty: recipe.difficulty || 'Easy',
      cuisine: 'Chef Specialty',
      proTips: recipe.proTips || {},
      substitutions: recipe.substitutions || {},
      activeSwaps: [],
    });
  }, [recipe]);

  const handleSwapIngredient = (ingredientKey: string) => {
    const updated = applyIngredientSwap(activeRecipe, ingredientKey);
    setActiveRecipe(updated);
    soundEffects.playClick();
    const isNowActive = updated.activeSwaps?.some(
      s => s.original.toLowerCase() === ingredientKey.toLowerCase()
    );
    if (isNowActive) {
      toast.success(`Swapped ${ingredientKey}!`, {
        description: `Adapted cooking instructions, timings, and heat control across all steps.`,
      });
    } else {
      toast.info(`Reverted ${ingredientKey} to original recipe.`);
    }
  };

  const handleShuffleRemix = () => {
    const remixed = shuffleRecipeRemix(activeRecipe);
    setActiveRecipe(remixed);
    setCurrentStepIndex(0);
    soundEffects.playVictory();
    toast.success(`Shuffled Style: ${remixed.variationName}!`, {
      description: `Updated culinary technique, prep steps, and cook time (${remixed.cookTime}).`,
    });
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<unknown>(null);
  const wakeLockRef = useRef<any>(null);

  // Screen Wake Lock API to prevent phone/tablet sleep in the kitchen
  useEffect(() => {
    async function requestWakeLock() {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch {
          // Ignore wake lock rejection
        }
      }
    }
    requestWakeLock();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  // Speech Recognition setup (hands-free kitchen voice mode)
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechClass = (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
                          (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;
      
      const recognition = new SpeechClass();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult && lastResult[0]) {
          const command = lastResult[0].transcript.trim().toLowerCase();
          handleVoiceCommand(command);
        }
      };

      recognition.onerror = () => {
        setIsVoiceActive(false);
      };

      recognitionRef.current = recognition;
    }
  }, [currentStepIndex]);

  // Voice Command Dispatcher with kitchen sizzle noise filtering
  const handleVoiceCommand = (command: string) => {
    // Sizzle & background noise gate: ignore tiny or non-speech phonetics
    if (!command || command.length < 3 || ['uh', 'um', 'ah', 'oh', 'shh'].includes(command)) {
      return;
    }

    toast.info(`Voice command heard: "${command}"`, { duration: 2000 });

    if (command.includes('next') || command.includes('continue') || command.includes('done')) {
      handleNextStep();
    } else if (command.includes('back') || command.includes('previous')) {
      handlePrevStep();
    } else if (command.includes('repeat') || command.includes('read')) {
      speakCurrentStep();
    } else if (command.includes('timer')) {
      const match = command.match(/\d+/);
      const minutes = match ? parseInt(match[0], 10) : 5;
      addTimer(`${minutes}m Cook Timer`, minutes * 60);
    } else if (command.includes('substitute') || command.includes('replacement')) {
      setIsSubstitutionsOpen(true);
    } else if (command.includes('temp') || command.includes('temperature') || command.includes('doneness')) {
      setIsTempsGuideOpen(true);
    }
  };

  const toggleVoiceMode = () => {
    const recognition = recognitionRef.current as { start: () => void; stop: () => void } | null;
    if (!recognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    if (isVoiceActive) {
      recognition.stop();
      setIsVoiceActive(false);
      toast.info('Voice controls paused');
    } else {
      try {
        recognition.start();
        setIsVoiceActive(true);
        toast.success('OmniChef Voice Active! Say "Next", "Back", "Repeat", or "Timer 5"');
      } catch {
        setIsVoiceActive(false);
      }
    }
  };

  // Text-To-Speech Step Reader
  const speakCurrentStep = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const currentStepText = activeRecipe.steps[currentStepIndex];
    if (!currentStepText) return;

    const utterance = new SpeechSynthesisUtterance(`Step ${currentStepIndex + 1}: ${currentStepText}`);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Step Navigations
  const handleNextStep = () => {
    if (!completedSteps.includes(currentStepIndex)) {
      setCompletedSteps(prev => [...prev, currentStepIndex]);
    }
    if (currentStepIndex < activeRecipe.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      toast.success('🎉 Cooking completed! Bon appétit!');
      if (onFinish) onFinish();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  // Timer Management
  const addTimer = (label: string, totalSeconds: number) => {
    const newTimer: ActiveTimer = {
      id: Math.random().toString(36).substring(2, 9),
      label,
      totalSeconds,
      remainingSeconds: totalSeconds,
      isRunning: true,
    };
    setActiveTimers(prev => [...prev, newTimer]);
    toast.success(`Started ${Math.round(totalSeconds / 60)}m timer: ${label}`);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTimers(prev =>
        prev.map(timer => {
          if (!timer.isRunning || timer.remainingSeconds <= 0) return timer;
          const next = timer.remainingSeconds - 1;
          if (next === 0) {
            // Audio synthesizer chime and speech alert
            soundEffects.playTimerAlarm();
            toast.success(`⏰ Timer Finished: ${timer.label}!`, { duration: 6000 });
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
              const utter = new SpeechSynthesisUtterance(`Timer finished for ${timer.label}`);
              window.speechSynthesis.speak(utter);
            }
          }
          return { ...timer, remainingSeconds: next };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleTimerPause = (id: string) => {
    setActiveTimers(prev =>
      prev.map(t => (t.id === id ? { ...t, isRunning: !t.isRunning } : t))
    );
  };

  const removeTimer = (id: string) => {
    setActiveTimers(prev => prev.filter(t => t.id !== id));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentStep = activeRecipe.steps[currentStepIndex] || 'Ready to cook!';
  const proTip = activeRecipe.proTips?.[currentStepIndex];
  const progressPercent = Math.round(((completedSteps.length) / activeRecipe.steps.length) * 100);

  return (
    <div
      ref={containerRef}
      className={`min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 p-4 sm:p-8 transition-colors ${
        isFullscreen ? 'fixed inset-0 z-50 overflow-y-auto' : ''
      }`}
    >
      {/* Top Header & Kitchen HUD Toolbar */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-primary/20 text-primary border-primary/40 font-semibold px-2.5 py-0.5">
              OmniChef™ Kitchen HUD
            </Badge>
            {activeRecipe.variationName && (
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                {activeRecipe.variationName}
              </Badge>
            )}
            <span className="text-xs text-slate-400 font-medium">
              Step {currentStepIndex + 1} of {activeRecipe.steps.length} • {activeRecipe.cookTime}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white line-clamp-1">
            {activeRecipe.title}
          </h1>
        </div>

        {/* HUD Control Bar */}
        <div className="flex items-center gap-2">
          {/* Shuffle / Remix Recipe Variation */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShuffleRemix}
            className="border-purple-800/80 bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 text-xs h-9"
          >
            <Shuffle className="w-4 h-4 mr-1.5 text-purple-400" />
            <span>Shuffle Recipe</span>
          </Button>

          {/* Voice Mode Toggle */}
          <Button
            variant={isVoiceActive ? 'default' : 'outline'}
            size="sm"
            onClick={toggleVoiceMode}
            className={`font-semibold text-xs h-9 transition-all ${
              isVoiceActive
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse border-red-500'
                : 'border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200'
            }`}
          >
            {isVoiceActive ? (
              <>
                <Mic className="w-4 h-4 mr-1.5" />
                <span>Listening...</span>
              </>
            ) : (
              <>
                <MicOff className="w-4 h-4 mr-1.5" />
                <span>Voice Controls</span>
              </>
            )}
          </Button>

          {/* Read Step Audio */}
          <Button
            variant="outline"
            size="sm"
            onClick={speakCurrentStep}
            className="border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs h-9"
          >
            {isSpeaking ? (
              <VolumeX className="w-4 h-4 mr-1.5 text-amber-400" />
            ) : (
              <Volume2 className="w-4 h-4 mr-1.5 text-primary" />
            )}
            <span>{isSpeaking ? 'Stop' : 'Read'}</span>
          </Button>

          {/* Emergency Substitutions */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSubstitutionsOpen(true)}
            className="border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs h-9"
          >
            <HelpCircle className="w-4 h-4 mr-1.5 text-yellow-400" />
            <span>Substitutions</span>
          </Button>

          {/* USDA Safe Temperatures Guide */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTempsGuideOpen(true)}
            className="border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs h-9"
          >
            <Thermometer className="w-4 h-4 mr-1.5 text-emerald-400" />
            <span>Safe Temps</span>
          </Button>

          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="text-slate-400 hover:text-white h-9 w-9"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      {/* Main Focus Area: The Step Display Card */}
      <main className="my-auto py-8 max-w-4xl mx-auto w-full space-y-6">
        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-400 font-medium">
            <span>Overall Cooking Progress</span>
            <span>{progressPercent}% Completed</span>
          </div>
          <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full"
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Active Swaps Indicator Banner */}
        {activeRecipe.activeSwaps && activeRecipe.activeSwaps.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-purple-300 font-semibold uppercase tracking-wider">
              Adapted Recipe Swaps:
            </span>
            {activeRecipe.activeSwaps.map(swap => (
              <Badge
                key={swap.original}
                className="bg-purple-950 border border-purple-500/50 text-purple-200 text-xs py-1 px-3 flex items-center gap-2"
              >
                <span>🔄 {swap.original} → {swap.replacement}</span>
                <button
                  onClick={() => handleSwapIngredient(swap.original)}
                  className="hover:text-red-400 font-black text-sm ml-1 leading-none"
                  title="Revert swap to original"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Large Counter-Optimized Step Hero */}
        <Card className="border border-slate-800 bg-slate-900/90 shadow-2xl p-6 sm:p-10 rounded-3xl relative overflow-hidden backdrop-blur">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Utensils className="w-48 h-48 text-white" />
          </div>

          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center text-lg font-black border border-primary/30">
                {currentStepIndex + 1}
              </span>
              <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Current Kitchen Instruction
              </span>
            </div>

            {/* Huge Step Text designed for 4-foot reading distance */}
            <p className="text-2xl sm:text-4xl font-extrabold text-white leading-relaxed tracking-tight">
              {currentStep}
            </p>

            {/* Chef Pro Tip Callout if available */}
            {proTip && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm flex items-start gap-3"
              >
                <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Chef Pro-Tip: </span>
                  <span>{proTip}</span>
                </div>
              </motion.div>
            )}

            {/* 1-Tap Preset Timers based on step content */}
            <div className="flex flex-wrap gap-2 pt-2">
              {[2, 4, 8, 15].map(mins => (
                <Button
                  key={mins}
                  variant="outline"
                  size="sm"
                  onClick={() => addTimer(`${mins}m Step Timer`, mins * 60)}
                  className="bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200 text-xs h-8"
                >
                  <Clock className="w-3.5 h-3.5 mr-1 text-primary" />
                  <span>+{mins}m Timer</span>
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Active Multi-Timers Floating Tray */}
        <AnimatePresence>
          {activeTimers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {activeTimers.map(timer => {
                const isFinished = timer.remainingSeconds === 0;
                return (
                  <div
                    key={timer.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                      isFinished
                        ? 'bg-red-950/40 border-red-500 text-red-200 animate-bounce'
                        : 'bg-slate-900 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-400">
                        {timer.label}
                      </span>
                      <p className="text-2xl font-black font-mono tracking-tight text-white mt-0.5">
                        {formatTime(timer.remainingSeconds)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleTimerPause(timer.id)}
                        className="h-8 w-8 text-slate-300 hover:text-white"
                      >
                        {timer.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeTimer(timer.id)}
                        className="h-8 w-8 text-slate-400 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Counter Navigation Controls */}
      <footer className="pt-6 border-t border-slate-800 flex items-center justify-between gap-4 max-w-4xl mx-auto w-full">
        <Button
          size="lg"
          variant="outline"
          onClick={handlePrevStep}
          disabled={currentStepIndex === 0}
          className="border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold px-6 h-14 rounded-2xl"
        >
          <ChevronLeft className="w-5 h-5 mr-1.5" />
          <span>Previous</span>
        </Button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <span>Keyboard: Left / Right Arrow • Space to Read</span>
        </div>

        <Button
          size="lg"
          onClick={handleNextStep}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-8 h-14 rounded-2xl shadow-xl shadow-primary/20 flex-1 sm:flex-initial"
        >
          <span>{currentStepIndex === activeRecipe.steps.length - 1 ? 'Finish Dish' : 'Next Step'}</span>
          <ChevronRight className="w-5 h-5 ml-1.5" />
        </Button>
      </footer>

      {/* Emergency Substitution Drawer Modal */}
      <AnimatePresence>
        {isSubstitutionsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <Card className="max-w-md w-full bg-slate-900 border-slate-800 text-slate-100 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-800">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <span>Instant Ingredient Substitutions</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSubstitutionsOpen(false)}
                  className="text-slate-400 hover:text-white h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>

              <CardContent className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <p className="text-xs text-slate-400">
                  Missing an ingredient mid-cook? Tap <strong>Apply Swap</strong> to dynamically re-write cooking instructions, temperatures, and timings:
                </p>

                <div className="space-y-2.5">
                  {Object.entries({ ...COMMON_SUBSTITUTIONS, ...activeRecipe.substitutions }).map(
                    ([ingredient, alternative]) => {
                      const isSwapped = activeRecipe.activeSwaps?.some(
                        s => s.original.toLowerCase() === ingredient.toLowerCase()
                      );

                      return (
                        <div
                          key={ingredient}
                          className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                            isSwapped
                              ? 'border-purple-500/60 bg-purple-950/40 shadow-lg shadow-purple-900/20'
                              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-sm text-white capitalize">
                            <span className="flex items-center gap-2">
                              {isSwapped && <span className="text-purple-400 text-xs">● ACTIVE</span>}
                              <span>{ingredient}</span>
                            </span>
                            <Button
                              size="sm"
                              variant={isSwapped ? 'secondary' : 'default'}
                              onClick={() => handleSwapIngredient(ingredient)}
                              className={`text-xs h-7 px-2.5 font-bold ${
                                isSwapped
                                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                              }`}
                            >
                              {isSwapped ? 'Revert Original' : 'Apply Swap to Steps'}
                            </Button>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">{alternative}</p>
                        </div>
                      );
                    }
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* USDA Safe Internal Cooking Temperatures Modal */}
      <AnimatePresence>
        {isTempsGuideOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <Card className="max-w-lg w-full bg-slate-900 border-slate-800 text-slate-100 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-800">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>USDA Safe Internal Cooking Temperatures</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsTempsGuideOpen(false)}
                  className="text-slate-400 hover:text-white h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                <p className="text-xs text-slate-400">
                  Always insert an instant-read meat thermometer into the thickest part of the food to verify these food safety standards:
                </p>

                <div className="space-y-2.5">
                  {USDA_TEMPERATURE_GUIDE.map((guide) => (
                    <div
                      key={guide.item}
                      className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-sm text-white">{guide.item}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Rest requirement: {guide.rest}</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-sm font-mono font-bold px-2.5 py-0.5">
                          {guide.tempF}°F ({guide.tempC}°C)
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
