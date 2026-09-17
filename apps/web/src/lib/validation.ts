/**
 * Input Validation Utilities
 * 
 * Provides Zod schemas and validation helpers for API routes
 */

import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const uuidSchema = z.string().uuid('Invalid UUID');
export const nonEmptyStringSchema = z.string().min(1, 'Field cannot be empty');

// User schemas
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  preferences: z.record(z.any()).optional(),
});

// Recipe schemas
export const RecipeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  ingredients: z.array(z.string()).min(1, 'At least one ingredient is required'),
  instructions: z.array(z.string()).optional(),
  steps: z.array(z.string()).optional(),
  prepTime: z.number().min(0).optional(),
  cookTime: z.string().or(z.number()).optional(),
  servings: z.number().min(1).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('easy'),
  tags: z.array(z.string()).default([]),
  calories: z.number().optional(),
});

export type Recipe = z.infer<typeof RecipeSchema>;

export function validateEnv(): boolean {
  return true;
}

export const GenerateRecipesRequestSchema = z.object({
  ingredients: z.array(z.string()),
  preferences: z.string().optional(),
});
export type GenerateRecipesRequest = z.infer<typeof GenerateRecipesRequestSchema>;

export const createRecipeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  ingredients: z.array(z.string()).min(1, 'At least one ingredient is required'),
  steps: z.array(z.string()).min(1, 'At least one step is required'),
  tags: z.array(z.string()).optional(),
  macros: z.object({
    calories: z.number().int().positive().optional(),
    protein: z.number().int().nonnegative().optional(),
    carbs: z.number().int().nonnegative().optional(),
    fat: z.number().int().nonnegative().optional(),
  }).optional(),
});

export const generateMealSchema = z.object({
  ingredients: z.array(z.string()).min(1, 'At least one ingredient is required'),
  dietaryRestrictions: z.array(z.string()).optional(),
  cuisine: z.string().optional(),
  servings: z.number().int().positive().max(20).optional(),
});

// Meal plan schemas
export const createMealPlanSchema = z.object({
  day: z.string().datetime().or(z.date()),
  items: z.array(z.object({
    mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
    recipeId: uuidSchema.optional(),
    customMeal: z.string().optional(),
  })).min(1, 'At least one meal is required'),
});

// Grocery list schemas
export const createGroceryListSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  items: z.array(z.object({
    name: z.string().min(1, 'Item name is required'),
    quantity: z.string().optional(),
    checked: z.boolean().optional(),
  })).optional(),
});

// Pagination schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Search schemas
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(200, 'Query too long'),
  filters: z.record(z.any()).optional(),
});

/**
 * Validate request body against a Zod schema
 */
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: Response }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: new Response(
          JSON.stringify({
            error: 'Validation Error',
            message: 'Invalid request data',
            details: error.errors.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        ),
      };
    }
    
    return {
      data: null,
      error: new Response(
        JSON.stringify({
          error: 'Invalid Request',
          message: 'Request body is not valid JSON',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      ),
    };
  }
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQuery<T>(
  request: Request,
  schema: z.ZodSchema<T>
): { data: T; error: null } | { data: null; error: Response } {
  try {
    const url = new URL(request.url);
    const params: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    const data = schema.parse(params);
    return { data, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: new Response(
          JSON.stringify({
            error: 'Validation Error',
            message: 'Invalid query parameters',
            details: error.errors.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        ),
      };
    }
    
    return {
      data: null,
      error: new Response(
        JSON.stringify({
          error: 'Invalid Request',
          message: 'Invalid query parameters',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      ),
    };
  }
}

/**
 * Helper to create validated API route handler
 */
export function createValidatedHandler<TBody, TQuery = Record<string, never>>(
  bodySchema: z.ZodSchema<TBody> | undefined,
  querySchema: z.ZodSchema<TQuery> | undefined,
  handler: (data: { body: TBody; query: TQuery; request: Request }) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    // Validate body if schema provided
    if (bodySchema) {
      const bodyResult = await validateRequest(request, bodySchema);
      if (bodyResult.error) {
        return bodyResult.error;
      }
      
      // Validate query if schema provided
      if (querySchema) {
        const queryResult = validateQuery(request, querySchema);
        if (queryResult.error) {
          return queryResult.error;
        }
        
        return handler({
          body: bodyResult.data,
          query: queryResult.data,
          request,
        });
      }
      
      return handler({
        body: bodyResult.data,
        query: {} as TQuery,
        request,
      });
    }
    
    // Only validate query
    if (querySchema) {
      const queryResult = validateQuery(request, querySchema);
      if (queryResult.error) {
        return queryResult.error;
      }
      
      return handler({
        body: {} as TBody,
        query: queryResult.data,
        request,
      });
    }
    
    // No validation
    return handler({
      body: {} as TBody,
      query: {} as TQuery,
      request,
    });
  };
}
