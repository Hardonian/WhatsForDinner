import * as schema from './schema';
import type { PaginationParams, PaginatedResponse } from '../types';
export declare let db: any;
export declare function paginateQuery<T>(query: Promise<T[]>, countQuery: Promise<{
    count: number;
}[]>, params: PaginationParams): Promise<PaginatedResponse<T>>;
export declare const usersRepo: {
    findById(id: string): Promise<any>;
    findByEmail(email: string): Promise<any>;
    update(id: string, data: Partial<typeof schema.users.$inferInsert>): Promise<any>;
};
export declare const mealPlansRepo: {
    findByUserAndDay(userId: string, day: Date | string): Promise<any>;
    findByUser(userId: string, params?: PaginationParams): Promise<PaginatedResponse<unknown>>;
    upsert(plan: typeof schema.mealPlans.$inferInsert): Promise<any>;
    delete(id: string, userId: string): Promise<void>;
};
export declare const recipesRepo: {
    search(query: string, filters?: {
        tags?: string[];
        macro?: string;
    }): Promise<any>;
    findById(id: string): Promise<any>;
    create(recipe: typeof schema.recipes.$inferInsert): Promise<any>;
};
export declare const groceryListsRepo: {
    findByHousehold(householdId: string): Promise<any>;
    findById(id: string): Promise<any>;
    upsert(list: typeof schema.groceryLists.$inferInsert): Promise<any>;
    delete(id: string): Promise<void>;
};
export declare const healthMetricsRepo: {
    findByUser(userId: string, filters?: {
        kind?: string;
        from?: Date;
        to?: Date;
    }): Promise<any>;
    create(metric: typeof schema.healthMetrics.$inferInsert): Promise<any>;
};
export declare const eventsRepo: {
    create(event: typeof schema.events.$inferInsert): Promise<any>;
    findByUser(userId: string, params?: PaginationParams): Promise<PaginatedResponse<unknown>>;
};
export declare const webhookEventsRepo: {
    findByExternalId(source: string, externalId: string): Promise<any>;
    create(event: typeof schema.webhookEvents.$inferInsert): Promise<any>;
    markProcessed(id: string): Promise<void>;
};
export declare const featureFlagsRepo: {
    findByUser(userId: string): Promise<any>;
    upsert(userId: string, flags: Record<string, boolean>): Promise<void>;
};
export declare function computeResponseETag(data: unknown): string;
export declare function closeDb(): Promise<void>;
export * as schema from './schema';
export { clicks, partners, users, households, recipes, mealPlans, groceryLists } from './schema';
//# sourceMappingURL=index.d.ts.map