import { z } from 'zod';
export type Plan = 'free' | 'premium' | 'partner';
export type Role = 'owner' | 'adult' | 'teen' | 'child';
export type RecipeSource = 'curated' | 'partner' | 'user';
export interface RequestContext {
    user?: {
        id: string;
        email: string;
        plan: Plan;
        role?: 'admin' | 'user';
    };
    flags?: Record<string, boolean>;
}
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
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
export declare const dateRangeSchema: z.ZodObject<{
    from: z.ZodOptional<z.ZodDate>;
    to: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    from?: Date | undefined;
    to?: Date | undefined;
}, {
    from?: Date | undefined;
    to?: Date | undefined;
}>;
//# sourceMappingURL=types.d.ts.map