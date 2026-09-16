// @ts-nocheck
/**
 * Admin Ops & Trust Center Tests
 * 
 * Tests for audit integrity, RBAC, moderation workflow, and retention policies
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../db/index';
import {
  adminUsers,
  auditLogs,
  moderationQueue,
  incidents,
  retentionPolicies,
} from '../db/schema';
import { eq } from 'drizzle-orm';
import {
  mintAdminToken,
  verifyAdminJWT,
  hasRole,
  canPerformAction,
} from '../auth/admin';
import { logAction, verifyAuditLogSignature } from '../audit/index';
import {
  createIncident,
  addTimelineEntry,
} from '../incidents/service';
import { runRetentionPolicies } from '../jobs/retentionRunner';

describe('Admin Auth & RBAC', () => {
  let superadminId: string;
  let reviewerId: string;
  let supportId: string;

  beforeAll(async () => {
    // Create test admin users
    const [superadmin] = await db
      .insert(adminUsers)
      .values({
        email: 'superadmin@test.com',
        role: 'superadmin',
        status: 'active',
      })
      .returning();

    const [reviewer] = await db
      .insert(adminUsers)
      .values({
        email: 'reviewer@test.com',
        role: 'reviewer',
        status: 'active',
      })
      .returning();

    const [support] = await db
      .insert(adminUsers)
      .values({
        email: 'support@test.com',
        role: 'support',
        status: 'active',
      })
      .returning();

    superadminId = superadmin.id;
    reviewerId = reviewer.id;
    supportId = support.id;
  });

  afterAll(async () => {
    // Cleanup
    await db.delete(adminUsers).where(eq(adminUsers.id, superadminId));
    await db.delete(adminUsers).where(eq(adminUsers.id, reviewerId));
    await db.delete(adminUsers).where(eq(adminUsers.id, supportId));
  });

  it('should mint and verify admin token', async () => {
    const token = await mintAdminToken(superadminId);
    expect(token).toBeDefined();

    const auth = await verifyAdminJWT(token);
    expect(auth).toBeDefined();
    expect(auth?.admin.id).toBe(superadminId);
    expect(auth?.admin.role).toBe('superadmin');
  });

  it('should enforce role hierarchy', () => {
    expect(hasRole('superadmin', 'reviewer')).toBe(true);
    expect(hasRole('reviewer', 'finance')).toBe(false);
    expect(hasRole('support', 'reviewer')).toBe(false);
  });

  it('should check permissions', () => {
    expect(canPerformAction('superadmin', 'any:action')).toBe(true);
    expect(canPerformAction('finance', 'payout:approve')).toBe(true);
    expect(canPerformAction('reviewer', 'campaign:approve')).toBe(true);
    expect(canPerformAction('support', 'incident:create')).toBe(true);
    expect(canPerformAction('support', 'campaign:approve')).toBe(false);
  });
});

describe('Audit Logging', () => {
  let adminId: string;
  let logId: string;

  beforeAll(async () => {
    const [admin] = await db
      .insert(adminUsers)
      .values({
        email: 'audit-test@test.com',
        role: 'superadmin',
        status: 'active',
      })
      .returning();
    adminId = admin.id;
  });

  afterAll(async () => {
    if (logId) {
      await db.delete(auditLogs).where(eq(auditLogs.id, logId));
    }
    await db.delete(adminUsers).where(eq(adminUsers.id, adminId));
  });

  it('should log actions with signature', async () => {
    logId = await logAction(adminId, 'campaign', 'approve', {
      entityId: 'test-campaign-id',
      before: { status: 'draft' },
      after: { status: 'running' },
      reason: 'Test approval',
    });

    expect(logId).toBeDefined();

    const [log] = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.id, logId))
      .limit(1);

    expect(log).toBeDefined();
    expect(log?.signature).toBeDefined();
    expect(log?.signature.length).toBeGreaterThan(0);
  });

  it('should verify audit log signature', async () => {
    const isValid = await verifyAuditLogSignature(logId);
    expect(isValid).toBe(true);
  });

  it('should detect tampered signatures', async () => {
    // Tamper with the log
    await db
      .update(auditLogs)
      .set({ action: 'tampered' })
      .where(eq(auditLogs.id, logId));

    const isValid = await verifyAuditLogSignature(logId);
    expect(isValid).toBe(false);
  });
});

describe('Moderation Workflow', () => {
  let adminId: string;
  let queueId: string;

  beforeAll(async () => {
    const [admin] = await db
      .insert(adminUsers)
      .values({
        email: 'mod-test@test.com',
        role: 'reviewer',
        status: 'active',
      })
      .returning();
    adminId = admin.id;

    const [queue] = await db
      .insert(moderationQueue)
      .values({
        entity_kind: 'campaign',
        entity_id: 'test-campaign-id',
        priority: 'normal',
        status: 'open',
        flag_reason: 'Test flag',
      })
      .returning();
    queueId = queue.id;
  });

  afterAll(async () => {
    if (queueId) {
      await db.delete(moderationQueue).where(eq(moderationQueue.id, queueId));
    }
    await db.delete(adminUsers).where(eq(adminUsers.id, adminId));
  });

  it('should create moderation queue item', async () => {
    const [item] = await db
      .select()
      .from(moderationQueue)
      .where(eq(moderationQueue.id, queueId))
      .limit(1);

    expect(item).toBeDefined();
    expect(item?.status).toBe('open');
    expect(item?.entity_kind).toBe('campaign');
  });
});

describe('Incident Management', () => {
  let adminId: string;
  let incidentId: string;

  beforeAll(async () => {
    const [admin] = await db
      .insert(adminUsers)
      .values({
        email: 'incident-test@test.com',
        role: 'support',
        status: 'active',
      })
      .returning();
    adminId = admin.id;
  });

  afterAll(async () => {
    if (incidentId) {
      await db.delete(incidents).where(eq(incidents.id, incidentId));
    }
    await db.delete(adminUsers).where(eq(adminUsers.id, adminId));
  });

  it('should create incident', async () => {
    incidentId = await createIncident({
      title: 'Test Incident',
      severity: 'low',
      summary: 'Test summary',
      openedBy: adminId,
    });

    expect(incidentId).toBeDefined();

    const [incident] = await db
      .select()
      .from(incidents)
      .where(eq(incidents.id, incidentId))
      .limit(1);

    expect(incident).toBeDefined();
    expect(incident?.status).toBe('open');
    expect(incident?.timeline.length).toBeGreaterThan(0);
  });

  it('should add timeline entry', async () => {
    const success = await addTimelineEntry(
      incidentId,
      adminId,
      'status_updated',
      { new_status: 'mitigated' },
    );

    expect(success).toBe(true);

    const [incident] = await db
      .select()
      .from(incidents)
      .where(eq(incidents.id, incidentId))
      .limit(1);

    expect(incident?.timeline.length).toBeGreaterThan(1);
  });
});

describe('Retention Policies', () => {
  it('should run retention policies in dry-run mode', async () => {
    const result = await runRetentionPolicies(true);

    expect(result).toBeDefined();
    expect(result.processed).toBeGreaterThanOrEqual(0);
    expect(result.deleted).toBeGreaterThanOrEqual(0);
    expect(result.errors).toBeGreaterThanOrEqual(0);
  });
});
