// @ts-nocheck
/**
 * Partner Conversion Webhook Handler
 *
 * Handles conversion webhooks from partners (server-to-server)
 * Idempotent by order_id, HMAC signed, respects attribution windows
 */
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { db } from '../db/index';
import { partners, clicks, conversions } from '../db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';
import { verifyConversionWebhookSignature } from '../auth/partner';
import { logger } from '../observability/index';
const conversionWebhookSchema = z.object({
    order_id: z.string(),
    partner_id: z.string().uuid().optional(), // Can be inferred from auth
    campaign_id: z.string().uuid().optional(),
    sku: z.string().optional(),
    amount_cents: z.number().int().positive(),
    currency: z.string().length(3).default('USD'),
    timestamp: z.string().datetime().optional(),
    meta: z.record(z.unknown()).optional(),
});
/**
 * POST /api/partner/convert
 * Record a conversion (HMAC signed, idempotent)
 */
export async function POST(request) {
    try {
        // Get raw body for HMAC verification
        const rawBody = await request.text();
        const body = JSON.parse(rawBody);
        // Get HMAC signature from headers
        const signature = request.headers.get('x-signature');
        const timestamp = request.headers.get('x-timestamp');
        if (!signature || !timestamp) {
            return NextResponse.json({ error: 'Missing signature or timestamp' }, { status: 401 });
        }
        // Verify HMAC signature
        if (!verifyConversionWebhookSignature(rawBody, signature, timestamp)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
        // Parse and validate payload
        const data = conversionWebhookSchema.parse(body);
        // Get partner from auth or payload
        let partnerId = data.partner_id;
        if (!partnerId) {
            // Try to get from auth
            const { getPartnerAuth } = await import('../auth/partner');
            const partnerAuth = await getPartnerAuth(request);
            if (partnerAuth) {
                partnerId = partnerAuth.partner.id;
            }
        }
        if (!partnerId) {
            return NextResponse.json({ error: 'Partner ID required' }, { status: 400 });
        }
        // Check if conversion already exists (idempotency)
        const [existing] = await db
            .select()
            .from(conversions)
            .where(and(eq(conversions.partner_id, partnerId), eq(conversions.order_id, data.order_id)))
            .limit(1);
        if (existing) {
            return NextResponse.json({
                conversion_id: existing.id,
                message: 'Conversion already recorded',
            });
        }
        // Get partner for attribution window
        const [partner] = await db
            .select()
            .from(partners)
            .where(eq(partners.id, partnerId))
            .limit(1);
        if (!partner || partner.status !== 'active') {
            return NextResponse.json({ error: 'Partner not found or inactive' }, { status: 404 });
        }
        const attributionWindowDays = partner.attribution_window_days || 7;
        const windowStart = new Date();
        windowStart.setDate(windowStart.getDate() - attributionWindowDays);
        // Find associated click within attribution window (last-click attribution)
        let clickId = null;
        if (data.campaign_id) {
            // Find most recent click for this campaign
            const [click] = await db
                .select()
                .from(clicks)
                .where(and(eq(clicks.partner_id, partnerId), eq(clicks.campaign_id, data.campaign_id), gte(clicks.ts, windowStart)))
                .orderBy(desc(clicks.ts))
                .limit(1);
            if (click) {
                clickId = click.id;
            }
        }
        else {
            // Find most recent click for this partner/SKU
            const [click] = await db
                .select()
                .from(clicks)
                .where(and(eq(clicks.partner_id, partnerId), data.sku ? eq(clicks.sku, data.sku) : undefined, gte(clicks.ts, windowStart)))
                .orderBy(desc(clicks.ts))
                .limit(1);
            if (click) {
                clickId = click.id;
            }
        }
        // Create conversion
        const [conversion] = await db
            .insert(conversions)
            .values({
            partner_id: partnerId,
            campaign_id: data.campaign_id || null,
            order_id: data.order_id,
            sku: data.sku || null,
            amount_cents: data.amount_cents,
            currency: data.currency,
            attribution: 'last_click',
            click_id: clickId,
            meta: data.meta || {},
            ts: data.timestamp ? new Date(data.timestamp) : new Date(),
        })
            .returning();
        logger.info({ conversion_id: conversion.id, partner_id: partnerId, order_id: data.order_id }, 'Conversion recorded');
        return NextResponse.json({
            conversion_id: conversion.id,
            click_id: clickId,
            message: 'Conversion recorded successfully',
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
        }
        logger.error({ error }, 'Conversion webhook error');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
