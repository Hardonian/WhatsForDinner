'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Search,
  BookOpen,
  Cpu,
  Flame,
  Clock,
  Utensils,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { VectorSearchResult } from '@/lib/ai/recipe-vector-db';
import { OpenRecipe } from '@/lib/ai/open-recipe-database';

const PRESET_VECTOR_QUERIES = [
  'Tangy 20-min salmon with citrus',
  'Rich umami braised chicken',
  'Spicy wok tofu with scallions',
  'Mediterranean white beans & greens',
];

export function VectorRecipeExplorer() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<VectorSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleVectorSearch = async (searchPrompt = query) => {
    const text = searchPrompt.trim();
    if (!text) {
      toast.error('Please enter a culinary query or flavor craving');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/ai/recipe-vectors?query=${encodeURIComponent(text)}&topK=4`, {
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        setResults(data.results);
        toast.success(`Retrieved ${data.results.length} grounded recipe anchors!`, {
          description: `Computed via 64-dimensional vector cosine similarity.`,
        });
      }
    } catch {
      toast.error('Vector similarity query failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCookInHUD = (recipe: OpenRecipe) => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(
          'active_cooking_recipe',
          JSON.stringify({
            id: recipe.id,
            title: recipe.title,
            cookTime: recipe.cookTime,
            calories: recipe.calories,
            servings: 2,
            difficulty: recipe.difficulty,
            imageUrl: recipe.imageUrl,
            pantryIngredientsUsed: recipe.pantryIngredients,
            steps: recipe.steps,
            flavorProfile: recipe.flavorProfile,
          })
        );
      } catch {}
    }
    router.push(`/cook/${recipe.id}`);
  };

  return (
    <Card className="border shadow-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 font-bold px-2.5 py-0.5">
                <Cpu className="w-3.5 h-3.5 mr-1" />
                Culinary Neural Vector DB
              </Badge>
              <Badge variant="outline" className="text-xs">
                64-Dim Cosine Space • RAG Grounding
              </Badge>
            </div>
            <CardTitle className="text-2xl font-black tracking-tight text-foreground">
              Open-Source Recipe Vector Intelligence
            </CardTitle>
            <CardDescription className="text-sm mt-1 max-w-2xl">
              Indexed from Escoffier classical foundations, TheMealDB open corpus, and global gastronomy archives. Query by flavor craving, ingredients, or cooking technique.
            </CardDescription>
          </div>
        </div>

        {/* Query Input */}
        <div className="flex gap-2 pt-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Query semantic culinary vectors (e.g. 'high protein citrus seafood in 20m')..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleVectorSearch()}
              className="pl-10 h-11 text-sm rounded-xl font-medium"
            />
          </div>
          <Button
            onClick={() => handleVectorSearch()}
            disabled={isSearching}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 h-11 rounded-xl shadow-lg shadow-blue-600/20"
          >
            {isSearching ? 'Computing...' : 'Vector Search'}
          </Button>
        </div>

        {/* Quick Query Pills */}
        <div className="flex flex-wrap gap-2 pt-2">
          {PRESET_VECTOR_QUERIES.map(prompt => (
            <Button
              key={prompt}
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery(prompt);
                handleVectorSearch(prompt);
              }}
              className="text-xs h-7 rounded-lg border-muted hover:border-blue-400"
            >
              <Sparkles className="w-3 h-3 mr-1 text-blue-500" />
              <span>{prompt}</span>
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {!hasSearched ? (
          <div className="text-center py-8 border border-dashed rounded-2xl bg-muted/20 text-muted-foreground space-y-2">
            <BookOpen className="w-10 h-10 mx-auto text-blue-500/60" />
            <p className="font-semibold text-sm text-foreground">
              Ready to query open-source culinary vectors
            </p>
            <p className="text-xs max-w-md mx-auto">
              Select any prompt above or type ingredients to find nearest-neighbor recipe anchors with verified flavor chemistry.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map(({ recipe, similarityScore, culinaryAffinityNotes }, idx) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="p-4 sm:p-5 rounded-2xl border bg-card/60 backdrop-blur hover:border-blue-500/40 shadow-sm hover:shadow-lg transition-all space-y-3.5 flex flex-col justify-between group overflow-hidden"
              >
                <div>
                  {/* Recipe Image Thumbnail */}
                  <div className="relative w-full h-44 rounded-xl overflow-hidden mb-3 bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={recipe.imageUrl || '/recipe-placeholder.jpg'}
                      alt={recipe.title}
                      loading="lazy"
                      onError={e => {
                        (e.target as HTMLImageElement).src = '/recipe-placeholder.jpg';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1.5">
                      <Badge variant="secondary" className="text-[10px] font-mono bg-black/60 text-white border-0 backdrop-blur-md">
                        {recipe.source}
                      </Badge>
                      <Badge className="bg-blue-600 text-white font-mono text-xs font-bold px-2 py-0.5 shadow-md">
                        {(similarityScore * 100).toFixed(0)}% Vector Match
                      </Badge>
                    </div>
                  </div>

                  <h3 className="text-base font-black text-foreground mt-1 leading-snug">
                    {recipe.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {culinaryAffinityNotes}
                  </p>
                </div>

                {/* Flavor Profile Bars */}
                <div className="space-y-1.5 pt-2 border-t text-xs">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Flavor Profile Chemistry:
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="p-1.5 rounded-lg bg-background border flex justify-between">
                      <span className="text-muted-foreground">Umami</span>
                      <span className="font-bold text-foreground">{Math.round(recipe.flavorProfile.umami * 100)}%</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-background border flex justify-between">
                      <span className="text-muted-foreground">Acidity</span>
                      <span className="font-bold text-foreground">{Math.round(recipe.flavorProfile.acid * 100)}%</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-background border flex justify-between">
                      <span className="text-muted-foreground">Richness</span>
                      <span className="font-bold text-foreground">{Math.round(recipe.flavorProfile.richness * 100)}%</span>
                    </div>
                  </div>
                </div>

                {/* Specs & Cooking Technique */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-primary" />
                    <span>{recipe.cookTime}</span>
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-500" />
                    <span>{recipe.calories} kcal</span>
                  </Badge>
                  <Badge variant="outline">
                    <span>{recipe.culinaryTechnique}</span>
                  </Badge>
                  <Badge variant="secondary">
                    <span>{recipe.cuisine}</span>
                  </Badge>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleCookInHUD(recipe)}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-9 rounded-xl"
                  >
                    <Utensils className="w-3.5 h-3.5 mr-1.5" />
                    <span>Cook in HUD</span>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
