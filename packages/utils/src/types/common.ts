// @ts-nocheck
/**
 * Common Type Definitions
 * 
 * Shared types used across the application
 */

export interface User {
  id: string;
  email: string;
  plan?: 'free' | 'premium' | 'partner';
  preferences?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  cookTime?: string;
  servings?: number;
  macros?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
  tags?: string[];
  source?: 'curated' | 'partner' | 'user';
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  expirationDate?: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MealPlan {
  id: string;
  userId: string;
  householdId?: string;
  day: string;
  items: Array<{
    recipeId: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface GroceryList {
  id: string;
  householdId: string;
  name?: string;
  items: Array<{
    name: string;
    quantity?: number;
    checked: boolean;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    correlationId?: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
