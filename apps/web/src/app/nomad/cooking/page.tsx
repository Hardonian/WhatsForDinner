'use client';

export const dynamic = 'force-dynamic';


import { useState } from 'react';
import { ChefHat, Clock, Users, TrendingUp, Share2, Heart, Play } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRecipes, useAIRecipeRecommendations } from '@/hooks/nomad/useNomadData';

export default function CookingInspirationPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('discover');
  const { data: recipes, isLoading } = useRecipes({ limit: 20 });
  const aiRecommendations = useAIRecipeRecommendations();

  const handleAISearch = () => {
    aiRecommendations.mutate({
      pantryItems: ['tomatoes', 'chicken', 'rice'],
      preferences: ['mediterranean'],
      healthGoals: ['weight-loss'],
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChefHat className="w-6 h-6 text-brand-600" />
              <h1 className="text-2xl font-bold">Cooking Inspiration</h1>
            </div>
            <Button variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search recipes, ingredients, cuisines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAISearch}>
              <TrendingUp className="w-4 h-4 mr-2" />
              AI Match
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
          </TabsList>

          {/* Discover Tab */}
          <TabsContent value="discover" className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">Loading recipes...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(recipes?.recipes || []).map((recipe: any) => (
                  <Card key={recipe.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Recipe Image */}
                    <div className="aspect-video bg-gradient-to-br from-brand-400 to-accent-500 relative">
                      <div className="absolute inset-0 bg-black/20" />
                      <div className="absolute top-4 right-4">
                        <Button variant="ghost" size="icon" className="bg-white/90 hover:bg-white">
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Recipe Info */}
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2">{recipe.title || 'Recipe Name'}</h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {recipe.description || 'A delicious recipe waiting to be tried'}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{recipe.cookTime || 30} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{recipe.servings || 4} servings</span>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {recipe.tags?.slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        )) || (
                          <>
                            <Badge variant="secondary" className="text-xs">Quick</Badge>
                            <Badge variant="secondary" className="text-xs">Healthy</Badge>
                          </>
                        )}
                      </div>

                      <Button className="w-full">View Recipe</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gradient-to-br from-red-400 to-orange-500 relative">
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Button size="lg" variant="secondary" className="rounded-full w-16 h-16">
                        <Play className="w-6 h-6 ml-1" />
                      </Button>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <Badge variant="secondary" className="mb-2">Video Tutorial</Badge>
                      <h3 className="text-white font-bold">Cooking Tutorial {i}</h3>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Trending Tab */}
          <TabsContent value="trending" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(recipes?.recipes || []).map((recipe: any, index: number) => (
                <Card key={recipe.id || index} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gradient-to-br from-brand-400 to-accent-500 relative">
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-red-500 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        #{index + 1}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2">{recipe.title || `Trending Recipe ${index + 1}`}</h3>
                    <Button className="w-full">View Recipe</Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Saved Tab */}
          <TabsContent value="saved" className="space-y-6">
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No saved recipes yet</h3>
              <p className="text-muted-foreground mb-4">
                Start exploring and save your favorite recipes
              </p>
              <Button onClick={() => setActiveTab('discover')}>
                Discover Recipes
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}