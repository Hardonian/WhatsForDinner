/**
 * Enhanced Recipe Card
 * Beautiful recipe cards with images, ratings, animations
 */

'use client';

import { useState } from 'react';
import { Clock, Users, ChefHat, Star, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShareRecipeButton } from './ShareRecipeButton';
import { RecipeCustomizer } from './RecipeCustomizer';
import { triggerConfetti } from '@/lib/animations/confetti';
import { getRecipeFallbackImage } from '@/lib/ai/image-generation';
import Image from 'next/image';

interface RecipeCardEnhancedProps {
  recipe: {
    id: string;
    title: string;
    description?: string;
    prepTime?: number;
    cookTime?: number;
    servings?: number;
    difficulty?: string;
    rating?: number;
    imageUrl?: string;
    ingredients: string[];
  };
  onSave?: () => void;
  canSave?: boolean;
  showCustomize?: boolean;
}

export function RecipeCardEnhanced({
  recipe,
  onSave,
  canSave = false,
  showCustomize = false,
}: RecipeCardEnhancedProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleSave = () => {
    onSave?.();
    setIsSaved(true);
    triggerConfetti({ particleCount: 50 });
  };

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const fallbackUrl = getRecipeFallbackImage(recipe.title);
  const displayImage = !imageError ? (recipe.imageUrl || fallbackUrl) : fallbackUrl;

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
      {displayImage && (
        <div className="relative w-full h-48 overflow-hidden">
          <Image
            src={displayImage}
            alt={recipe.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
          {recipe.rating && (
            <div className="absolute top-2 right-2 bg-black/70 rounded-full px-2 py-1 flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-white">{recipe.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      )}
      <CardContent className="p-4">
        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
          {recipe.title}
        </h3>
        {recipe.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {recipe.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {totalTime > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Clock className="w-3 h-3" />
              {totalTime}m
            </Badge>
          )}
          {recipe.servings && (
            <Badge variant="secondary" className="gap-1">
              <Users className="w-3 h-3" />
              {recipe.servings}
            </Badge>
          )}
          {recipe.difficulty && (
            <Badge variant="secondary" className="gap-1">
              <ChefHat className="w-3 h-3" />
              {recipe.difficulty}
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          {canSave && (
            <Button
              onClick={handleSave}
              variant={isSaved ? 'outline' : 'default'}
              className="flex-1"
              size="sm"
            >
              <Heart className={`w-4 h-4 mr-2 ${isSaved ? 'fill-red-500' : ''}`} />
              {isSaved ? 'Saved' : 'Save'}
            </Button>
          )}
          <ShareRecipeButton
            recipe={{ id: recipe.id, title: recipe.title }}
          />
          {showCustomize && (
            <RecipeCustomizer
              recipeId={recipe.id}
              currentRecipe={{
                title: recipe.title,
                ingredients: recipe.ingredients,
              }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
