'use client';

import { useState } from 'react';
import { Plus, X, ChefHat } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

interface InputPromptProps {
  onGenerate: (ingredients: string[], preferences: string) => void;
  loading: boolean;
  pantryItems: string[];
}

export default function InputPrompt({
  onGenerate,
  loading,
  pantryItems,
}: InputPromptProps) {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [preferences, setPreferences] = useState('');
  const [newIngredient, setNewIngredient] = useState('');

  const addIngredient = () => {
    if (newIngredient.trim() && !ingredients.includes(newIngredient.trim())) {
      setIngredients([...ingredients, newIngredient.trim()]);
      setNewIngredient('');
    }
  };

  const removeIngredient = (ingredient: string) => {
    setIngredients(ingredients.filter(i => i !== ingredient));
  };

  const addFromPantry = (ingredient: string) => {
    if (!ingredients.includes(ingredient)) {
      setIngredients([...ingredients, ingredient]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ingredients.length > 0) {
      onGenerate(ingredients, preferences);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIngredient();
    }
  };

  const availablePantryItems = pantryItems.filter(item => !ingredients.includes(item));

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader className="text-center px-4 sm:px-6">
        <CardTitle className="flex items-center justify-center gap-2 text-xl sm:text-2xl">
          <ChefHat className="h-5 w-5 sm:h-6 sm:w-6 text-primary" aria-hidden="true" />
          <span>What ingredients do you have?</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="ingredient-input" className="text-sm sm:text-base font-medium">
              Add ingredients
            </Label>
            <div className="flex gap-2">
              <Input
                id="ingredient-input"
                type="text"
                value={newIngredient}
                onChange={e => setNewIngredient(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add an ingredient..."
                className="flex-1 text-base sm:text-sm"
                disabled={loading}
                aria-label="Enter ingredient name"
                autoComplete="off"
                autoCapitalize="words"
              />
              <Button
                type="button"
                onClick={addIngredient}
                disabled={!newIngredient.trim() || loading}
                size="icon"
                variant="outline"
                aria-label="Add ingredient"
                className="min-h-[44px] min-w-[44px]"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

          {availablePantryItems.length > 0 && (
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm sm:text-base font-medium">
                Or add from your pantry:
              </Label>
              <div className="flex flex-wrap gap-2">
                {availablePantryItems.map(item => (
                  <Button
                    key={item}
                    type="button"
                    onClick={() => addFromPantry(item)}
                    variant="outline"
                    size="sm"
                    className="h-9 sm:h-8 min-h-[36px] text-xs sm:text-sm px-2 sm:px-3"
                    disabled={loading}
                    aria-label={`+ ${item}`}
                  >
                    <Plus className="mr-1 h-3 w-3" aria-hidden="true" />
                    {item}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {ingredients.length > 0 && (
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm sm:text-base font-medium">
                Selected ingredients ({ingredients.length}):
              </Label>
              <div className="flex flex-wrap gap-2">
                {ingredients.map(ingredient => (
                  <Badge
                    key={ingredient}
                    variant="secondary"
                    className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-1 text-xs sm:text-sm"
                  >
                    <span>{ingredient}</span>
                    <Button
                      type="button"
                      onClick={() => removeIngredient(ingredient)}
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 sm:h-4 sm:w-4 p-0 hover:bg-destructive hover:text-destructive-foreground active:bg-destructive active:text-destructive-foreground min-h-[28px] min-w-[28px]"
                      disabled={loading}
                      aria-label={`Remove ${ingredient} ×`}
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="preferences" className="text-sm sm:text-base font-medium">
              Any dietary preferences or restrictions?
            </Label>
            <Input
              id="preferences"
              type="text"
              value={preferences}
              onChange={e => setPreferences(e.target.value)}
              placeholder="e.g., vegetarian, gluten-free, low-carb..."
              disabled={loading}
              className="text-base sm:text-sm"
              aria-label="Dietary preferences or restrictions"
              autoComplete="off"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || ingredients.length === 0}
            className="h-12 sm:h-11 w-full text-base sm:text-sm min-h-[48px] font-medium"
            size="lg"
            aria-label={loading ? "Generating recipes" : "What should I cook?"}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                <span>Generating recipes...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" aria-hidden="true" />
                <span>What should I cook?</span>
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
