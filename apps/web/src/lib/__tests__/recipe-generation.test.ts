import { describe, expect, it } from '@jest/globals'
import {
  applyIngredientSwap,
  shuffleRecipeRemix,
  type DynamicRecipe,
} from '../recipes/recipe-mutator'

const recipe: DynamicRecipe = {
  id: 'test-recipe',
  title: 'Chicken with Butter',
  cookTime: '30 mins',
  calories: 600,
  servings: 2,
  difficulty: 'easy',
  cuisine: 'American',
  pantryIngredientsUsed: ['chicken breast', 'butter'],
  steps: ['Sear chicken in butter until cooked through.'],
  proTips: {},
  substitutions: {},
  macros: { calories: 600, protein: 40, carbs: 20, fat: 30 },
}

describe('recipe generation', () => {
  it('applies an ingredient swap to the recipe content and nutrition', () => {
    const swapped = applyIngredientSwap(recipe, 'chicken')

    expect(swapped).not.toBe(recipe)
    expect(swapped.activeSwaps).toEqual([
      expect.objectContaining({ original: 'chicken' }),
    ])
    expect(swapped.calories).toBe(460)
    expect(swapped.steps.join(' ')).toContain('king oyster mushrooms')
    expect(swapped.pantryIngredientsUsed.join(' ')).toContain('king oyster mushrooms')
  })

  it('creates a deterministic named remix when a variation is selected', () => {
    const remixed = shuffleRecipeRemix(recipe, 'air-fryer-crisp')

    expect(remixed.variationName).toBe('12-Minute Turbo Air-Fryer Crisp')
    expect(remixed.cookTime).toBe('12 mins')
    expect(remixed.steps).toHaveLength(5)
    expect(remixed.calories).toBe(510)
  })
})
