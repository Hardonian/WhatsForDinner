// @ts-nocheck
/**
 * Elasticity Model Job
 * Weekly job: fetch transactions and conversion counts per price point
 * Fit log-log regression to compute price elasticity
 */

import { db } from '../db/index';
import { transactions, elasticityResults } from '../db/schema';
import { eq, and, sql, gte, desc } from 'drizzle-orm';
import { logger } from '../observability/index';

/**
 * Simple log-log regression to compute elasticity
 * elasticity = slope of log(quantity) vs log(price)
 */
function computeLogLogElasticity(
  pricePoints: number[],
  demand: number[],
): number {
  if (pricePoints.length < 2 || demand.length < 2) {
    return -1.5; // Default elastic
  }

  // Log transform
  const logPrices = pricePoints.map((p) => Math.log(p));
  const logDemands = demand.map((d) => Math.log(Math.max(d, 1))); // Avoid log(0)

  // Compute means
  const meanLogPrice = logPrices.reduce((a, b) => a + b, 0) / logPrices.length;
  const meanLogDemand = logDemands.reduce((a, b) => a + b, 0) / logDemands.length;

  // Compute slope (elasticity)
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < logPrices.length; i++) {
    const diffPrice = logPrices[i] - meanLogPrice;
    const diffDemand = logDemands[i] - meanLogDemand;
    numerator += diffPrice * diffDemand;
    denominator += diffPrice * diffPrice;
  }

  if (denominator === 0) {
    return -1.5; // Default
  }

  const elasticity = numerator / denominator;
  return elasticity;
}

/**
 * Aggregate transactions by price point for elasticity calculation
 */
async function aggregatePriceDemand(
  country: string | null,
  plan: string,
  weeksBack: number = 12,
): Promise<{ price_points: number[]; demand: number[] }> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - weeksBack * 7);

  // Group transactions by price point and count demand
  const priceDemand = await db
    .select({
      price_cents: transactions.amount_cents,
      demand: sql<number>`count(*)::int`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.status, 'success'),
        eq(transactions.plan, plan),
        gte(transactions.ts, cutoffDate),
        country ? eq(transactions.country, country) : sql`true`,
      ),
    )
    .groupBy(transactions.amount_cents)
    .orderBy(desc(sql<number>`count(*)`));

  const price_points: number[] = [];
  const demand: number[] = [];

  for (const row of priceDemand) {
    const price = Number(row.price_cents);
    const qty = Number(row.demand);
    if (price > 0 && qty > 0) {
      price_points.push(price);
      demand.push(qty);
    }
  }

  return { price_points, demand };
}

/**
 * Weekly elasticity computation job
 */
export async function computeElasticityModels(): Promise<void> {
  logger.info('Starting elasticity model computation');

  try {
    // Get distinct country/plan combinations from recent transactions
    const combinations = await db
      .selectDistinct({
        country: transactions.country,
        plan: transactions.plan,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.status, 'success'),
          gte(transactions.ts, sql`now() - interval '12 weeks'`),
        ),
      );

    for (const combo of combinations) {
      const country = combo.country;
      const plan = combo.plan || 'monthly';

      logger.info({ country, plan }, 'Computing elasticity for country/plan');

      // Aggregate price-demand data
      const { price_points, demand } = await aggregatePriceDemand(country, plan, 12);

      if (price_points.length < 2) {
        logger.warn({ country, plan }, 'Insufficient data for elasticity computation');
        continue;
      }

      // Compute elasticity
      const elasticity = computeLogLogElasticity(price_points, demand);

      // Upsert result
      await db
        .insert(elasticityResults)
        .values({
          country: country || null,
          plan,
          price_points,
          demand,
          elasticity: elasticity.toString(),
          updated_at: new Date(),
        })
        .onConflictDoUpdate({
          target: [elasticityResults.country, elasticityResults.plan],
          set: {
            price_points,
            demand,
            elasticity: elasticity.toString(),
            updated_at: new Date(),
          },
        });

      logger.info({ country, plan, elasticity }, 'Elasticity computed');
    }

    logger.info('Elasticity model computation completed');
  } catch (error) {
    logger.error({ error }, 'Error computing elasticity models');
    throw error;
  }
}
