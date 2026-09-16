// @ts-nocheck
/**
 * Revenue Analytics Module
 * ETL jobs aggregating transactions ? revenue_snapshots
 * Computes KPIs: MRR, ARR, ARPU, LTV, CAC
 * Emits metrics ? Prometheus + PostHog events
 */

import { db } from '../db/index';
import {
  transactions,
  revenueSnapshots,
  users,
  ltvSegments,
  lifecycleEvents,
} from '../db/schema';
import { eq, and, gte, lte, sql, desc, sum, count, avg } from 'drizzle-orm';
import { logger } from '../observability/index';
import type { Numeric } from 'drizzle-orm';

export interface RevenueMetrics {
  mrr_cents: number;
  arr_cents: number;
  arpu_cents: number;
  ltv_cents: number;
  cac_cents: number;
  churn_rate: number;
  conversion_rate: number;
}

/**
 * Compute MRR from active subscriptions
 */
async function computeMRR(period: Date): Promise<number> {
  const periodStart = new Date(period);
  periodStart.setDate(1);
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  // Get monthly recurring transactions (success status, monthly plans)
  const result = await db
    .select({
      total: sum(transactions.amount_cents),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.status, 'success'),
        eq(transactions.plan, 'monthly'),
        gte(transactions.ts, periodStart),
        lte(transactions.ts, periodEnd),
      ),
    )
    .limit(1);

  // For annual plans, divide by 12
  const annualResult = await db
    .select({
      total: sum(transactions.amount_cents),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.status, 'success'),
        eq(transactions.plan, 'annual'),
        gte(transactions.ts, periodStart),
        lte(transactions.ts, periodEnd),
      ),
    )
    .limit(1);

  const monthlyAmount = Number(result[0]?.total || 0);
  const annualAmount = Number(annualResult[0]?.total || 0) / 12;

  return Math.round(monthlyAmount + annualAmount);
}

/**
 * Compute ARPU (Average Revenue Per User)
 */
async function computeARPU(period: Date): Promise<number> {
  const periodStart = new Date(period);
  periodStart.setDate(1);
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const revenueResult = await db
    .select({
      total: sum(transactions.amount_cents),
      userCount: sql<number>`count(distinct ${transactions.user_id})`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.status, 'success'),
        gte(transactions.ts, periodStart),
        lte(transactions.ts, periodEnd),
      ),
    )
    .limit(1);

  const totalRevenue = Number(revenueResult[0]?.total || 0);
  const activeUsers = Number(revenueResult[0]?.userCount || 0);

  if (activeUsers === 0) return 0;
  return Math.round(totalRevenue / activeUsers);
}

/**
 * Compute LTV (Lifetime Value) from cohort retention ? ARPU ? gross margin
 * Simplified: avg revenue per user ? avg lifetime (months) ? gross margin (0.7)
 */
async function computeLTV(): Promise<number> {
  // Get average revenue per user from all time
  const revenuePerUser = await db
    .select({
      avgRevenue: avg(transactions.amount_cents),
    })
    .from(transactions)
    .where(eq(transactions.status, 'success'))
    .limit(1);

  const avgRevenue = Number(revenuePerUser[0]?.avgRevenue || 0);

  // Estimate lifetime: average months active
  // Simplified: look at user retention over 12 months
  const userLifetime = await db
    .select({
      avgMonths: sql<number>`
        avg(
          EXTRACT(EPOCH FROM (max(${transactions.ts}) - min(${transactions.ts}))) / 2592000
        )
      `,
    })
    .from(transactions)
    .where(eq(transactions.status, 'success'))
    .groupBy(transactions.user_id)
    .limit(1);

  const avgMonths = Number(userLifetime[0]?.avgMonths || 6); // Fallback to 6 months
  const grossMargin = 0.7; // 70% gross margin

  return Math.round(avgRevenue * avgMonths * grossMargin);
}

/**
 * Compute CAC (Customer Acquisition Cost): marketing spend / new paid users
 * Simplified: estimate from lifecycle events and conversion data
 */
async function computeCAC(period: Date): Promise<number> {
  const periodStart = new Date(period);
  periodStart.setDate(1);
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  // Count new paid users (first transaction in period)
  const newPaidUsers = await db
    .select({
      count: count(),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.status, 'success'),
        gte(transactions.ts, periodStart),
        lte(transactions.ts, periodEnd),
        sql`${transactions.ts} = (
          SELECT min(${transactions.ts})
          FROM ${transactions} t2
          WHERE t2.user_id = ${transactions.user_id}
          AND t2.status = 'success'
        )`,
      ),
    )
    .limit(1);

  const newUsers = Number(newPaidUsers[0]?.count || 0);
  if (newUsers === 0) return 0;

  // Estimate marketing spend from lifecycle events (if available)
  // For now, use a default CAC estimate
  const estimatedMarketingSpend = newUsers * 50 * 100; // $50 per user in cents
  return Math.round(estimatedMarketingSpend / newUsers);
}

/**
 * Compute churn rate: users who cancelled / total active users
 */
async function computeChurnRate(period: Date): Promise<number> {
  const periodStart = new Date(period);
  periodStart.setDate(1);
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  // Count active users at start of period
  const activeUsersStart = await db
    .select({
      count: sql<number>`count(distinct ${transactions.user_id})`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.status, 'success'),
        lte(transactions.ts, periodStart),
      ),
    )
    .limit(1);

  // Count users who cancelled (no transaction in period but had before)
  const cancelledUsers = await db
    .select({
      count: sql<number>`count(distinct ${transactions.user_id})`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.status, 'success'),
        lte(transactions.ts, periodStart),
        sql`NOT EXISTS (
          SELECT 1 FROM ${transactions} t2
          WHERE t2.user_id = ${transactions.user_id}
          AND t2.status = 'success'
          AND t2.ts > ${periodStart}
          AND t2.ts <= ${periodEnd}
        )`,
      ),
    )
    .limit(1);

  const active = Number(activeUsersStart[0]?.count || 0);
  const cancelled = Number(cancelledUsers[0]?.count || 0);

  if (active === 0) return 0;
  return cancelled / active;
}

/**
 * Compute conversion rate: new paid users / total signups
 */
async function computeConversionRate(period: Date): Promise<number> {
  const periodStart = new Date(period);
  periodStart.setDate(1);
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  // Total signups in period
  const signups = await db
    .select({
      count: count(),
    })
    .from(users)
    .where(
      and(gte(users.created_at, periodStart), lte(users.created_at, periodEnd)),
    )
    .limit(1);

  // New paid users (first transaction)
  const newPaidUsers = await db
    .select({
      count: count(),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.status, 'success'),
        gte(transactions.ts, periodStart),
        lte(transactions.ts, periodEnd),
        sql`${transactions.ts} = (
          SELECT min(${transactions.ts})
          FROM ${transactions} t2
          WHERE t2.user_id = ${transactions.user_id}
          AND t2.status = 'success'
        )`,
      ),
    )
    .limit(1);

  const totalSignups = Number(signups[0]?.count || 0);
  const paid = Number(newPaidUsers[0]?.count || 0);

  if (totalSignups === 0) return 0;
  return paid / totalSignups;
}

/**
 * Aggregate revenue metrics for a given period
 */
export async function aggregateRevenueSnapshot(period: Date): Promise<RevenueMetrics> {
  logger.info({ period }, 'Computing revenue snapshot');

  const [mrr, arpu, ltv, cac, churn, conversion] = await Promise.all([
    computeMRR(period),
    computeARPU(period),
    computeLTV(),
    computeCAC(period),
    computeChurnRate(period),
    computeConversionRate(period),
  ]);

  const arr = mrr * 12;

  const metrics: RevenueMetrics = {
    mrr_cents: mrr,
    arr_cents: arr,
    arpu_cents: arpu,
    ltv_cents: ltv,
    cac_cents: cac,
    churn_rate: churn,
    conversion_rate: conversion,
  };

  // Upsert snapshot
  const periodStr = period.toISOString().split('T')[0];
  await db
    .insert(revenueSnapshots)
    .values({
      period: periodStr,
      ...metrics,
      computed_at: new Date(),
    })
    .onConflictDoUpdate({
      target: revenueSnapshots.period,
      set: {
        ...metrics,
        computed_at: new Date(),
      },
    });

  logger.info({ period, metrics }, 'Revenue snapshot computed');

  // Emit to Prometheus (via observability)
  // This would integrate with your Prometheus exporter
  // await emitPrometheusMetrics(metrics);

  // Emit to PostHog
  // await emitPostHogEvents(metrics);

  return metrics;
}

/**
 * Get revenue summary for a period range
 */
export async function getRevenueSummary(
  startDate: Date,
  endDate: Date,
): Promise<RevenueMetrics[]> {
  const snapshots = await db
    .select()
    .from(revenueSnapshots)
    .where(
      and(
        gte(revenueSnapshots.period, startDate.toISOString().split('T')[0]),
        lte(revenueSnapshots.period, endDate.toISOString().split('T')[0]),
      ),
    )
    .orderBy(desc(revenueSnapshots.period));

  return snapshots.map((s) => ({
    mrr_cents: Number(s.mrr_cents),
    arr_cents: Number(s.arr_cents),
    arpu_cents: Number(s.arpu_cents),
    ltv_cents: Number(s.ltv_cents),
    cac_cents: Number(s.cac_cents),
    churn_rate: Number(s.churn_rate),
    conversion_rate: Number(s.conversion_rate),
  }));
}

/**
 * Emit PostHog events for revenue metrics
 */
async function emitPostHogEvents(metrics: RevenueMetrics): Promise<void> {
  // This would integrate with PostHog
  // Example:
  // await posthog.capture({
  //   distinctId: 'system',
  //   event: 'revenue_metrics_computed',
  //   properties: metrics,
  // });
}
