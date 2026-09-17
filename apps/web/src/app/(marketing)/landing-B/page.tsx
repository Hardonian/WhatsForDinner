'use client';


import { useState, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Recipe } from '@whats-for-dinner/utils';
import { useGenerateRecipes, useSaveRecipe } from '@/hooks/useRecipes';
import { usePantryItems } from '@/hooks/usePantry';
import { useTenant } from '@/hooks/useTenant';
import RecipeCard from '@/components/RecipeCard';
import InputPrompt from '@/components/InputPrompt';
import Navbar from '@/components/Navbar';
import {
  RecipeCardSkeleton,
  InputPromptSkeleton,
} from '@/components/SkeletonLoader';
import { queryClient } from '@/lib/queryClient';
import { analytics } from '@/lib/analytics';
import { logger } from '@/lib/logger';
import { trackConversion } from '@/lib/experiments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChefHat, Clock, Users, Zap, ArrowRight, Check, Sparkles } from 'lucide-react';
import Link from 'next/link';

function LandingB() {
  const [user, setUser] = useState<unknown>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const generateRecipesMutation = useGenerateRecipes();
  const saveRecipeMutation = useSaveRecipe();
  const { data: pantryItems = [], isLoading: pantryLoading } = usePantryItems();
  const { tenant, usage } = useTenant();
  const pantryItemNames = (pantryItems as any[]).map(item => item.ingredient);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        analytics.setUserId(user.id);
        logger.setUserId(user.id);
      }

      await analytics.trackEvent('page_viewed', {
        page: 'landing-B',
        variant: 'B',
        user_authenticated: !!user,
      });

      if (user) {
        const { data: onboarding } = await supabase
          .from('onboarding_state')
          .select('checklist_completed')
          .eq('user_id', user.id)
          .single();
        
        if (!onboarding?.checklist_completed) {
          setShowOnboarding(true);
        }
      }
    };

    getUser();
  }, []);

  const generateRecipes = async (
    ingredients: string[],
    preferences: string
  ) => {
    try {
      await analytics.trackEvent('recipe_generation_started', {
        ingredients_count: ingredients.length,
        has_preferences: !!preferences,
        user_authenticated: !!user,
        variant: 'B',
      });

      const result = await generateRecipesMutation.mutateAsync({
        ingredients,
        preferences,
      });
      setRecipes(result.recipes);

      await analytics.trackEvent('recipe_generation_completed', {
        recipes_count: result.recipes.length,
        variant: 'B',
      });
    } catch (error) {
      await analytics.trackEvent('recipe_generation_failed', {
        error: error.message,
        variant: 'B',
      });
      // Error handled: Error generating recipes:
    }
  };

  const saveRecipe = async (recipe: Recipe) => {
    if (!user) return;

    try {
      await saveRecipeMutation.mutateAsync(recipe);
      await analytics.trackEvent('recipe_saved', {
        recipe_title: recipe.title,
        variant: 'B',
      });
    } catch (error) {
      // Error handled: Error saving recipe:
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <Navbar user={user} />

      <main className="container mx-auto space-y-8 px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Section - Outcome-Focused Variant */}
        <div className="space-y-6 text-center max-w-4xl mx-auto">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 mb-6 animate-pulse">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h1 className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-4xl sm:text-5xl md:text-6xl font-bold text-transparent leading-tight">
              From pantry to plate in 30 seconds
            </h1>
            <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground md:text-2xl px-2 leading-relaxed">
              Stop wondering what's for dinner. Get AI-powered recipes that fit your kitchen, your diet, and your schedule.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mt-8">
            <Card className="border-2 bg-gradient-to-br from-primary/5 to-background">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold mb-2">Instant Ideas</h3>
                <p className="text-sm text-muted-foreground">
                  Get recipe suggestions in seconds
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 bg-gradient-to-br from-primary/5 to-background">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <ChefHat className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold mb-2">Personalized</h3>
                <p className="text-sm text-muted-foreground">
                  Recipes tailored to your preferences
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 bg-gradient-to-br from-primary/5 to-background">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold mb-2">Time-Saving</h3>
                <p className="text-sm text-muted-foreground">
                  Save 15+ minutes per meal decision
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Button
              size="lg"
              className="group text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg"
              onClick={() => {
                document.getElementById('recipe-input')?.scrollIntoView({ behavior: 'smooth' });
                analytics.trackEvent('cta_clicked', { location: 'hero', variant: 'B', action: 'scroll_to_input' });
              }}
            >
              Try It Now
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6"
              asChild
            >
              <Link href="/pricing">
                See Plans
              </Link>
            </Button>
          </div>

          {/* Usage Stats */}
          {tenant && usage && (
            <Card className="mx-auto w-full max-w-2xl mt-8 border-2 shadow-lg">
              <CardHeader className="pb-3 px-6">
                <CardTitle className="text-center text-lg">Your Plan</CardTitle>
              </CardHeader>
              <CardContent className="px-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-2 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <ChefHat className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <Badge variant="outline" className="font-semibold">
                      {tenant.plan.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">Meals Today</p>
                    <p className="text-lg font-semibold text-foreground">
                      {usage.total_meals_today} / {usage.plan_quota}
                    </p>
                  </div>
                  <div className="space-y-2 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                      <Zap className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">Remaining</p>
                    <p className="text-lg font-semibold text-green-600">
                      {usage.remaining_quota}
                    </p>
                  </div>
                  {tenant.plan === 'free' && (
                    <div className="space-y-2 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                        <Users className="h-6 w-6 text-orange-600" />
                      </div>
                      <p className="text-sm text-muted-foreground">Upgrade</p>
                      <Button
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <Link href="/pricing">Upgrade</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recipe Input Section */}
        <div id="recipe-input" className="scroll-mt-20">
          {pantryLoading ? (
            <InputPromptSkeleton />
          ) : pantryItemNames.length === 0 && recipes.length === 0 ? (
            <Card className="max-w-2xl mx-auto border-2">
              <CardHeader>
                <CardTitle className="text-center">Add Your Ingredients</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-center text-muted-foreground">
                  Start by adding ingredients you have in your pantry
                </p>
                <Button className="w-full" asChild>
                  <Link href="/pantry">Manage Pantry</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <InputPrompt
              onGenerate={generateRecipes}
              loading={generateRecipesMutation.isPending}
              pantryItems={pantryItemNames}
            />
          )}
        </div>

        {/* Results Section */}
        {recipes.length > 0 && !generateRecipesMutation.isPending && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="mb-2 text-2xl sm:text-3xl font-semibold text-foreground">
                Suggested Recipes
              </h2>
              <p className="text-base text-muted-foreground">
                Found {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} for you
              </p>
            </div>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe, index) => (
                <RecipeCard
                  key={index}
                  recipe={recipe}
                  onSave={() => saveRecipe(recipe)}
                  canSave={!!user}
                  userId={user?.id}
                  recipeId={index + 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {generateRecipesMutation.isPending && (
          <div className="space-y-6">
            <h2 className="text-center text-2xl font-semibold text-foreground">
              Generating Recipes...
            </h2>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <RecipeCardSkeleton />
              <RecipeCardSkeleton />
              <RecipeCardSkeleton />
            </div>
          </div>
        )}
      </main>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl font-bold">How It Works</h2>
              <p className="text-lg text-muted-foreground">
                Three simple steps to dinner success
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto text-2xl font-bold text-primary">
                  1
                </div>
                <h3 className="text-xl font-semibold">Add Ingredients</h3>
                <p className="text-muted-foreground">
                  Tell us what's in your pantry—we'll remember for next time.
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto text-2xl font-bold text-primary">
                  2
                </div>
                <h3 className="text-xl font-semibold">Get Recipes</h3>
                <p className="text-muted-foreground">
                  AI generates personalized recipes in 30 seconds.
                </p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto text-2xl font-bold text-primary">
                  3
                </div>
                <h3 className="text-xl font-semibold">Start Cooking</h3>
                <p className="text-muted-foreground">
                  Save your favorites and cook with confidence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function LandingBPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <LandingB />
    </QueryClientProvider>
  );
}
