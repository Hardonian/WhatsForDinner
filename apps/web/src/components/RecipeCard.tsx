'use client';

import { useState } from 'react';
import { Clock, Zap, ChevronDown, ChevronUp, Share2 } from 'lucide-react';
import { Recipe } from '@/lib/validation';
import RecipeFeedback from './RecipeFeedback';
import ShareRecipe from './sharing/ShareRecipe';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { RecipeStructuredData } from './StructuredData';

interface RecipeCardProps {
  recipe: Recipe;
  onSave?: () => void;
  onRemove?: () => void;
  canSave?: boolean;
  isFavorite?: boolean;
  userId?: string;
  recipeId?: number;
}

export default function RecipeCard({
  recipe,
  onSave,
  onRemove,
  canSave = false,
  isFavorite = false,
  userId,
  recipeId,
}: RecipeCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <RecipeStructuredData recipe={recipe} />
      <Card className="group animate-fade-in transition-all duration-300 hover:shadow-xl hover:-translate-y-1 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <CardTitle className="text-lg sm:text-xl font-semibold text-card-foreground transition-colors group-hover:text-primary">
          {recipe.title}
        </CardTitle>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
            <span>{recipe.cookTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
            <span>{recipe.calories} cal</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-4 sm:px-6">
        <div>
          <h4 className="mb-2 sm:mb-3 text-sm sm:text-base font-medium text-card-foreground">
            Ingredients:
          </h4>
          <ul className="flex flex-wrap gap-1.5 sm:gap-2 list-none p-0 m-0">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index}>
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  {ingredient}
                </Badge>
              </li>
            ))}
          </ul>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="h-auto w-full justify-between p-2 sm:p-0 font-normal min-h-[44px] text-sm sm:text-base"
          aria-expanded={showDetails}
          aria-controls="recipe-instructions"
        >
          <span>{showDetails ? 'Hide' : 'Show'} Instructions</span>
          {showDetails ? (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>

        {showDetails && (
          <div id="recipe-instructions" className="space-y-3" role="region" aria-label="Recipe instructions">
            <Separator />
            <div>
              <h4 className="mb-2 sm:mb-3 text-sm sm:text-base font-medium text-card-foreground">
                Instructions:
              </h4>
              <ol className="space-y-2 sm:space-y-3">
                {recipe.steps.map((step, index) => (
                  <li key={index} className="flex gap-2 sm:gap-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-sm sm:text-base leading-relaxed text-muted-foreground flex-1">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {canSave && !isFavorite && (
            <Button 
              onClick={onSave} 
              className="flex-1 min-h-[44px] text-sm sm:text-base" 
              size="sm"
              aria-label={`Save recipe: ${recipe.title}`}
            >
              Save Recipe
            </Button>
          )}
          {isFavorite && onRemove && (
            <Button
              onClick={onRemove}
              variant="destructive"
              className="flex-1 min-h-[44px] text-sm sm:text-base"
              size="sm"
              aria-label={`Remove recipe: ${recipe.title}`}
            >
              Remove
            </Button>
          )}
        </div>

        {/* Social Sharing */}
        {recipeId && (
          <div className="pt-2">
            <ShareRecipe recipeId={recipeId} recipeTitle={recipe.title} />
          </div>
        )}

        {/* Recipe Feedback Component */}
        {userId && recipeId && (
          <div className="pt-4">
            <Separator className="mb-4" />
            <RecipeFeedback
              recipeId={recipeId}
              userId={userId}
              onFeedbackSubmitted={feedback => {
                              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}
