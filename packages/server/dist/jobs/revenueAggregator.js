// @ts-nocheck
/**
 * Revenue Aggregator Job
 * Nightly cron 00:05 UTC: aggregate daily transactions ? snapshots
 * Weekly task: compute cohort LTV/CAC segments
 */
import { aggregateRevenueSnapshot } from '../analytics/revenue';
import { db } from '../db/index';
import { ltvSegments, transactions } from '../db/schema';
import { eq, sql, and, gte, lte, count, avg } from 'drizzle-orm';
import { logger } from '../observability/index';
/**
 * Daily aggregation job
 * Runs at 00:05 UTC
 */
export async function dailyRevenueAggregation() {
    logger.info('Starting daily revenue aggregation');
    try {
        // Aggregate yesterday's data
        const yesterday = new Date();
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        yesterday.setUTCHours(0, 0, 0, 0);
        await aggregateRevenueSnapshot(yesterday);
        logger.info('Daily revenue aggregation completed');
    }
    catch (error) {
        logger.error({ error }, 'Error in daily revenue aggregation');
        throw error;
    }
}
/**
 * Weekly LTV/CAC segment computation
 */
export async function weeklyLTVSegmentation() {
    logger.info('Starting weekly LTV segmentation');
    try {
        // Compute segments: new, retained, churned, reactivated
        const twelveWeeksAgo = new Date();
        twelveWeeksAgo.setUTCDate(twelveWeeksAgo.getUTCDate() - 84); // 12 weeks
        // NEW: Users with first transaction in last 12 weeks
        const newUsers = await db
            .select({
            avgLTV: avg(transactions.amount_cents),
            avgCAC: sql `5000`, // Default CAC estimate
            count: count(),
        })
            .from(transactions)
            .where(and(eq(transactions.status, 'success'), gte(transactions.ts, twelveWeeksAgo), sql `${transactions.ts} = (
            SELECT min(${transactions.ts})
            FROM ${transactions} t2
            WHERE t2.user_id = ${transactions.user_id}
            AND t2.status = 'success'
          )`))
            .limit(1);
        const newLTV = Number(newUsers[0]?.avgLTV || 0);
        const newCount = Number(newUsers[0]?.count || 0);
        // RETAINED: Users with transactions in last 4 weeks and before
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setUTCDate(fourWeeksAgo.getUTCDate() - 28);
        const retainedUsers = await db
            .select({
            avgLTV: sql `
          avg(
            (SELECT sum(amount_cents) FROM ${transactions} t
             WHERE t.user_id = ${transactions.user_id}
             AND t.status = 'success')
            *
            (SELECT EXTRACT(EPOCH FROM (max(ts) - min(ts))) / 2592000 FROM ${transactions} t
             WHERE t.user_id = ${transactions.user_id}
             AND t.status = 'success')
            * 0.7
          )
        `,
            avgCAC: sql `5000`,
        })
            .from(transactions)
            .where(and(eq(transactions.status, 'success'), gte(transactions.ts, fourWeeksAgo), sql `EXISTS (
            SELECT 1 FROM ${transactions} t2
            WHERE t2.user_id = ${transactions.user_id}
            AND t2.status = 'success'
            AND t2.ts < ${fourWeeksAgo}
          )`))
            .groupBy(transactions.user_id)
            .limit(1);
        const retainedLTV = Number(retainedUsers[0]?.avgLTV || 0);
        // CHURNED: Users with last transaction 4-12 weeks ago
        const eightWeeksAgo = new Date();
        eightWeeksAgo.setUTCDate(eightWeeksAgo.getUTCDate() - 56);
        const churnedUsers = await db
            .select({
            avgLTV: sql `
          avg(
            (SELECT sum(amount_cents) FROM ${transactions} t
             WHERE t.user_id = ${transactions.user_id}
             AND t.status = 'success')
            *
            (SELECT EXTRACT(EPOCH FROM (max(ts) - min(ts))) / 2592000 FROM ${transactions} t
             WHERE t.user_id = ${transactions.user_id}
             AND t.status = 'success')
            * 0.7
          )
        `,
            avgCAC: sql `5000`,
        })
            .from(transactions)
            .where(and(eq(transactions.status, 'success'), lte(transactions.ts, eightWeeksAgo), gte(transactions.ts, twelveWeeksAgo), sql `NOT EXISTS (
            SELECT 1 FROM ${transactions} t2
            WHERE t2.user_id = ${transactions.user_id}
            AND t2.status = 'success'
            AND t2.ts > ${eightWeeksAgo}
          )`))
            .groupBy(transactions.user_id)
            .limit(1);
        const churnedLTV = Number(churnedUsers[0]?.avgLTV || 0);
        // REACTIVATED: Users with transaction in last 4 weeks after being churned
        const reactivatedUsers = await db
            .select({
            avgLTV: sql `
          avg(
            (SELECT sum(amount_cents) FROM ${transactions} t
             WHERE t.user_id = ${transactions.user_id}
             AND t.status = 'success')
            *
            (SELECT EXTRACT(EPOCH FROM (max(ts) - min(ts))) / 2592000 FROM ${transactions} t
             WHERE t.user_id = ${transactions.user_id}
             AND t.status = 'success')
            * 0.7
          )
        `,
            avgCAC: sql `3000`, // Lower CAC for reactivated
        })
            .from(transactions)
            .where(and(eq(transactions.status, 'success'), gte(transactions.ts, fourWeeksAgo), sql `EXISTS (
            SELECT 1 FROM ${transactions} t2
            WHERE t2.user_id = ${transactions.user_id}
            AND t2.status = 'success'
            AND t2.ts < ${twelveWeeksAgo}
            AND NOT EXISTS (
              SELECT 1 FROM ${transactions} t3
              WHERE t3.user_id = ${transactions.user_id}
              AND t3.status = 'success'
              AND t3.ts >= ${eightWeeksAgo}
              AND t3.ts < ${fourWeeksAgo}
            )
          )`))
            .groupBy(transactions.user_id)
            .limit(1);
        const reactivatedLTV = Number(reactivatedUsers[0]?.avgLTV || 0);
        // Upsert segments
        const segments = [
            {
                segment: 'new',
                avg_ltv_cents: Math.round(newLTV),
                avg_cac_cents: 5000,
                margin_pct: newLTV > 0 ? ((newLTV - 5000) / newLTV) * 100 : 0,
            },
            {
                segment: 'retained',
                avg_ltv_cents: Math.round(retainedLTV),
                avg_cac_cents: 5000,
                margin_pct: retainedLTV > 0 ? ((retainedLTV - 5000) / retainedLTV) * 100 : 0,
            },
            {
                segment: 'churned',
                avg_ltv_cents: Math.round(churnedLTV),
                avg_cac_cents: 5000,
                margin_pct: churnedLTV > 0 ? ((churnedLTV - 5000) / churnedLTV) * 100 : 0,
            },
            {
                segment: 'reactivated',
                avg_ltv_cents: Math.round(reactivatedLTV),
                avg_cac_cents: 3000,
                margin_pct: reactivatedLTV > 0 ? ((reactivatedLTV - 3000) / reactivatedLTV) * 100 : 0,
            },
        ];
        for (const seg of segments) {
            await db
                .insert(ltvSegments)
                .values({
                ...seg,
                updated_at: new Date(),
            })
                .onConflictDoUpdate({
                target: ltvSegments.segment,
                set: {
                    ...seg,
                    updated_at: new Date(),
                },
            });
        }
        logger.info({ segments }, 'LTV segmentation completed');
    }
    catch (error) {
        logger.error({ error }, 'Error in weekly LTV segmentation');
        throw error;
    }
}
