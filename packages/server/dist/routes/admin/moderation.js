// @ts-nocheck
/**
 * Admin Moderation API Routes
 *
 * Handles moderation queue: assign, resolve, list, approve/reject campaigns & creatives
 */
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { db } from '../../db/index';
import { moderationQueue, campaigns, creatives, partners, adminUsers, } from '../../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getAdminAuth } from '../../auth/admin';
import { logAction } from '../../audit/index';
import { logger } from '../../observability/index';
// ============================================================================
// SCHEMAS
// ============================================================================
const moderationAssignSchema = z.object({
    queue_id: z.string().uuid(),
    admin_id: z.string().uuid(),
});
const moderationResolveSchema = z.object({
    queue_id: z.string().uuid(),
    action: z.enum(['approve', 'reject']),
    notes: z.string().optional(),
});
const moderationCreateSchema = z.object({
    entity_kind: z.enum(['campaign', 'creative', 'partner', 'message']),
    entity_id: z.string().uuid(),
    priority: z.enum(['low', 'normal', 'high']).default('normal'),
    flag_reason: z.string(),
});
// ============================================================================
// ROUTES
// ============================================================================
/**
 * GET /api/admin/moderation/queue
 * List moderation queue items
 */
export async function GET_MODERATION_QUEUE(request) {
    try {
        const adminAuth = await getAdminAuth(request);
        if (!adminAuth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Check permission
        if (adminAuth.admin.role !== 'superadmin' &&
            adminAuth.admin.role !== 'reviewer') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const entityKind = searchParams.get('entity_kind');
        const priority = searchParams.get('priority');
        const assignedTo = searchParams.get('assigned_to');
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const offset = (page - 1) * limit;
        let query = db
            .select({
            queue: moderationQueue,
            assignedAdmin: adminUsers,
        })
            .from(moderationQueue)
            .leftJoin(adminUsers, eq(moderationQueue.assigned_to, adminUsers.id));
        const conditions = [];
        if (status) {
            conditions.push(eq(moderationQueue.status, status));
        }
        if (entityKind) {
            conditions.push(eq(moderationQueue.entity_kind, entityKind));
        }
        if (priority) {
            conditions.push(eq(moderationQueue.priority, priority));
        }
        if (assignedTo) {
            conditions.push(eq(moderationQueue.assigned_to, assignedTo));
        }
        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }
        const results = await query
            .orderBy(desc(moderationQueue.created_at))
            .limit(limit)
            .offset(offset);
        // Get total count
        const countQuery = db
            .select({ count: sql `count(*)` })
            .from(moderationQueue);
        if (conditions.length > 0) {
            countQuery.where(and(...conditions));
        }
        const [{ count: total }] = await countQuery;
        // Enrich with entity details
        const enriched = await Promise.all(results.map(async (item) => {
            let entity = null;
            try {
                if (item.queue.entity_kind === 'campaign') {
                    const [campaign] = await db
                        .select()
                        .from(campaigns)
                        .where(eq(campaigns.id, item.queue.entity_id))
                        .limit(1);
                    entity = campaign;
                }
                else if (item.queue.entity_kind === 'creative') {
                    const [creative] = await db
                        .select()
                        .from(creatives)
                        .where(eq(creatives.id, item.queue.entity_id))
                        .limit(1);
                    entity = creative;
                }
                else if (item.queue.entity_kind === 'partner') {
                    const [partner] = await db
                        .select()
                        .from(partners)
                        .where(eq(partners.id, item.queue.entity_id))
                        .limit(1);
                    entity = partner;
                }
            }
            catch (error) {
                logger.warn({ error, entity_id: item.queue.entity_id }, 'Failed to fetch entity');
            }
            return {
                ...item.queue,
                assigned_admin: item.assignedAdmin,
                entity,
            };
        }));
        return NextResponse.json({
            items: enriched,
            pagination: {
                page,
                limit,
                total: Number(total),
                totalPages: Math.ceil(Number(total) / limit),
            },
        });
    }
    catch (error) {
        logger.error({ error }, 'Moderation queue error');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
/**
 * POST /api/admin/moderation/assign
 * Assign moderation item to admin
 */
export async function POST_MODERATION_ASSIGN(request) {
    try {
        const adminAuth = await getAdminAuth(request);
        if (!adminAuth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (adminAuth.admin.role !== 'superadmin' &&
            adminAuth.admin.role !== 'reviewer') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }
        const body = await request.json();
        const data = moderationAssignSchema.parse(body);
        const [updated] = await db
            .update(moderationQueue)
            .set({
            assigned_to: data.admin_id,
            status: 'in_review',
            updated_at: new Date(),
        })
            .where(eq(moderationQueue.id, data.queue_id))
            .returning();
        if (!updated) {
            return NextResponse.json({ error: 'Queue item not found' }, { status: 404 });
        }
        await logAction(adminAuth.admin.id, 'moderation_queue', 'assign', {
            entityId: data.queue_id,
            after: { assigned_to: data.admin_id },
            reason: `Assigned to admin ${data.admin_id}`,
        });
        return NextResponse.json(updated);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
        }
        logger.error({ error }, 'Moderation assign error');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
/**
 * PATCH /api/admin/moderation/resolve
 * Resolve moderation item (approve/reject)
 */
export async function PATCH_MODERATION_RESOLVE(request) {
    try {
        const adminAuth = await getAdminAuth(request);
        if (!adminAuth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (adminAuth.admin.role !== 'superadmin' &&
            adminAuth.admin.role !== 'reviewer') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }
        const body = await request.json();
        const data = moderationResolveSchema.parse(body);
        // Get queue item
        const [queueItem] = await db
            .select()
            .from(moderationQueue)
            .where(eq(moderationQueue.id, data.queue_id))
            .limit(1);
        if (!queueItem) {
            return NextResponse.json({ error: 'Queue item not found' }, { status: 404 });
        }
        // Update entity status based on action
        if (data.action === 'approve') {
            if (queueItem.entity_kind === 'campaign') {
                await db
                    .update(campaigns)
                    .set({ status: 'running', updated_at: new Date() })
                    .where(eq(campaigns.id, queueItem.entity_id));
            }
            else if (queueItem.entity_kind === 'creative') {
                await db
                    .update(creatives)
                    .set({ status: 'approved', updated_at: new Date() })
                    .where(eq(creatives.id, queueItem.entity_id));
            }
        }
        else if (data.action === 'reject') {
            if (queueItem.entity_kind === 'campaign') {
                await db
                    .update(campaigns)
                    .set({ status: 'paused', updated_at: new Date() })
                    .where(eq(campaigns.id, queueItem.entity_id));
            }
            else if (queueItem.entity_kind === 'creative') {
                await db
                    .update(creatives)
                    .set({ status: 'rejected', updated_at: new Date() })
                    .where(eq(creatives.id, queueItem.entity_id));
            }
            // TODO: Send rejection email to partner
        }
        // Update queue item
        const [updated] = await db
            .update(moderationQueue)
            .set({
            status: 'resolved',
            notes: data.notes || queueItem.notes,
            updated_at: new Date(),
        })
            .where(eq(moderationQueue.id, data.queue_id))
            .returning();
        await logAction(adminAuth.admin.id, queueItem.entity_kind, data.action, {
            entityId: queueItem.entity_id,
            reason: data.notes || `Moderation ${data.action}`,
        });
        return NextResponse.json(updated);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
        }
        logger.error({ error }, 'Moderation resolve error');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
/**
 * POST /api/admin/moderation/create
 * Create moderation queue item (auto-flag)
 */
export async function POST_MODERATION_CREATE(request) {
    try {
        const adminAuth = await getAdminAuth(request);
        if (!adminAuth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const data = moderationCreateSchema.parse(body);
        // Check if already queued
        const [existing] = await db
            .select()
            .from(moderationQueue)
            .where(and(eq(moderationQueue.entity_kind, data.entity_kind), eq(moderationQueue.entity_id, data.entity_id), eq(moderationQueue.status, 'open')))
            .limit(1);
        if (existing) {
            return NextResponse.json(existing);
        }
        const [created] = await db
            .insert(moderationQueue)
            .values({
            entity_kind: data.entity_kind,
            entity_id: data.entity_id,
            priority: data.priority,
            flag_reason: data.flag_reason,
            status: 'open',
        })
            .returning();
        await logAction(adminAuth.admin.id, 'moderation_queue', 'create', {
            entityId: created.id,
            reason: `Auto-flagged: ${data.flag_reason}`,
        });
        return NextResponse.json(created, { status: 201 });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
        }
        logger.error({ error }, 'Moderation create error');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
