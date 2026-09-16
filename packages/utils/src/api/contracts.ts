// @ts-nocheck
/**
 * API Contract Validators and DTOs
 * Provides type-safe request/response validation using Zod
 */

import { z } from 'zod';

/**
 * Common API response wrapper
 */
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional(),
    }).optional(),
    meta: z.object({
      timestamp: z.string(),
      requestId: z.string().optional(),
    }).optional(),
  });

/**
 * Pagination parameters
 */
export const PaginationParamsSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Paginated response
 */
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  });

/**
 * User DTOs
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  plan: z.enum(['free', 'premium', 'partner']),
  preferences: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  preferences: z.record(z.any()).optional(),
});

export const UpdateUserSchema = z.object({
  preferences: z.record(z.any()).optional(),
});

/**
 * Recipe DTOs
 */
export const RecipeSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  mediaUrl: z.string().url().optional(),
  steps: z.array(z.object({
    step: z.number(),
    instruction: z.string(),
    duration: z.number().optional(),
  })),
  ingredients: z.array(z.object({
    name: z.string(),
    amount: z.number(),
    unit: z.string(),
  })),
  macros: z.object({
    calories: z.number().optional(),
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional(),
  }).optional(),
  tags: z.array(z.string()),
  source: z.enum(['curated', 'partner', 'user']),
  userId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateRecipeSchema = z.object({
  title: z.string().min(1),
  steps: z.array(z.object({
    step: z.number(),
    instruction: z.string(),
    duration: z.number().optional(),
  })).min(1),
  ingredients: z.array(z.object({
    name: z.string(),
    amount: z.number(),
    unit: z.string(),
  })).min(1),
  macros: z.object({
    calories: z.number().optional(),
    protein: z.number().optional(),
    carbs: z.number().optional(),
    fat: z.number().optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Meal Plan DTOs
 */
export const MealPlanSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  householdId: z.string().uuid().optional(),
  day: z.string().date(),
  items: z.array(z.object({
    mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
    recipeId: z.string().uuid().optional(),
    name: z.string().optional(),
  })),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateMealPlanSchema = z.object({
  day: z.string().date(),
  items: z.array(z.object({
    mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
    recipeId: z.string().uuid().optional(),
    name: z.string().optional(),
  })),
  householdId: z.string().uuid().optional(),
});

/**
 * Grocery List DTOs
 */
export const GroceryListSchema = z.object({
  id: z.string().uuid(),
  householdId: z.string().uuid(),
  name: z.string().optional(),
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    unit: z.string(),
    checked: z.boolean(),
  })),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateGroceryListSchema = z.object({
  name: z.string().optional(),
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    unit: z.string(),
  })).optional(),
});

/**
 * Health Metric DTOs
 */
export const HealthMetricSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  kind: z.enum(['weight', 'sleep', 'water', 'steps', 'calories']),
  value: z.number(),
  unit: z.string(),
  ts: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export const CreateHealthMetricSchema = z.object({
  kind: z.enum(['weight', 'sleep', 'water', 'steps', 'calories']),
  value: z.number(),
  unit: z.string(),
  ts: z.string().datetime().optional(),
});

/**
 * API Request Validator Middleware Helper
 */
export function validateRequest<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> {
  return schema.parse(data);
}

/**
 * API Response Builder
 */
export function buildApiResponse<T>(
  success: boolean,
  data?: T,
  error?: { code: string; message: string; details?: unknown }
) {
  return {
    success,
    ...(data !== undefined && { data }),
    ...(error && { error }),
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Error response builder
 */
export function buildErrorResponse(
  code: string,
  message: string,
  details?: any
) {
  return buildApiResponse(false, undefined, { code, message, details });
}

/**
 * Success response builder
 */
export function buildSuccessResponse<T>(data: T) {
  return buildApiResponse(true, data);
}
