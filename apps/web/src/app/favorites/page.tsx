'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  ChefHat,
  Clock,
  Flame,
  Search,
  Sparkles,
  Trash2,
  ExternalLink,
  BookOpen,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFavorites, useRemoveFavorite } from '@/hooks/useFavorites';
import { toast } from 'sonner';
import Link from 'next/link';

interface FallbackRecipe {
  id: number;
  title: string;
  details?: string;
  calories?: number;
  time?: string;
  tags?: string[];
  imageUrl?: string;
}

const SAMPLE_FAVORITES: FallbackRecipe[] = [
  {
    id: 101,
    title: 'Tuscan Garlic Butter Pan-Seared Salmon',
    details: 'Crisp Atlantic salmon fillet drenched in sun-dried tomato garlic butter with baby spinach.',
    calories: 520,
    time: '25 mins',
    tags: ['Keto', 'High Protein', 'Gluten Free'],
  },
  {
    id: 102,
    title: 'Creamy Lemon Ricotta Penne al Limone',
    details: 'Velvety ricotta sauce infused with fresh Amalfi lemon zest, cracked pepper, and fresh basil.',
    calories: 440,
    time: '20 mins',
    tags: ['Vegetarian', 'Quick & Easy'],
  },
  {
    id: 103,
    title: 'Moroccan Spiced Chickpea & Sweet Potato Bowl',
    details: 'Roasted chickpeas with cumin, turmeric, caramelized sweet potatoes, and creamy tahini drizzle.',
    calories: 390,
    time: '35 mins',
    tags: ['Vegan', 'High Fiber', 'Dairy Free'],
  },
];

export default function FavoritesPage() {
  const { data: remoteFavorites, isLoading } = useFavorites();
  const removeMutation = useRemoveFavorite();
  const [localFallback, setLocalFallback] = useState<FallbackRecipe[]>(SAMPLE_FAVORITES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('All');

  const hasRemoteData = remoteFavorites && remoteFavorites.length > 0;
  
  const displayItems: FallbackRecipe[] = hasRemoteData
    ? remoteFavorites.map((fav: any) => ({
        id: fav.id,
        title: fav.recipe?.title || 'Saved Recipe',
        details: fav.recipe?.details || 'Delicious chef recipe saved to your favorites.',
        calories: fav.recipe?.calories || 450,
        time: fav.recipe?.time ? `${fav.recipe.time} mins` : '30 mins',
        tags: ['Favorite'],
      }))
    : localFallback;

  const allTags = ['All', 'Quick & Easy', 'High Protein', 'Vegetarian', 'Keto', 'Vegan'];

  const filteredItems = displayItems.filter(item => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.details && item.details.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag =
      selectedTag === 'All' ||
      (item.tags && item.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase()));
    return matchesSearch && matchesTag;
  });

  const handleRemove = async (id: number, title: string) => {
    if (hasRemoteData) {
      try {
        await removeMutation.mutateAsync({ favoriteId: id });
        toast.success(`Removed "${title}" from favorites`);
      } catch (err) {
        toast.error('Failed to remove favorite from server');
      }
    } else {
      setLocalFallback(prev => prev.filter(item => item.id !== id));
      toast.success(`Removed "${title}" from favorites`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header Banner */}
      <div className="border-b bg-gradient-to-r from-rose-500/10 via-primary/5 to-amber-500/10 backdrop-blur">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold mb-2">
                <Heart className="h-3.5 w-3.5 fill-current" />
                <span>Curated Culinary Collection</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                Your Favorite Recipes
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Your personal cookbook of go-to dinners, family favorites, and culinary bookmarks.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/recipes">
                <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                  <ChefHat className="h-4 w-4" />
                  <span>Discover More</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Search & Tag Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mt-6">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search favorites..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border bg-background/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedTag === tag
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed bg-card/40 max-w-md mx-auto">
            <div className="h-16 w-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-foreground">No favorites found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {searchQuery
                ? `No recipe matches "${searchQuery}". Try a different search term.`
                : "You haven't added any favorite recipes yet. Explore recommendations and bookmark your culinary top picks!"}
            </p>
            <div className="mt-6 flex gap-3">
              {searchQuery && (
                <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              )}
              <Link href="/recipes">
                <Button size="sm" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Explore Recipes</span>
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredItems.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="h-full flex flex-col justify-between overflow-hidden border bg-card/80 hover:shadow-md transition-shadow group">
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {item.title}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(item.id, item.title)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                          title="Remove from favorites"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {item.details && (
                        <CardDescription className="text-xs line-clamp-2 mt-1">
                          {item.details}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="p-5 pt-0 mt-auto">
                      {/* Metrics */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground py-3 border-t">
                        {item.time && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{item.time}</span>
                          </div>
                        )}
                        {item.calories && (
                          <div className="flex items-center gap-1">
                            <Flame className="h-3.5 w-3.5 text-amber-500" />
                            <span>{item.calories} kcal</span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {item.tags.map(t => (
                            <Badge key={t} variant="secondary" className="text-[10px] px-2 py-0.5">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Action Links */}
                      <div className="flex items-center gap-2 pt-2">
                        <Link href="/cook/demo" className="flex-1">
                          <Button size="sm" className="w-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs">
                            <ChefHat className="h-3.5 w-3.5" />
                            <span>Cook Now</span>
                          </Button>
                        </Link>
                        <Link href="/recipes">
                          <Button variant="outline" size="sm" className="gap-1 text-xs">
                            <BookOpen className="h-3.5 w-3.5" />
                            <span>Details</span>
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
