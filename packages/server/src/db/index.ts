// @ts-nocheck
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import type { PaginationParams, PaginatedResponse } from '../types';
import Redis from 'ioredis';
import crypto from 'crypto';

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || '';
let client: ReturnType<typeof postgres> | null = null;
export let db: any = null;

if (connectionString) {
  client = postgres(connectionString, { max: 20 });
  db = drizzle(client, { schema });
} else {
  db = new Proxy({}, {
    get(_, prop) {
      const conn = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
      if (!conn) {
        throw new Error('DATABASE_URL or SUPABASE_DB_URL must be set before executing database queries');
      }
      if (!client) {
        client = postgres(conn, { max: 20 });
        db = drizzle(client, { schema });
      }
      return (db as any)[prop];
    },
  });
}

let redisClient: Redis | null = null;

function getRedis(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL must be set');
    }
    redisClient = new Redis(redisUrl);
  }
  return redisClient;
}

// ETag computation helper
function computeETag(data: unknown): string {
  const str = JSON.stringify(data);
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
}

// Pagination helper
export async function paginateQuery<T>(
  query: Promise<T[]>,
  countQuery: Promise<{ count: number }[]>,
  params: PaginationParams,
): Promise<PaginatedResponse<T>> {
  const page = params.page || 1;
  const limit = params.limit || 20;

  const [data, countResult] = await Promise.all([query, countQuery]);
  const total = Number(countResult[0]?.count || 0);
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

// Users repository
export const usersRepo = {
  async findById(id: string) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return user || null;
  },

  async findByEmail(email: string) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    return user || null;
  },

  async update(id: string, data: Partial<typeof schema.users.$inferInsert>) {
    const [updated] = await db
      .update(schema.users)
      .set({ ...data, updated_at: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return updated || null;
  },
};

// Meal plans repository
export const mealPlansRepo = {
  async findByUserAndDay(userId: string, day: Date | string) {
    const dayStr = typeof day === 'string' ? day : (day.toISOString().split('T')[0] ?? '');
    const [plan] = await db
      .select()
      .from(schema.mealPlans)
      .where(and(eq(schema.mealPlans.user_id, userId), eq(schema.mealPlans.day, dayStr)))
      .limit(1);
    return plan || null;
  },

  async findByUser(userId: string, params: PaginationParams = {}) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    const query = db
      .select()
      .from(schema.mealPlans)
      .where(eq(schema.mealPlans.user_id, userId))
      .orderBy(desc(schema.mealPlans.day))
      .limit(limit)
      .offset(offset);

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(schema.mealPlans)
      .where(eq(schema.mealPlans.user_id, userId));

    return paginateQuery(query, countQuery, params);
  },

  async upsert(plan: typeof schema.mealPlans.$inferInsert) {
    const dayStr = String(plan.day);
    
    const [existing] = await db
      .select()
      .from(schema.mealPlans)
      .where(
        and(
          eq(schema.mealPlans.user_id, plan.user_id),
          eq(schema.mealPlans.day, dayStr),
        ),
      )
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(schema.mealPlans)
        .set({ ...plan, day: dayStr, updated_at: new Date() })
        .where(eq(schema.mealPlans.id, existing.id))
        .returning();
      return updated || null;
    }

    const [created] = await db
      .insert(schema.mealPlans)
      .values({ ...plan, day: dayStr })
      .returning();
    return created || null;
  },

  async delete(id: string, userId: string) {
    await db
      .delete(schema.mealPlans)
      .where(and(eq(schema.mealPlans.id, id), eq(schema.mealPlans.user_id, userId)));
  },
};

// Recipes repository
export const recipesRepo = {
  async search(query: string, filters?: { tags?: string[]; macro?: string }) {
    let q = db.select().from(schema.recipes);

    if (query) {
      q = q.where(sql`${schema.recipes.title} ILIKE ${'%' + query + '%'}`);
    }

    if (filters?.tags && filters.tags.length > 0) {
      q = q.where(sql`${schema.recipes.tags} && ${filters.tags}`);
    }

    // Cache results for 60 seconds
    const cacheKey = `recipe_search:${query}:${JSON.stringify(filters)}`;
    const cached = await getRedis().get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const results = await q.limit(50);

    await getRedis().setex(cacheKey, 60, JSON.stringify(results));
    return results;
  },

  async findById(id: string) {
    const [recipe] = await db.select().from(schema.recipes).where(eq(schema.recipes.id, id)).limit(1);
    return recipe || null;
  },

  async create(recipe: typeof schema.recipes.$inferInsert) {
    const [created] = await db.insert(schema.recipes).values(recipe).returning();
    return created || null;
  },
};

// Grocery lists repository
export const groceryListsRepo = {
  async findByHousehold(householdId: string) {
    return db
      .select()
      .from(schema.groceryLists)
      .where(eq(schema.groceryLists.household_id, householdId))
      .orderBy(desc(schema.groceryLists.updated_at));
  },

  async findById(id: string) {
    const [list] = await db.select().from(schema.groceryLists).where(eq(schema.groceryLists.id, id)).limit(1);
    return list || null;
  },

  async upsert(list: typeof schema.groceryLists.$inferInsert) {
    if (list.id) {
      const [updated] = await db
        .update(schema.groceryLists)
        .set({ ...list, updated_at: new Date() })
        .where(eq(schema.groceryLists.id, list.id))
        .returning();
      return updated || null;
    }

    const [created] = await db.insert(schema.groceryLists).values(list).returning();
    return created || null;
  },

  async delete(id: string) {
    await db.delete(schema.groceryLists).where(eq(schema.groceryLists.id, id));
  },
};

// Health metrics repository
export const healthMetricsRepo = {
  async findByUser(userId: string, filters?: { kind?: string; from?: Date; to?: Date }) {
    let q = db
      .select()
      .from(schema.healthMetrics)
      .where(eq(schema.healthMetrics.user_id, userId));

    if (filters?.kind) {
      q = q.where(and(eq(schema.healthMetrics.kind, filters.kind as any)));
    }

    if (filters?.from) {
      q = q.where(gte(schema.healthMetrics.ts, filters.from));
    }

    if (filters?.to) {
      q = q.where(lte(schema.healthMetrics.ts, filters.to));
    }

    return q.orderBy(desc(schema.healthMetrics.ts));
  },

  async create(metric: typeof schema.healthMetrics.$inferInsert) {
    const [created] = await db.insert(schema.healthMetrics).values(metric).returning();
    return created || null;
  },
};

// Events repository
export const eventsRepo = {
  async create(event: typeof schema.events.$inferInsert) {
    const [created] = await db.insert(schema.events).values(event).returning();
    return created || null;
  },

  async findByUser(userId: string, params: PaginationParams = {}) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    const query = db
      .select()
      .from(schema.events)
      .where(eq(schema.events.user_id, userId))
      .orderBy(desc(schema.events.ts))
      .limit(limit)
      .offset(offset);

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(schema.events)
      .where(eq(schema.events.user_id, userId));

    return paginateQuery(query, countQuery, params);
  },
};

// Webhook events repository (for idempotency)
export const webhookEventsRepo = {
  async findByExternalId(source: string, externalId: string) {
    const [event] = await db
      .select()
      .from(schema.webhookEvents)
      .where(
        and(
          eq(schema.webhookEvents.source, source),
          eq(schema.webhookEvents.external_id, externalId),
        ),
      )
      .limit(1);
    return event || null;
  },

  async create(event: typeof schema.webhookEvents.$inferInsert) {
    const [created] = await db.insert(schema.webhookEvents).values(event).returning();
    return created || null;
  },

  async markProcessed(id: string) {
    await db
      .update(schema.webhookEvents)
      .set({ processed_at: new Date() })
      .where(eq(schema.webhookEvents.id, id));
  },
};

// Feature flags repository
export const featureFlagsRepo = {
  async findByUser(userId: string) {
    const [flags] = await db
      .select()
      .from(schema.featureFlags)
      .where(eq(schema.featureFlags.user_id, userId))
      .limit(1);
    return flags?.flags || {};
  },

  async upsert(userId: string, flags: Record<string, boolean>) {
    await db
      .insert(schema.featureFlags)
      .values({ user_id: userId, flags })
      .onConflictDoUpdate({
        target: schema.featureFlags.user_id,
        set: { flags, updated_at: new Date() },
      });
  },
};

// Helper to compute ETag for responses
export function computeResponseETag(data: unknown): string {
  return computeETag(data);
}

// Cleanup function
export async function closeDb() {
  if (client) {
    await client.end();
  }
  if (redisClient) {
    await redisClient.quit();
  }
}

// Re-export schema for convenience
export * as schema from './schema';
export { clicks, partners, users, households, recipes, mealPlans, groceryLists } from './schema';
