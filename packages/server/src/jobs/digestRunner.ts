/**
 * Digest Runner Job
 * Composes and sends weekly digest emails
 */

import { db } from '../db/index';
import { users, mealPlans, healthMetrics } from '../db/schema';
import { eq, gte, sql } from 'drizzle-orm';
import { logger } from '../observability/index';
import { crmAdapter } from '@whats-for-dinner/adapters-crm';
import type { EmailMessage } from '@whats-for-dinner/adapters-crm/types';

export async function digestRunnerProcessor(data: {
  dayOfWeek?: number; // 0 = Sunday
}): Promise<{ sent: number; errors: number }> {
  logger.info('Starting digest runner job');

  const dayOfWeek = data.dayOfWeek ?? 0; // Default Sunday
  const today = new Date().getDay();
  
  // Only run on specified day (e.g., Sunday)
  if (today !== dayOfWeek) {
    logger.info({ today, expected: dayOfWeek }, 'Skipping digest - not the right day');
    return { sent: 0, errors: 0 };
  }

  const results = { sent: 0, errors: 0 };

  try {
    // Get users who have created meal plans in the last week
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const activeUsers = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .innerJoin(mealPlans, eq(mealPlans.user_id, users.id))
      .where(gte(mealPlans.created_at, weekAgo))
      .groupBy(users.id, users.email)
      .limit(1000);

    for (const user of activeUsers) {
      try {
        // Get meal plans from last week
        const plans = await db
          .select()
          .from(mealPlans)
          .where(
            and(
              eq(mealPlans.user_id, user.id),
              gte(mealPlans.created_at, weekAgo),
            ),
          )
          .orderBy(sql`${mealPlans.day} DESC`)
          .limit(7);

        // Get health metrics summary
        const metrics = await db
          .select()
          .from(healthMetrics)
          .where(
            and(
              eq(healthMetrics.user_id, user.id),
              gte(healthMetrics.ts, weekAgo),
            ),
          )
          .limit(10);

        // Compose digest email
        const message: EmailMessage = {
          to: user.email,
          subject: 'Your Weekly Meal Planning Digest',
          templateId: 'WeeklyDigest',
          templateData: {
            mealPlans: plans.map((p) => ({
              day: p.day,
              recipes: (p.items as any[])?.map((item) => ({ name: item.recipe_id })) || [],
            })),
            metrics: metrics.map((m) => ({
              kind: m.kind,
              value: m.value,
              unit: m.unit,
            })),
          },
        };

        const result = await crmAdapter.sendTransactional(message);
        if (result.success) {
          results.sent++;
        } else {
          results.errors++;
        }
      } catch (error) {
        results.errors++;
        logger.error({ error, userId: user.id }, 'Error sending digest to user');
      }
    }
  } catch (error) {
    logger.error({ error }, 'Error in digest runner');
    results.errors++;
  }

  logger.info({ sent: results.sent, errors: results.errors }, 'Digest runner completed');
  return results;
}
