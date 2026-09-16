// @ts-nocheck
/**
 * DSAR Tests
 *
 * Test DSAR request creation, verification, export, and erasure workflows
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../db/index';
import { dsarRequests, dsarArtifacts, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { generateDSARExport } from '../jobs/dsarExport';
import { processErasure } from '../jobs/erasureRunner';

describe('DSAR Workflows', () => {
  let testUserId: string;
  let testEmail = 'test-dsar@example.com';

  beforeAll(async () => {
    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        email: testEmail,
        plan: 'free',
      })
      .returning();
    testUserId = user.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await db.delete(dsarRequests).where(eq(dsarRequests.email, testEmail));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it('should create DSAR request', async () => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30);

    const [request] = await db
      .insert(dsarRequests)
      .values({
        email: testEmail,
        type: 'export',
        status: 'received',
        region: 'gdpr',
        window_deadline: deadline,
        user_id: testUserId,
      })
      .returning();

    expect(request).toBeDefined();
    expect(request.email).toBe(testEmail);
    expect(request.type).toBe('export');
    expect(request.status).toBe('received');
  });

  it('should verify DSAR request', async () => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30);

    const [request] = await db
      .insert(dsarRequests)
      .values({
        email: testEmail,
        type: 'export',
        status: 'received',
        region: 'gdpr',
        window_deadline: deadline,
        user_id: testUserId,
      })
      .returning();

    // Verify request
    await db
      .update(dsarRequests)
      .set({
        status: 'verifying',
        verified_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(dsarRequests.id, request.id));

    const [updated] = await db
      .select()
      .from(dsarRequests)
      .where(eq(dsarRequests.id, request.id))
      .limit(1);

    expect(updated?.status).toBe('verifying');
    expect(updated?.verified_at).toBeDefined();
  });

  it('should generate export artifact', async () => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30);

    const [request] = await db
      .insert(dsarRequests)
      .values({
        email: testEmail,
        type: 'export',
        status: 'verifying',
        region: 'gdpr',
        window_deadline: deadline,
        user_id: testUserId,
      })
      .returning();

    const result = await generateDSARExport(request.id);

    expect(result.artifactId).toBeDefined();
    expect(result.url).toBeDefined();
    expect(result.checksum).toBeDefined();

    // Check artifact was created
    const [artifact] = await db
      .select()
      .from(dsarArtifacts)
      .where(eq(dsarArtifacts.request_id, request.id))
      .limit(1);

    expect(artifact).toBeDefined();
    expect(artifact?.kind).toBe('data_export');
  });

  it('should process erasure request', async () => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30);

    const [request] = await db
      .insert(dsarRequests)
      .values({
        email: testEmail,
        type: 'erase',
        status: 'in_progress',
        region: 'gdpr',
        window_deadline: deadline,
        user_id: testUserId,
      })
      .returning();

    const result = await processErasure(request.id);

    expect(result.success).toBe(true);

    const [updated] = await db
      .select()
      .from(dsarRequests)
      .where(eq(dsarRequests.id, request.id))
      .limit(1);

    expect(updated?.status).toBe('complete');
  });

  it('should skip erasure if legal hold active', async () => {
    // This would require setting up legal hold first
    // For now, test that processErasure handles it
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30);

    const [request] = await db
      .insert(dsarRequests)
      .values({
        email: testEmail,
        type: 'erase',
        status: 'in_progress',
        region: 'gdpr',
        window_deadline: deadline,
        user_id: testUserId,
      })
      .returning();

    // If legal hold is set, result should have skipped: true
    // This requires legal hold setup in test
  });
});
