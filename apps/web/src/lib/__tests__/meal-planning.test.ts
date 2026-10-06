import { describe, expect, it, jest } from '@jest/globals'
import type { Recipe } from '@whats-for-dinner/utils'

jest.mock('../services/nutrition-service', () => ({
  getRecipeNutrition: jest.fn().mockResolvedValue({
    calories: 480,
    protein: 30,
    carbs: 45,
    fat: 18,
  }),
}))

import { generateWeeklyMealPlan } from '../services/meal-plan-generator'

const recipe: Recipe = {
  title: 'Pantry Chicken Rice Bowl',
  ingredients: ['2 lb chicken', '1 cup rice'],
  instructions: ['Cook the chicken and rice.'],
  prepTime: 10,
  cookTime: 20,
  servings: 2,
  difficulty: 'easy',
  tags: [],
}

describe('meal planning', () => {
  it('creates a seven-day plan and aggregates ingredients not already in the pantry', async () => {
    const generateRecipe = jest.fn().mockResolvedValue({ recipes: [recipe] })

    const plan = await generateWeeklyMealPlan(
      ['rice'],
      { dietaryRestrictions: ['gluten-free'], cuisinePreferences: ['mediterranean'] },
      generateRecipe,
    )

    expect(plan.days).toHaveLength(7)
    expect(plan.days.every((day) => day.dinner?.title === recipe.title)).toBe(true)
    expect(plan.shoppingList).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ingredient: 'chicken', category: 'meat' }),
      ]),
    )
    expect(plan.shoppingList.some((item) => item.ingredient === 'rice')).toBe(false)
    expect(plan.nutritionSummary).toEqual({
      avgDailyCalories: expect.any(Number),
      avgDailyProtein: expect.any(Number),
      avgDailyCarbs: expect.any(Number),
      avgDailyFat: expect.any(Number),
    })
  })

  it('passes dietary and cuisine preferences to every recipe generation call', async () => {
    const generateRecipe = jest.fn().mockResolvedValue({ recipes: [recipe] })

    await generateWeeklyMealPlan(
      ['rice', 'beans', 'tomato'],
      {
        dietaryRestrictions: ['vegetarian'],
        cuisinePreferences: ['mexican'],
        maxPrepTime: 30,
        familySize: 4,
      },
      generateRecipe,
    )

    expect(generateRecipe).toHaveBeenCalledTimes(12)
    expect(generateRecipe).toHaveBeenCalledWith(
      expect.any(Array),
      expect.stringContaining('Dietary: vegetarian'),
    )
    expect(generateRecipe.mock.calls.every(([, preferences]) =>
      preferences.includes('Cuisines: mexican') &&
      preferences.includes('Max prep time: 30 minutes') &&
      preferences.includes('Serves 4'),
    )).toBe(true)
  })
})
