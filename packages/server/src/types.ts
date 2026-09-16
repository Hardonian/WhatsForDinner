// @ts-nocheck
import { z } from 'zod';

// User types
export type Plan = 'free' | 'premium' | 'partner';
export type Role = 'owner' | 'adult' | 'teen' | 'child';
export type RecipeSource = 'curated' | 'partner' | 'user';

// Request context
export interface RequestContext {
  user?: {
    id: string;
    email: string;
    plan: Plan;
    role?: 'admin' | 'user';
  };
  flags?: Record<string, boolean>;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Common schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const dateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
