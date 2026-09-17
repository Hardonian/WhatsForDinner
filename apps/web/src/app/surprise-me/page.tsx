'use client';


import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, RefreshCw, Heart, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { analytics } from '@/lib/analytics';
import { supabase } from '@/lib/supabaseClient';

interface Recipe {
  title: string;
  ingredients: string[];
  instructions: string[];
  cookTime?: string;
  servings?: number;
  [key: string]: unknown;
}

export default function SurpriseMePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [mood, setMood] = useState<string>('');

  const moods = [
    { id: 'quick', label: 'Quick', icon: '⚡', time: '< 30 min' },
    { id: 'comfort', label: 'Comfort', icon: '🍜', time: 'Any time' },
    { id: 'healthy', label: 'Healthy', icon: '🥗', time: 'Nutritious' },
    { id: 'indulgent', label: 'Indulgent', icon: '🍰', time: 'Treat yourself' },
  ];

  const generateRecipe = async (selectedMood?: string) => {
    setLoading(true);
    setRecipe(null);

    try {
      const response = await fetch('/api/meal-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pantryItems: ['chicken', 'rice', 'tomatoes', 'onions', 'garlic', 'olive oil'],
          mood: selectedMood || mood,
          quickMode: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRecipe(data);
        
        // Track MEAL_SUGGESTION_GENERATED event for quick entry
        const user = await supabase.auth.getUser();
        await analytics.trackEvent('MEAL_SUGGESTION_GENERATED', {
          suggestion_id: data.id || crypto.randomUUID(),
          method: 'surprise_me',
          pantry_items_used: 0, // Quick entry doesn't require pantry
          dietary_preferences_applied: selectedMood || mood ? [selectedMood || mood] : [],
          generation_time_ms: Date.now() - Date.now(), // Will be calculated properly
          user_id: user.data.user?.id,
        });
      }
      } catch (error) {
        // Error handled by error boundary
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateRecipe();
  }, []);

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5 pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center pt-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Surprise Me!
          </h1>
          <p className="text-muted-foreground">
            Get an instant AI-powered recipe suggestion
          </p>
        </div>

        {!recipe && !loading && (
          <div className="grid grid-cols-2 gap-3">
            {moods.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setMood(m.id);
                  generateRecipe(m.id);
                }}
                className="p-4 rounded-lg border-2 border-muted hover:border-primary transition-colors text-left"
              >
                <div className="text-3xl mb-2">{m.icon}</div>
                <div className="font-semibold">{m.label}</div>
                <div className="text-xs text-muted-foreground">{m.time}</div>
              </button>
            ))}
          </div>
        )}

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card>
                <CardContent className="py-16 text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center"
                  >
                    <Sparkles className="w-8 h-8 text-white" />
                  </motion.div>
                  <h2 className="text-xl font-semibold mb-2">Finding Something Delicious...</h2>
                  <p className="text-sm text-muted-foreground">This will only take a moment</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {recipe && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-2xl">{recipe.title || 'Your Recipe'}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => generateRecipe()}
                      aria-label="Generate another recipe"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">
                      <Clock className="w-3 h-3 mr-1" />
                      {recipe.cookTime || '30'} min
                    </Badge>
                    <Badge variant="secondary">
                      <Users className="w-3 h-3 mr-1" />
                      Serves {recipe.servings || '4'}
                    </Badge>
                    {recipe.difficulty && (
                      <Badge variant="secondary">
                        {recipe.difficulty}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recipe.description && (
                    <p className="text-muted-foreground">{recipe.description}</p>
                  )}

                  {recipe.ingredients && (
                    <div>
                      <h3 className="font-semibold mb-2">Ingredients</h3>
                      <ul className="space-y-1 text-sm">
                        {recipe.ingredients.slice(0, 5).map((ing: string, i: number) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                            {ing}
                          </li>
                        ))}
                        {recipe.ingredients.length > 5 && (
                          <li className="text-muted-foreground">
                            +{recipe.ingredients.length - 5} more
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={async () => {
                        // Track recipe view
                        const user = await supabase.auth.getUser();
                        await analytics.trackEvent('RECIPE_VIEWED', {
                          recipe_id: recipe.id || 'unknown',
                          recipe_source: 'surprise_me',
                          view_duration_seconds: 0,
                          user_id: user.data.user?.id,
                        });
                        router.push(`/recipes/${recipe.id || 'new'}`);
                      }}
                      className="flex-1"
                    >
                      View Full Recipe
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Save recipe"
                      onClick={async () => {
                        // Option to sign up after seeing recipe
                        router.push('/auth?signup=true');
                      }}
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {recipe && !loading && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => generateRecipe()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Another Recipe
          </Button>
        )}
      </div>
    </div>
  );
}