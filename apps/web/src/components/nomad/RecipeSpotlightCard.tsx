'use client';

import { ChefHat, Clock, Users, TrendingUp, Share2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  cookTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  trending?: boolean;
}

export function RecipeSpotlightCard() {
  // This would typically come from an API or context
  const spotlightRecipe: Recipe = {
    id: '1',
    title: 'Mediterranean Quinoa Bowl',
    description: 'A fresh, colorful bowl packed with protein and vegetables',
    image: '/api/placeholder/400/300',
    cookTime: 25,
    servings: 4,
    difficulty: 'Easy',
    tags: ['healthy', 'quick', 'vegetarian'],
    trending: true,
  };

  const getDifficultyColor = (difficulty: Recipe['difficulty']) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  };

  return (
    <Card className="p-0 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Recipe Image */}
      <div className="relative h-48 bg-gradient-to-br from-brand-400 to-accent-500">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-4 right-4 flex gap-2">
          {spotlightRecipe.trending && (
            <Badge className="bg-red-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Trending
            </Badge>
          )}
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 mb-2">
            <ChefHat className="w-5 h-5 text-white" />
            <span className="text-white font-semibold">Recipe Spotlight</span>
          </div>
        </div>
      </div>

      {/* Recipe Details */}
      <div className="p-4">
        <h3 className="font-bold text-xl mb-2">{spotlightRecipe.title}</h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {spotlightRecipe.description}
        </p>

        {/* Meta Info */}
        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{spotlightRecipe.cookTime} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{spotlightRecipe.servings} servings</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge className={getDifficultyColor(spotlightRecipe.difficulty)}>
            {spotlightRecipe.difficulty}
          </Badge>
          {spotlightRecipe.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button className="flex-1">View Recipe</Button>
          <Button variant="outline" size="icon">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default RecipeSpotlightCard;
