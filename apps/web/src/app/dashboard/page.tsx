'use client';

export const dynamic = 'force-dynamic';
/**
 * Dashboard Page
 * Main user dashboard with daily hooks, suggestions, and quick actions
 */


import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { DailyRetentionHooks } from '@/components/DailyRetentionHooks';
import { TrustSignals } from '@/components/TrustSignals';
import { CTAOptimizer } from '@/components/CTAOptimizer';
import { AIPersonality } from '@/components/AIPersonality';
import { SocialProofWidget } from '@/components/SocialProofWidget';
import SmartUpsell from '@/components/monetization/SmartUpsell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Play, ShoppingCart, UtensilsCrossed, Dices, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface RecipePreview {
  id: string;
  title: string;
  description: string;
  cuisine: string;
  cookTime: string;
  macros?: {
    calories?: number;
    protein?: number;
  };
}

export default function DashboardPage() {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentRecipes, setRecentRecipes] = useState<RecipePreview[]>([]);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user as { id: string });
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .single();
        if (profile?.tenant_id) {
          setTenantId(profile.tenant_id);
        }
      }
      setLoading(false);
    };
    loadUser();

    const loadRecipes = async () => {
      try {
        const res = await fetch('/api/recipes?limit=3');
        if (res.ok) {
          const data = await res.json();
          if (data.recipes && data.recipes.length > 0) {
            setRecentRecipes(data.recipes);
          }
        }
      } catch {
        // Fallback handled
      }
    };
    loadRecipes();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const effectiveUserId = user?.id || 'guest-session';

  return (
    <div className="min-h-screen p-4 pb-24 md:pb-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back! 👋
            </h1>
            <p className="text-muted-foreground">
              Let&apos;s find something delicious for dinner
            </p>
          </div>

          {/* AI Personality Greeting */}
          <AIPersonality context="greeting" />

          {/* Guest Mode Banner if unauthenticated */}
          {!user && (
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>You&apos;re exploring in <strong>Guest Chef Mode</strong>. Data is stored locally on this device.</span>
              </div>
              <Button size="sm" variant="outline" className="text-xs h-8 border-primary/40 font-semibold" asChild>
                <Link href="/onboarding">
                  Sync &amp; Create Account
                </Link>
              </Button>
            </div>
          )}

          {/* Daily Retention Hooks */}
          <DailyRetentionHooks userId={effectiveUserId} />

          {/* Smart Upsell Opportunities */}
          {user && tenantId && (
            <SmartUpsell userId={effectiveUserId} tenantId={tenantId} />
          )}
        </div>

        {/* Featured Decision Games Showcase Banner */}
        <Link href="/play" className="block">
          <Card className="border-2 border-primary/40 bg-gradient-to-r from-primary/15 via-accent/10 to-primary/5 hover:border-primary transition-all shadow-md group cursor-pointer">
            <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-lg flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Dices className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-primary text-white text-xs font-bold px-2 py-0.5">
                      Interactive Decision Engine
                    </Badge>
                    <Badge variant="outline" className="text-xs font-semibold text-emerald-600 border-emerald-500/30">
                      +150 XP Available
                    </Badge>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
                    Can&apos;t Decide What to Cook Tonight?
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Spin the Category Wheel, play 1-on-1 Dinner Duel, mystery ingredient cloche reveal, or start a live room session!
                  </p>
                </div>
              </div>
              <Button className="font-bold shrink-0 group-hover:translate-x-1 transition-transform">
                <span>Play Games</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        {/* Quick Actions Grid - Industry-Defining Suite */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Autonomous Culinary Suite</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Action 1: OmniChef Voice HUD */}
            <Link href="/cook/demo" className="block">
              <Card className="cursor-pointer hover:border-primary transition-colors border-2 h-full">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center">
                    <UtensilsCrossed className="w-6 h-6 text-white" />
                  </div>
                  <div className="font-semibold text-sm">OmniChef™ HUD</div>
                  <div className="text-xs text-muted-foreground mt-1">Voice cooking mode</div>
                </CardContent>
              </Card>
            </Link>

            {/* Action 2: Vision Scanner */}
            <Link href="/pantry" className="block">
              <Card className="cursor-pointer hover:border-primary transition-colors border-2 h-full">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="font-semibold text-sm">Vision Scanner</div>
                  <div className="text-xs text-muted-foreground mt-1">Photo fridge scan</div>
                </CardContent>
              </Card>
            </Link>

            {/* Action 3: OmniCart Arbitrage */}
            <Link href="/grocery" className="block">
              <Card className="cursor-pointer hover:border-primary transition-colors border-2 h-full">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div className="font-semibold text-sm">OmniCart™</div>
                  <div className="text-xs text-muted-foreground mt-1">Price arbitrage</div>
                </CardContent>
              </Card>
            </Link>

            {/* Action 4: Metabolic Index */}
            <Link href="/nutrition" className="block">
              <Card className="cursor-pointer hover:border-primary transition-colors border-2 h-full">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                  <div className="font-semibold text-sm">Metabolic CGM</div>
                  <div className="text-xs text-muted-foreground mt-1">Glycemic &amp; satiety</div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row gap-4">
          <CTAOptimizer 
            variant="primary" 
            context="dashboard" 
            userState={user ? 'returning' : 'new'}
            size="lg"
          />
          <CTAOptimizer 
            variant="secondary" 
            context="dashboard" 
            userState={user ? 'returning' : 'new'}
            size="lg"
          />
        </div>

        {/* Social Proof */}
        <div className="grid md:grid-cols-2 gap-4">
          <TrustSignals variant="compact" />
          <SocialProofWidget />
        </div>

        {/* Recent Activity / Suggestions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-xl">Chef-Curated Daily Dishes</CardTitle>
              <CardDescription>Handpicked recipes ready to cook or customize</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/surprise-me">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" />
                Surprise Me
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentRecipes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Generating personalized recipe ideas for your kitchen...</p>
                <Button asChild className="mt-4">
                  <Link href="/surprise-me">
                    Generate Recipe
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentRecipes.map((rec) => (
                  <Card key={rec.id} className="overflow-hidden border hover:border-primary/50 transition-all flex flex-col justify-between">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-[11px] font-medium">
                          {rec.cuisine}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {rec.cookTime}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm tracking-tight line-clamp-1">{rec.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{rec.description}</p>
                      <div className="pt-2 border-t flex items-center justify-between text-xs">
                        <span className="font-mono text-primary font-bold">
                          {rec.macros?.calories} kcal
                        </span>
                        <span className="text-muted-foreground font-medium">
                          {rec.macros?.protein}g protein
                        </span>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" className="w-full text-xs font-semibold h-8" asChild>
                          <Link href="/cook/demo">
                            <UtensilsCrossed className="w-3 h-3 mr-1" />
                            Cook
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" className="w-full text-xs font-semibold h-8" asChild>
                          <Link href="/recipes">
                            Fork
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}