// @ts-nocheck
/**
 * Data Retention Policy Runner
 *
 * Automatically purges expired records based on retention policies
 */
import { db } from '../db/index';
import { retentionPolicies, clicks, conversions, events, auditLogs, processingActivities, legalHold } from '../db/schema';
import { eq, lt, sql } from 'drizzle-orm';
import { logger } from '../observability/index';
import { logAction } from '../audit/index';
const DRY_RUN = process.env.RETENTION_DRYRUN === 'true';
/**
 * Retention policy mapping to tables
 */
const POLICY_TABLES = {
    clicks: { table: clicks, dateColumn: 'ts' },
    conversions: { table: conversions, dateColumn: 'ts' },
    events: { table: events, dateColumn: 'ts' },
    audit_logs: { table: auditLogs, dateColumn: 'ts' },
    // Add more mappings as needed
};
/**
 * Check if data is under legal hold
 */
async function isUnderLegalHold(category, entityId) {
    const activeHolds = await db
        .select()
        .from(legalHold)
        .where(eq(legalHold.active, true));
    for (const hold of activeHolds) {
        if (hold.scope.includes(category) || (entityId && hold.scope.includes(entityId))) {
            return true;
        }
    }
    return false;
}
/**
 * Generate retention rules from processing activities
 */
async function syncProcessingActivityRetention() {
    const activities = await db.select().from(processingActivities);
    for (const activity of activities) {
        if (!activity.retention_days)
            continue;
        // Check if retention policy exists for this category
        const categoryName = `processing_${activity.name.toLowerCase().replace(/\s+/g, '_')}`;
        const [existing] = await db
            .select()
            .from(retentionPolicies)
            .where(eq(retentionPolicies.category, categoryName))
            .limit(1);
        if (!existing) {
            await db.insert(retentionPolicies).values({
                category: categoryName,
                days: activity.retention_days,
                auto_purge: true,
            });
            logger.info({ category: categoryName, days: activity.retention_days }, 'Retention policy created from processing activity');
        }
        else if (existing.days !== activity.retention_days) {
            await db
                .update(retentionPolicies)
                .set({ days: activity.retention_days, updated_at: new Date() })
                .where(eq(retentionPolicies.id, existing.id));
            logger.info({ category: categoryName, days: activity.retention_days }, 'Retention policy updated from processing activity');
        }
    }
}
/**
 * Run retention policies
 */
export async function runRetentionPolicies(dryRun = DRY_RUN) {
    // Sync retention rules from processing activities
    await syncProcessingActivityRetention();
    const policies = await db.select().from(retentionPolicies);
    let totalProcessed = 0;
    let totalDeleted = 0;
    let totalErrors = 0;
    const details = [];
    for (const policy of policies) {
        if (!policy.auto_purge) {
            logger.info({ category: policy.category }, 'Skipping policy (auto_purge disabled)');
            continue;
        }
        // Check legal hold
        const underHold = await isUnderLegalHold(policy.category);
        if (underHold) {
            logger.info({ category: policy.category }, 'Skipping policy (legal hold active)');
            continue;
        }
        try {
            const result = await purgeCategory(policy.category, policy.days, dryRun);
            totalProcessed++;
            totalDeleted += result.deleted;
            totalErrors += result.errors;
            details.push({
                category: policy.category,
                deleted: result.deleted,
                error: result.error,
            });
            // Update last_run_at
            if (!dryRun) {
                await db
                    .update(retentionPolicies)
                    .set({ last_run_at: new Date(), updated_at: new Date() })
                    .where(eq(retentionPolicies.id, policy.id));
            }
            logger.info({
                category: policy.category,
                deleted: result.deleted,
                dryRun,
            }, 'Retention policy executed');
        }
        catch (error) {
            totalErrors++;
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            details.push({
                category: policy.category,
                deleted: 0,
                error: errorMsg,
            });
            logger.error({ error, category: policy.category }, 'Retention policy error');
        }
    }
    // Log summary
    await logAction('system', 'retention_policy', 'run', {
        after: {
            processed: totalProcessed,
            deleted: totalDeleted,
            errors: totalErrors,
            dryRun,
        },
    }).catch(() => {
        // Non-blocking if audit log fails
    });
    return {
        processed: totalProcessed,
        deleted: totalDeleted,
        errors: totalErrors,
        details,
    };
}
/**
 * Purge records for a specific category
 */
async function purgeCategory(category, retentionDays, dryRun) {
    const tableConfig = POLICY_TABLES[category];
    if (!tableConfig) {
        return {
            deleted: 0,
            errors: 1,
            error: `Unknown category: ${category}`,
        };
    }
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    try {
        if (dryRun) {
            // Preview what would be deleted
            const [countResult] = await db
                .select({ count: sql `count(*)` })
                .from(tableConfig.table)
                .where(lt(sql.raw(tableConfig.dateColumn), cutoffDate));
            const count = Number(countResult?.count || 0);
            logger.info({
                category,
                cutoffDate,
                wouldDelete: count,
            }, 'Dry run: records to be deleted');
            return { deleted: count, errors: 0 };
        }
        // Actually delete
        const deleted = await db
            .delete(tableConfig.table)
            .where(lt(sql.raw(tableConfig.dateColumn), cutoffDate));
        // Get count (Drizzle doesn't return count directly, so we estimate)
        // In production, use RETURNING or separate count query
        const deletedCount = 0; // Would need proper implementation
        logger.info({
            category,
            cutoffDate,
            deleted: deletedCount,
        }, 'Records purged');
        return { deleted: deletedCount, errors: 0 };
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        logger.error({ error, category }, 'Purge category error');
        return { deleted: 0, errors: 1, error: errorMsg };
    }
}
/**
 * Get retention policy preview
 */
export async function getRetentionPreview(category, days) {
    const tableConfig = POLICY_TABLES[category];
    if (!tableConfig) {
        throw new Error(`Unknown category: ${category}`);
    }
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const [countResult] = await db
        .select({ count: sql `count(*)` })
        .from(tableConfig.table)
        .where(lt(sql.raw(tableConfig.dateColumn), cutoffDate));
    const oldestRecord = await db
        .select()
        .from(tableConfig.table)
        .orderBy(sql.raw(`${tableConfig.dateColumn} ASC`))
        .limit(1);
    return {
        category,
        retentionDays: days,
        cutoffDate: cutoffDate.toISOString(),
        recordsToDelete: Number(countResult?.count || 0),
        oldestRecord: oldestRecord[0] || null,
    };
}
/**
 * Initialize default retention policies
 */
export async function initializeDefaultPolicies() {
    const defaults = [
        { category: 'clicks', days: 365, auto_purge: true },
        { category: 'conversions', days: 730, auto_purge: true },
        { category: 'events', days: 180, auto_purge: true },
        { category: 'audit_logs', days: 1825, auto_purge: false }, // 5 years, manual purge
    ];
    for (const policy of defaults) {
        const [existing] = await db
            .select()
            .from(retentionPolicies)
            .where(eq(retentionPolicies.category, policy.category))
            .limit(1);
        if (!existing) {
            await db.insert(retentionPolicies).values(policy);
            logger.info({ category: policy.category }, 'Default retention policy created');
        }
    }
}
