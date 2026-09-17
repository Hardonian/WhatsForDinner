// @ts-nocheck
/**
 * Partner API Routes
 *
 * Handles partner authentication, catalog sync, campaigns, links, reports
 */
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { db } from '../db/index';
import { catalogFeeds, catalogItems, campaigns, clicks, conversions, payouts } from '../db/schema';
import { eq, and, gte, lte, desc, sql, count } from 'drizzle-orm';
import { getPartnerAuth, mintPartnerToken } from '../auth/partner';
import { generateSignedLink } from '../partners/links';
import { parseCSVFeed } from '../partners/catalog/csv';
import { parseXMLFeed } from '../partners/catalog/xml';
import { fetchAPIFeed } from '../partners/catalog/api';
import { logger } from '../observability/index';
// ============================================================================
// SCHEMAS
// ============================================================================
const partnerTokenSchema = z.object({
    partner_id: z.string().uuid(),
    scopes: z.array(z.string()).optional(),
});
const catalogSyncSchema = z.object({
    feed_id: z.string().uuid().optional(),
    source: z.enum(['api', 's3', 'csv', 'xml']).optional(),
    url: z.string().url().optional(),
    content: z.string().optional(), // For direct CSV/XML content
});
const campaignCreateSchema = z.object({
    name: z.string().min(1),
    kind: z.enum(['sponsored_tile', 'banner', 'recipe_pin', 'search_boost']),
    start_at: z.string().datetime(),
    end_at: z.string().datetime().optional(),
    budget_cents: z.number().int().positive(),
    currency: z.string().length(3).default('USD'),
    cpm_cents: z.number().int().optional(),
    cpc_cents: z.number().int().optional(),
    cpa_cents: z.number().int().optional(),
    cap_daily: z.number().int().optional(),
    targeting: z.record(z.unknown()).optional(),
});
const linkCreateSchema = z.object({
    sku: z.string().optional(),
    kind: z.enum(['affiliate', 'deeplink', 'cart']),
    destination_url: z.string().url(),
    expires_in_hours: z.number().int().positive().optional(),
    meta: z.record(z.unknown()).optional(),
});
const conversionSchema = z.object({
    order_id: z.string(),
    sku: z.string().optional(),
    amount_cents: z.number().int().positive(),
    currency: z.string().length(3).default('USD'),
    attribution: z.enum(['last_click', 'first_click', 'multi']).default('last_click'),
    meta: z.record(z.unknown()).optional(),
});
// ============================================================================
// AUTH ROUTES
// ============================================================================
/**
 * POST /api/partner/auth/token (admin only)
 * Mint a partner JWT token
 */
export async function POST_AUTH_TOKEN(request) {
    try {
        // Admin check (in real implementation, check admin role)
        const auth = await getPartnerAuth(request);
        if (!auth) {
            // Try user auth for admin
            const { getAuthContext } = await import('../auth/index');
            const userAuth = await getAuthContext(request);
            if (userAuth?.user.role !== 'admin') {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }
        const body = await request.json();
        const data = partnerTokenSchema.parse(body);
        const token = await mintPartnerToken(data.partner_id, data.scopes);
        return NextResponse.json({ token }, { status: 200 });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
        }
        logger.error({ error }, 'Partner token mint error');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
// ============================================================================
// CATALOG ROUTES
// ============================================================================
/**
 * POST /api/partner/catalog/sync
 * Trigger catalog sync for a feed
 */
export async function POST_CATALOG_SYNC(request) {
    try {
        const partnerAuth = await getPartnerAuth(request);
        if (!partnerAuth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Check scope
        const scopes = partnerAuth.scopes || [];
        if (!scopes.includes('catalog:push') && !scopes.includes('*')) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }
        const body = await request.json();
        const data = catalogSyncSchema.parse(body);
        let items = [];
        // Fetch and parse feed
        if (data.feed_id) {
            const [feed] = await db
                .select()
                .from(catalogFeeds)
                .where(and(eq(catalogFeeds.id, data.feed_id), eq(catalogFeeds.partner_id, partnerAuth.partner.id)))
                .limit(1);
            if (!feed) {
                return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
            }
            if (feed.source === 'csv' && data.content) {
                items = parseCSVFeed(data.content);
            }
            else if (feed.source === 'xml' && data.content) {
                items = parseXMLFeed(data.content);
            }
            else if (feed.source === 'api' && feed.url) {
                items = await fetchAPIFeed({ url: feed.url });
            }
            else if (feed.url) {
                const response = await fetch(feed.url);
                const content = await response.text();
                if (feed.source === 'csv') {
                    items = parseCSVFeed(content);
                }
                else if (feed.source === 'xml') {
                    items = parseXMLFeed(content);
                }
            }
        }
        else if (data.source && data.content) {
            // Direct content sync
            if (data.source === 'csv') {
                items = parseCSVFeed(data.content);
            }
            else if (data.source === 'xml') {
                items = parseXMLFeed(data.content);
            }
        }
        else if (data.source === 'api' && data.url) {
            items = await fetchAPIFeed({ url: data.url });
        }
        else {
            return NextResponse.json({ error: 'Invalid sync request' }, { status: 400 });
        }
        // Upsert catalog items
        let synced = 0;
        let errors = 0;
        for (const item of items) {
            try {
                await db
                    .insert(catalogItems)
                    .values({
                    partner_id: partnerAuth.partner.id,
                    sku: item.sku,
                    title: item.title,
                    brand: item.brand || null,
                    url: item.url,
                    image_url: item.image_url || null,
                    price_cents: item.price_cents || null,
                    currency: item.currency,
                    availability: item.availability,
                    tags: item.tags || [],
                    affiliateable: true,
                })
                    .onConflictDoUpdate({
                    target: [catalogItems.partner_id, catalogItems.sku],
                    set: {
                        title: sql `EXCLUDED.title`,
                        brand: sql `EXCLUDED.brand`,
                        url: sql `EXCLUDED.url`,
                        image_url: sql `EXCLUDED.image_url`,
                        price_cents: sql `EXCLUDED.price_cents`,
                        currency: sql `EXCLUDED.currency`,
                        availability: sql `EXCLUDED.availability`,
                        tags: sql `EXCLUDED.tags`,
                        updated_at: sql `now()`,
                    },
                });
                synced++;
            }
            catch (error) {
                errors++;
                logger.warn({ error, item }, 'Failed to sync catalog item');
            }
        }
        // Update feed status
        if (data.feed_id) {
            await db
                .update(catalogFeeds)
                .set({
                last_sync_at: new Date(),
                status: errors > 0 ? 'partial' : 'success',
            })
                .where(eq(catalogFeeds.id, data.feed_id));
        }
        return NextResponse.json({
            synced,
            errors,
            total: items.length,
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
        }
        logger.error({ error }, 'Catalog sync error');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
// ============================================================================
// CAMPAIGN ROUTES
// ============================================================================
/**
 * POST /api/partner/campaigns
 * Create a new campaign
 */
export async function POST_CAMPAIGNS(request) {
    try {
        const partnerAuth = await getPartnerAuth(request);
        if (!partnerAuth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const scopes = partnerAuth.scopes || [];
        if (!scopes.includes('campaign:write') && !scopes.includes('*')) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }
        const body = await request.json();
        const data = campaignCreateSchema.parse(body);
        const [campaign] = await db
            .insert(campaigns)
            .values({
            partner_id: partnerAuth.partner.id,
            name: data.name,
            kind: data.kind,
            start_at: new Date(data.start_at),
            end_at: data.end_at ? new Date(data.end_at) : null,
            budget_cents: data.budget_cents,
            currency: data.currency,
            cpm_cents: data.cpm_cents || null,
            cpc_cents: data.cpc_cents || null,
            cpa_cents: data.cpa_cents || null,
            cap_daily: data.cap_daily || null,
            targeting: data.targeting || {},
            status: 'draft',
        })
            .returning();
        return NextResponse.json(campaign);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
        }
        logger.error({ error }, 'Campaign creation error');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
/**
 * GET /api/partner/campaigns
 * List campaigns
 */
export async function GET_CAMPAIGNS(request) {
    try {
        const partnerAuth = await getPartnerAuth(request);
        if (!partnerAuth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        let query = db
            .select()
            .from(campaigns)
            .where(eq(campaigns.partner_id, partnerAuth.partner.id));
        if (status) {
            query = query.where(eq(campaigns.status, status));
        }
        const results = await query.orderBy(desc(campaigns.created_at));
        return NextResponse.json({ campaigns: results });
    }
    catch (error) {
        logger.error({ error }, 'Campaigns list error');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
// ============================================================================
// LINK ROUTES
// ============================================================================
/**
 * POST /api/partner/links
 * Create a signed partner link
 */
export async function POST_LINKS(request) {
    try {
        const partnerAuth = await getPartnerAuth(request);
        if (!partnerAuth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const scopes = partnerAuth.scopes || [];
        if (!scopes.includes('links:create') && !scopes.includes('*')) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }
        const body = await request.json();
        const data = linkCreateSchema.parse(body);
        const link = await generateSignedLink({
            partner_id: partnerAuth.partner.id,
            sku: data.sku,
            kind: data.kind,
            destination_url: data.destination_url,
            expires_in_hours: data.expires_in_hours,
            meta: data.meta,
        });
        return NextResponse.json(link);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
        }
        logger.error({ error }, 'Link creation error');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
// ============================================================================
// REPORT ROUTES
// ============================================================================
/**
 * GET /api/partner/reports/summary
 * Get summary reports (impressions, clicks, conversions, spend, ROAS)
 */
export async function GET_REPORTS_SUMMARY(request) {
    try {
        const partnerAuth = await getPartnerAuth(request);
        if (!partnerAuth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const scopes = partnerAuth.scopes || [];
        if (!scopes.includes('report:read') && !scopes.includes('*')) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }
        const { searchParams } = new URL(request.url);
        const from = searchParams.get('from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const to = searchParams.get('to') || new Date().toISOString();
        const campaignId = searchParams.get('campaign_id');
        // Get clicks
        let clicksQuery = db
            .select({ count: count() })
            .from(clicks)
            .where(and(eq(clicks.partner_id, partnerAuth.partner.id), gte(clicks.ts, new Date(from)), lte(clicks.ts, new Date(to))));
        if (campaignId) {
            clicksQuery = clicksQuery.where(eq(clicks.campaign_id, campaignId));
        }
        const [{ count: clicksCount }] = await clicksQuery;
        // Get conversions
        let conversionsQuery = db
            .select({
            count: count(),
            total_amount: sql `COALESCE(SUM(${conversions.amount_cents}), 0)`,
        })
            .from(conversions)
            .where(and(eq(conversions.partner_id, partnerAuth.partner.id), gte(conversions.ts, new Date(from)), lte(conversions.ts, new Date(to))));
        if (campaignId) {
            conversionsQuery = conversionsQuery.where(eq(conversions.campaign_id, campaignId));
        }
        const [{ count: conversionsCount, total_amount }] = await conversionsQuery;
        // Get spend from campaigns
        let spendQuery = db
            .select({ total_spent: sql `COALESCE(SUM(${campaigns.spent_cents}), 0)` })
            .from(campaigns)
            .where(eq(campaigns.partner_id, partnerAuth.partner.id));
        if (campaignId) {
            spendQuery = spendQuery.where(eq(campaigns.id, campaignId));
        }
        const [{ total_spent }] = await spendQuery;
        // Calculate metrics
        const clickCount = Number(clicksCount);
        const conversionCount = Number(conversionsCount);
        const revenueCents = Number(total_amount || 0);
        const spendCents = Number(total_spent || 0);
        const ctr = clickCount > 0 ? (conversionCount / clickCount) : 0;
        const cvr = clickCount > 0 ? (conversionCount / clickCount) : 0;
        const roas = spendCents > 0 ? (revenueCents / spendCents) : 0;
        return NextResponse.json({
            period: { from, to },
            clicks: clickCount,
            conversions: conversionCount,
            revenue_cents: revenueCents,
            spend_cents: spendCents,
            ctr,
            cvr,
            roas,
        });
    }
    catch (error) {
        logger.error({ error }, 'Reports error');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
/**
 * GET /api/partner/payouts
 * List payout statements
 */
export async function GET_PAYOUTS(request) {
    try {
        const partnerAuth = await getPartnerAuth(request);
        if (!partnerAuth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const results = await db
            .select()
            .from(payouts)
            .where(eq(payouts.partner_id, partnerAuth.partner.id))
            .orderBy(desc(payouts.period_start));
        return NextResponse.json({ payouts: results });
    }
    catch (error) {
        logger.error({ error }, 'Payouts list error');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
