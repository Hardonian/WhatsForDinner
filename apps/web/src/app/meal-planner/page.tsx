'use client';

export const dynamic = 'force-dynamic';


import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { analytics } from '@/lib/analytics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatedCard } from '@/components/ui/animated-card';
import { LoadingSpinner, LoadingOverlay } from '@/components/ui/loading-spinner';
import Navbar from '@/components/Navbar';
import { Recipe } from '@whats-for-dinner/utils';
import {
  Calendar,
  ChefHat,
  ShoppingCart,
  Plus,
  RefreshCw,
  Check,
  Clock,
  Users,
} from 'lucide-react';

interface MealPlanDay {
  date: string;
  breakfast?: Recipe;
  lunch?: Recipe;
  dinner: Recipe;
  snack?: Recipe;
}

interface WeeklyMealPlan {
  weekStartDate: string;
  days: MealPlanDay[];
  shoppingList: Array<{
    ingredient: string;
    quantity: number;
    unit: string;
    category: string;
  }>;
  totalCost?: number;
}

interface User {
  id: string;
  email?: string;
  [key: string]: unknown;
}

export default function MealPlannerPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState<WeeklyMealPlan | null>(null);
  const [preferences, setPreferences] = useState({
    dietaryRestrictions: [] as string[],
    cuisinePreferences: [] as string[],
    familySize: 2,
    maxPrepTime: 60,
  });

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    fetchUser();
  }, []);

  const generateMealPlan = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/meal-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate meal plan');
      }

      const { mealPlan } = await response.json();
      setMealPlan(mealPlan);
    } catch (error) {
      // Error handled: Error generating meal plan:
      alert('Failed to generate meal plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-6 sm:py-12 max-w-7xl space-y-6 sm:space-y-8">
        {/* Header */}
        <AnimatedCard delay={0}>
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-4 flex-wrap justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-5xl font-bold text-foreground">
                    Meal <span className="gradient-text">Planner</span>
                  </h1>
                  <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                    Generate your weekly meal plan based on your pantry and preferences
                  </p>
                </div>
              </div>
              <Button
                onClick={generateMealPlan}
                disabled={loading}
                size="lg"
                className="btn-glow"
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Generate Plan
                  </>
                )}
              </Button>
            </div>
          </div>
        </AnimatedCard>

        {/* Preferences */}
        <AnimatedCard delay={100}>
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your meal plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-2 block">Family Size</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={preferences.familySize}
                    onChange={(e) =>
                      setPreferences({ ...preferences, familySize: parseInt(e.target.value) || 1 })
                    }
                    className="input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Max Prep Time (minutes)</label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    value={preferences.maxPrepTime}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        maxPrepTime: parseInt(e.target.value) || 60,
                      })
                    }
                    className="input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Meal Plan */}
        {mealPlan && !loading && (
          <>
            {/* Week Overview */}
            <AnimatedCard delay={200}>
              <Card className="border-2 bg-gradient-to-br from-primary/5 to-background">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Week of {formatDate(mealPlan.weekStartDate)}</CardTitle>
                      <CardDescription>
                        Your personalized 7-day meal plan
                      </CardDescription>
                    </div>
                    {mealPlan.totalCost && (
                      <Badge variant="outline" className="text-lg px-4 py-2">
                        ${mealPlan.totalCost.toFixed(2)} total
                      </Badge>
                    )}
                  </div>
                </CardHeader>
              </Card>
            </AnimatedCard>

            {/* Daily Meals */}
            <div className="grid gap-4 sm:gap-6">
              {mealPlan.days.map((day, index) => (
                <AnimatedCard key={day.date} delay={300 + index * 50}>
                  <Card className="card-interactive border-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        {formatDate(day.date)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {day.breakfast && (
                          <div 
                            className="p-4 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                            onClick={async () => {
                              await analytics.trackEvent('RECIPE_VIEWED', {
                                recipe_id: day.breakfast.id || 'unknown',
                                recipe_source: 'curated',
                                view_duration_seconds: 0,
                                user_id: user?.id,
                              });
                            }}
                          >
                            <Badge variant="secondary" className="mb-2">Breakfast</Badge>
                            <h3 className="font-semibold mb-1">{day.breakfast.title}</h3>
                            {day.breakfast.cookTime && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {day.breakfast.cookTime} min
                              </div>
                            )}
                          </div>
                        )}
                        {day.lunch && (
                          <div className="p-4 rounded-lg bg-muted/50">
                            <Badge variant="secondary" className="mb-2">Lunch</Badge>
                            <h3 className="font-semibold mb-1">{day.lunch.title}</h3>
                            {day.lunch.cookTime && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {day.lunch.cookTime} min
                              </div>
                            )}
                          </div>
                        )}
                        <div 
                          className="p-4 rounded-lg bg-primary/5 border-2 border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors"
                          onClick={async () => {
                            await analytics.trackEvent('RECIPE_VIEWED', {
                              recipe_id: day.dinner.id || 'unknown',
                              recipe_source: 'curated',
                              view_duration_seconds: 0,
                              user_id: user?.id,
                            });
                          }}
                        >
                          <Badge className="mb-2">Dinner</Badge>
                          <h3 className="font-semibold mb-1">{day.dinner.title}</h3>
                          {day.dinner.cookTime && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {day.dinner.cookTime} min
                            </div>
                          )}
                        </div>
                        {day.snack && (
                          <div className="p-4 rounded-lg bg-muted/50">
                            <Badge variant="secondary" className="mb-2">Snack</Badge>
                            <h3 className="font-semibold mb-1">{day.snack.title}</h3>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedCard>
              ))}
            </div>

            {/* Shopping List */}
            {mealPlan.shoppingList && mealPlan.shoppingList.length > 0 && (
              <AnimatedCard delay={700}>
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Shopping List
                    </CardTitle>
                    <CardDescription>
                      Everything you need for the week
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {mealPlan.shoppingList.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                        >
                          <div className="h-5 w-5 rounded border-2 border-primary/30 flex items-center justify-center flex-shrink-0">
                            <Check className="h-3 w-3 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{item.ingredient}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.quantity} {item.unit}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </AnimatedCard>
            )}
          </>
        )}

        {!mealPlan && !loading && (
          <AnimatedCard delay={200}>
            <Card className="border-2 border-dashed">
              <CardContent className="pt-12 pb-12 text-center">
                <ChefHat className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No meal plan yet</h3>
                <p className="text-muted-foreground mb-6">
                  Generate your first weekly meal plan to get started
                </p>
                <Button onClick={generateMealPlan} size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Meal Plan
                </Button>
              </CardContent>
            </Card>
          </AnimatedCard>
        )}
      </div>
    </div>
  );
}