// @ts-nocheck
/**
 * Payout Runner
 *
 * Computes partner payouts for a period, handles Stripe Connect transfers,
 * multi-currency conversion, rounding, and refund/chargeback handling
 */
import Stripe from 'stripe';
import { db } from '../db/index';
import { partners, conversions, payouts, transactions } from '../db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { logger } from '../observability/index';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-11-20.acacia',
});
const CONNECT_PLATFORM_FEE_PCT = parseFloat(process.env.CONNECT_PLATFORM_FEE_PCT || '0.10');
const AFFILIATE_DEFAULT_SHARE_PCT = parseFloat(process.env.AFFILIATE_DEFAULT_SHARE_PCT || '0.10');
/**
 * Currency exchange rates (fallback if API unavailable)
 */
const DEFAULT_EXCHANGE_RATES = {
    USD: 1.0,
    EUR: 0.92,
    GBP: 0.79,
    CAD: 1.35,
    AUD: 1.51,
    JPY: 149.0,
};
/**
 * Get exchange rate for currency
 */
async function getExchangeRate(from, to = 'USD') {
    if (from === to)
        return 1.0;
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    if (apiKey) {
        try {
            const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
            const data = await response.json();
            return data.rates?.[to] || DEFAULT_EXCHANGE_RATES[to] / DEFAULT_EXCHANGE_RATES[from];
        }
        catch (error) {
            logger.warn({ error, from, to }, 'Exchange rate API failed, using fallback');
        }
    }
    // Fallback to default rates
    return DEFAULT_EXCHANGE_RATES[to] / DEFAULT_EXCHANGE_RATES[from];
}
/**
 * Run payout cycle for a period
 */
export async function runPayoutCycle(periodStart, periodEnd, partnerId) {
    let processed = 0;
    let failed = 0;
    let totalPayoutCents = 0;
    // Get active partners
    let partnersQuery = db
        .select()
        .from(partners)
        .where(eq(partners.status, 'active'));
    if (partnerId) {
        partnersQuery = partnersQuery.where(eq(partners.id, partnerId));
    }
    const activePartners = await partnersQuery;
    for (const partner of activePartners) {
        try {
            const payout = await computePartnerPayout(partner.id, periodStart, periodEnd);
            if (!payout || payout.payout_cents <= 0) {
                logger.info({ partner_id: partner.id, period: { periodStart, periodEnd } }, 'No payout for partner');
                continue;
            }
            // Check if payout already exists
            const [existing] = await db
                .select()
                .from(payouts)
                .where(and(eq(payouts.partner_id, partner.id), eq(payouts.period_start, periodStart.toISOString().split('T')[0]), eq(payouts.period_end, periodEnd.toISOString().split('T')[0])))
                .limit(1);
            if (existing) {
                logger.info({ payout_id: existing.id }, 'Payout already exists');
                continue;
            }
            // Create payout record
            const [payoutRecord] = await db
                .insert(payouts)
                .values({
                partner_id: partner.id,
                period_start: periodStart.toISOString().split('T')[0],
                period_end: periodEnd.toISOString().split('T')[0],
                revenue_cents: payout.revenue_cents,
                share_pct: payout.share_pct,
                payout_cents: payout.payout_cents,
                currency: payout.currency,
                status: 'pending',
            })
                .returning();
            // Execute Stripe Connect transfer if partner has Connect account
            if (partner.stripe_connect_id) {
                try {
                    // Convert to partner's currency if needed
                    let transferAmount = payout.payout_cents;
                    if (payout.currency !== 'USD') {
                        const rate = await getExchangeRate('USD', payout.currency);
                        transferAmount = Math.round(transferAmount * rate);
                    }
                    const transfer = await stripe.transfers.create({
                        amount: transferAmount,
                        currency: payout.currency.toLowerCase(),
                        destination: partner.stripe_connect_id,
                        metadata: {
                            partner_id: partner.id,
                            period_start: periodStart.toISOString(),
                            period_end: periodEnd.toISOString(),
                            payout_id: payoutRecord.id,
                        },
                    });
                    // Update payout with transfer ID
                    await db
                        .update(payouts)
                        .set({
                        stripe_transfer_id: transfer.id,
                        status: 'paid',
                    })
                        .where(eq(payouts.id, payoutRecord.id));
                    logger.info({ payout_id: payoutRecord.id, transfer_id: transfer.id }, 'Payout transferred');
                }
                catch (error) {
                    logger.error({ error, payout_id: payoutRecord.id }, 'Stripe transfer failed');
                    await db
                        .update(payouts)
                        .set({ status: 'failed' })
                        .where(eq(payouts.id, payoutRecord.id));
                    failed++;
                    continue;
                }
            }
            else {
                // Mark as in_review (manual processing needed)
                await db
                    .update(payouts)
                    .set({ status: 'in_review' })
                    .where(eq(payouts.id, payoutRecord.id));
            }
            processed++;
            totalPayoutCents += payout.payout_cents;
        }
        catch (error) {
            logger.error({ error, partner_id: partner.id }, 'Payout computation failed');
            failed++;
        }
    }
    return { processed, failed, totalPayoutCents };
}
/**
 * Compute payout for a partner for a period
 */
async function computePartnerPayout(partnerId, periodStart, periodEnd) {
    // Get partner
    const [partner] = await db
        .select()
        .from(partners)
        .where(eq(partners.id, partnerId))
        .limit(1);
    if (!partner) {
        return null;
    }
    // Get conversions for period
    const periodConversions = await db
        .select({
        amount_cents: conversions.amount_cents,
        currency: conversions.currency,
    })
        .from(conversions)
        .where(and(eq(conversions.partner_id, partnerId), gte(conversions.ts, periodStart), lte(conversions.ts, periodEnd)));
    // Get refunds/chargebacks (would come from transactions table)
    const periodRefunds = await db
        .select({
        amount_cents: sql `SUM(${transactions.amount_cents})`,
    })
        .from(transactions)
        .where(and(eq(transactions.status, 'refunded'), gte(transactions.ts, periodStart), lte(transactions.ts, periodEnd)));
    // Calculate total revenue (sum all conversions, convert to USD)
    let totalRevenueCents = 0;
    for (const conv of periodConversions) {
        const amountCents = Number(conv.amount_cents);
        if (conv.currency !== 'USD') {
            const rate = await getExchangeRate(conv.currency, 'USD');
            totalRevenueCents += Math.round(amountCents * rate);
        }
        else {
            totalRevenueCents += amountCents;
        }
    }
    // Subtract refunds
    const refundAmount = Number(periodRefunds[0]?.amount_cents || 0);
    totalRevenueCents = Math.max(0, totalRevenueCents - refundAmount);
    if (totalRevenueCents === 0) {
        return null;
    }
    // Get revenue share percentage
    const sharePct = Number(partner.revenue_share_pct || AFFILIATE_DEFAULT_SHARE_PCT);
    // Calculate payout (before platform fee)
    const payoutBeforeFee = Math.round(totalRevenueCents * sharePct);
    // Apply platform fee
    const payoutCents = Math.round(payoutBeforeFee * (1 - CONNECT_PLATFORM_FEE_PCT));
    return {
        revenue_cents: totalRevenueCents,
        share_pct: sharePct,
        payout_cents: payoutCents,
        currency: 'USD', // Payouts in USD, converted during transfer
    };
}
/**
 * Admin endpoint to run payout cycle
 */
export async function runPayoutCycleHandler(periodStart, periodEnd, partnerId) {
    const start = periodStart ? new Date(periodStart) : new Date();
    start.setDate(start.getDate() - 14); // Default to 14 days ago
    const end = periodEnd ? new Date(periodEnd) : new Date();
    const result = await runPayoutCycle(start, end, partnerId);
    return result;
}
