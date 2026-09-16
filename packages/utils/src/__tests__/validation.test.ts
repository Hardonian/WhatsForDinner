// @ts-nocheck
import { describe, it, expect } from 'vitest';
import {
  RecipeSchema,
  PantryItemSchema,
  UserPreferencesSchema,
  type Recipe,
  type PantryItem,
  type UserPreferences,
} from '../validation';

describe('RecipeSchema', () => {
  it('should validate a valid recipe', () => {
    const validRecipe = {
      title: 'Pasta Carbonara',
      description: 'Classic Italian pasta',
      ingredients: ['pasta', 'eggs', 'bacon'],
      instructions: ['Cook pasta', 'Fry bacon'],
      prepTime: 15,
      cookTime: 20,
      servings: 4,
      difficulty: 'medium' as const,
      tags: ['italian', 'pasta'],
      nutrition: {
        calories: 500,
        protein: 20,
        carbs: 60,
        fat: 15,
      },
    };

    const result = RecipeSchema.safeParse(validRecipe);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Pasta Carbonara');
    }
  });

  it('should reject recipe without title', () => {
    const invalidRecipe = {
      ingredients: ['pasta'],
      instructions: ['Cook pasta'],
      prepTime: 15,
      cookTime: 20,
      servings: 4,
    };

    const result = RecipeSchema.safeParse(invalidRecipe);
    expect(result.success).toBe(false);
  });

  it('should reject recipe without ingredients', () => {
    const invalidRecipe = {
      title: 'Test Recipe',
      ingredients: [],
      instructions: ['Cook'],
      prepTime: 15,
      cookTime: 20,
      servings: 4,
    };

    const result = RecipeSchema.safeParse(invalidRecipe);
    expect(result.success).toBe(false);
  });

  it('should use default difficulty', () => {
    const recipe = {
      title: 'Test Recipe',
      ingredients: ['ingredient'],
      instructions: ['instruction'],
      prepTime: 15,
      cookTime: 20,
      servings: 4,
    };

    const result = RecipeSchema.safeParse(recipe);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.difficulty).toBe('easy');
    }
  });

  it('should validate optional fields', () => {
    const recipe = {
      title: 'Minimal Recipe',
      ingredients: ['ingredient'],
      instructions: ['instruction'],
      prepTime: 0,
      cookTime: 0,
      servings: 1,
    };

    const result = RecipeSchema.safeParse(recipe);
    expect(result.success).toBe(true);
  });
});

describe('PantryItemSchema', () => {
  it('should validate a valid pantry item', () => {
    const validItem = {
      id: 'item-1',
      ingredient: 'Tomatoes',
      quantity: 5,
      unit: 'pieces',
      category: 'vegetables',
      expiryDate: new Date('2025-12-31'),
      addedAt: new Date(),
    };

    const result = PantryItemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
  });

  it('should reject pantry item without ingredient', () => {
    const invalidItem = {
      id: 'item-1',
      ingredient: '',
      quantity: 5,
    };

    const result = PantryItemSchema.safeParse(invalidItem);
    expect(result.success).toBe(false);
  });

  it('should reject negative quantity', () => {
    const invalidItem = {
      id: 'item-1',
      ingredient: 'Tomatoes',
      quantity: -1,
    };

    const result = PantryItemSchema.safeParse(invalidItem);
    expect(result.success).toBe(false);
  });

  it('should use default addedAt date', () => {
    const item = {
      id: 'item-1',
      ingredient: 'Tomatoes',
      quantity: 5,
    };

    const result = PantryItemSchema.safeParse(item);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.addedAt).toBeInstanceOf(Date);
    }
  });
});

describe('UserPreferencesSchema', () => {
  it('should validate valid user preferences', () => {
    const validPrefs = {
      dietaryRestrictions: ['vegetarian', 'gluten-free'],
      allergies: ['nuts'],
      cuisinePreferences: ['italian', 'mexican'],
      spiceLevel: 'medium' as const,
      cookingSkill: 'intermediate' as const,
    };

    const result = UserPreferencesSchema.safeParse(validPrefs);
    expect(result.success).toBe(true);
  });

  it('should use default values', () => {
    const prefs = {};

    const result = UserPreferencesSchema.safeParse(prefs);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dietaryRestrictions).toEqual([]);
      expect(result.data.allergies).toEqual([]);
      expect(result.data.cuisinePreferences).toEqual([]);
      expect(result.data.spiceLevel).toBe('medium');
      expect(result.data.cookingSkill).toBe('beginner');
    }
  });

  it('should validate spice level enum', () => {
    const invalidPrefs = {
      spiceLevel: 'extra-hot',
    };

    const result = UserPreferencesSchema.safeParse(invalidPrefs);
    expect(result.success).toBe(false);
  });
});
