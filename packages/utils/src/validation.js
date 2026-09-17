// @ts-nocheck
import { z } from 'zod';
export const RecipeSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    ingredients: z.array(z.string()).min(1, 'At least one ingredient is required'),
    instructions: z.array(z.string()).min(1, 'At least one instruction is required'),
    prepTime: z.number().min(0, 'Prep time must be positive'),
    cookTime: z.number().min(0, 'Cook time must be positive'),
    servings: z.number().min(1, 'Servings must be at least 1'),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('easy'),
    tags: z.array(z.string()).default([]),
    imageUrl: z.string().url().optional(),
    nutrition: z.object({
        calories: z.number().optional(),
        protein: z.number().optional(),
        carbs: z.number().optional(),
        fat: z.number().optional(),
    }).optional(),
});
export const PantryItemSchema = z.object({
    id: z.string(),
    ingredient: z.string().min(1, 'Ingredient name is required'),
    quantity: z.number().min(0, 'Quantity must be positive'),
    unit: z.string().optional(),
    category: z.string().optional(),
    expiryDate: z.date().optional(),
    addedAt: z.date().default(() => new Date()),
});
export const UserPreferencesSchema = z.object({
    dietaryRestrictions: z.array(z.string()).default([]),
    allergies: z.array(z.string()).default([]),
    cuisinePreferences: z.array(z.string()).default([]),
    spiceLevel: z.enum(['mild', 'medium', 'hot']).default('medium'),
    cookingSkill: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
});
