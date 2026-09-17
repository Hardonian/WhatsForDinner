// @ts-nocheck
/**
 * Audit Logging System
 *
 * Immutable audit logs with cryptographic signatures for tamper detection
 */
import crypto from 'crypto';
import { db } from '../db/index';
import { auditLogs } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { logger } from '../observability/index';
const AUDIT_SECRET = process.env.AUDIT_SECRET || process.env.ADMIN_JWT_SECRET || '';
const AUDIT_SALT = process.env.AUDIT_SALT || 'nomad-audit-salt';
/**
 * Compute signature for audit log entry
 */
function computeSignature(entry, timestamp) {
    const payload = {
        actor_id: entry.actorId,
        entity_kind: entry.entityKind,
        entity_id: entry.entityId || '',
        action: entry.action,
        before: entry.before || {},
        after: entry.after || {},
        reason: entry.reason || '',
        ts: timestamp.toISOString(),
    };
    const payloadStr = JSON.stringify(payload, Object.keys(payload).sort());
    const hash = crypto
        .createHmac('sha256', AUDIT_SECRET + AUDIT_SALT)
        .update(payloadStr)
        .digest('hex');
    return hash;
}
/**
 * Log an audit action
 */
export async function logAction(actorId, entityKind, action, options = {}) {
    if (!AUDIT_SECRET) {
        logger.warn('AUDIT_SECRET not set, audit logs will not be signed');
    }
    const timestamp = new Date();
    const entry = {
        actorId,
        entityKind,
        entityId: options.entityId,
        action,
        before: options.before,
        after: options.after,
        reason: options.reason,
    };
    const signature = computeSignature(entry, timestamp);
    try {
        const [log] = await db
            .insert(auditLogs)
            .values({
            actor_id: actorId,
            entity_kind: entityKind,
            entity_id: options.entityId || null,
            action,
            before: options.before || null,
            after: options.after || null,
            reason: options.reason || null,
            ts: timestamp,
            signature,
        })
            .returning();
        // Emit SIEM event if configured
        const siemEndpoint = process.env.SIEM_ENDPOINT;
        if (siemEndpoint) {
            try {
                await fetch(siemEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'audit_log',
                        timestamp: timestamp.toISOString(),
                        actor_id: actorId,
                        entity_kind: entityKind,
                        action,
                        signature,
                    }),
                }).catch((err) => {
                    logger.warn({ error: err }, 'Failed to send SIEM event');
                });
            }
            catch (error) {
                // Non-blocking SIEM logging
                logger.warn({ error }, 'SIEM logging failed');
            }
        }
        return log.id;
    }
    catch (error) {
        logger.error({ error, entry }, 'Failed to write audit log');
        throw new Error('Audit log write failed');
    }
}
/**
 * Verify audit log signature
 */
export async function verifyAuditLogSignature(logId) {
    const [log] = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.id, logId))
        .limit(1);
    if (!log) {
        return false;
    }
    const entry = {
        actorId: log.actor_id || '',
        entityKind: log.entity_kind,
        entityId: log.entity_id || undefined,
        action: log.action,
        before: log.before || undefined,
        after: log.after || undefined,
        reason: log.reason || undefined,
    };
    const expectedSignature = computeSignature(entry, log.ts);
    return crypto.timingSafeEqual(Buffer.from(log.signature), Buffer.from(expectedSignature));
}
/**
 * Background task to verify all audit log signatures
 */
export async function verifyAllAuditLogs() {
    const allLogs = await db.select().from(auditLogs);
    let valid = 0;
    let invalid = 0;
    const invalidIds = [];
    for (const log of allLogs) {
        const isValid = await verifyAuditLogSignature(log.id);
        if (isValid) {
            valid++;
        }
        else {
            invalid++;
            invalidIds.push(log.id);
        }
    }
    if (invalid > 0) {
        logger.error({ invalid, invalidIds: invalidIds.slice(0, 10) }, 'Audit log tampering detected!');
    }
    return {
        total: allLogs.length,
        valid,
        invalid,
        invalidIds,
    };
}
/**
 * Get audit logs with pagination
 */
export async function getAuditLogs(params) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const offset = (page - 1) * limit;
    let query = db.select().from(auditLogs);
    // Apply filters
    if (params.actorId) {
        query = query.where(eq(auditLogs.actor_id, params.actorId));
    }
    if (params.entityKind) {
        // Note: This would need proper filtering implementation
        // For now, simplified
    }
    const results = await query
        .orderBy(desc(auditLogs.ts))
        .limit(limit)
        .offset(offset);
    const countResult = await db
        .select({ count: sql `count(*)` })
        .from(auditLogs);
    const total = Number(countResult[0]?.count || 0);
    return {
        data: results,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}
