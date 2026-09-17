'use client';

export const dynamic = 'force-dynamic';


import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { ForkableRecipeTree } from '@/components/recipes/ForkableRecipeTree';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { GitFork, Sparkles, Utensils, Search, Coins, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function RecipesExplorerPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navbar />

      <main className="container mx-auto px-4 py-8 sm:py-12 max-w-6xl space-y-8">
        {/* Header Hero */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-purple-600/10 text-purple-600 dark:text-purple-400 border-purple-500/20 font-bold px-3 py-0.5">
                <GitFork className="w-3.5 h-3.5 mr-1.5" />
                Culinary Git™ Network
              </Badge>
              <Badge className="bg-emerald-600/10 text-emerald-600 font-bold px-3 py-0.5">
                <Coins className="w-3.5 h-3.5 mr-1.5" />
                30% Creator Royalties
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
              Forkable Recipe <span className="text-primary">Ecosystem</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-2xl">
              Recipes are living, evolving code. Fork any chef dish, tweak ingredients, track git-style branch diffs, and cook hands-free with voice assistance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button size="lg" className="font-bold shadow-lg" asChild>
              <Link href="/cook/demo">
                <Utensils className="w-4 h-4 mr-2" />
                <span>Launch OmniChef HUD</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xl">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search forkable community recipes (e.g. Crispy Salmon, Garlic Noodles)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-11 h-12 rounded-2xl text-sm"
          />
        </div>

        {/* Featured Forkable Recipe Tree */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span>Trending Branch: Pan-Seared Garlic Herb Salmon</span>
            </h2>
            <span className="text-xs text-muted-foreground font-mono">3 community forks</span>
          </div>

          <ForkableRecipeTree
            baseRecipeTitle="Pan-Seared Garlic Herb Salmon"
            baseRecipeId="recipe-salmon-01"
          />
        </div>
      </main>
    </div>
  );
}
