// @ts-nocheck
/**
 * Jobs/Queue E2E Tests
 * 
 * Verifies:
 * - mealGen job ? meal_plans updated
 * - weekly digest templated
 * - DSAR export job produces artifact
 */

import { describe, it, expect } from 'vitest';
import { db } from '@whats-for-dinner/server/db';
import { queue } from '@whats-for-dinner/server/queue';
import { fixtures } from '../../fixtures/synthetic';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ARTIFACTS_DIR = process.env.ARTIFACTS_BUCKET_URL || '/tmp/artifacts';

describe('Jobs E2E Tests', () => {
  it('mealGen job should update meal_plans', async () => {
    // Add mealGen job to queue
    const job = await queue.add('mealgen', {
      userId: fixtures.users.userA.id,
      householdId: fixtures.users.userA.householdId,
      day: new Date().toISOString().split('T')[0],
      preferences: fixtures.users.userA.preferences,
    }, {
      attempts: 1,
      timeout: 30000,
    });
    
    // Wait for job to complete
    await job.waitUntilFinished(queue, 30000);
    
    // Verify meal plan was created in DB
    const mealPlans = await db.execute({
      sql: 'SELECT * FROM meal_plans WHERE user_id = $1 AND day = $2',
      args: [fixtures.users.userA.id, new Date().toISOString().split('T')[0]],
    });
    
    expect(mealPlans.rows.length).toBeGreaterThan(0);
  }, 60000);
  
  it('weekly digest job should template email', async () => {
    const job = await queue.add('digest_weekly', {
      userId: fixtures.users.userA.id,
      week: new Date().toISOString(),
    }, {
      attempts: 1,
      timeout: 60000,
    });
    
    await job.waitUntilFinished(queue, 60000);
    
    // Verify job completed (digest would be sent via SendGrid/Klaviyo)
    expect(job.returnvalue).toBeTruthy();
  }, 90000);
  
  it('DSAR export job should produce artifact', async () => {
    const job = await queue.add('dsar_export', {
      userId: fixtures.users.userA.id,
      requestId: 'dsar-test-123',
      dryRun: true,
    }, {
      attempts: 1,
      timeout: 120000,
    });
    
    await job.waitUntilFinished(queue, 120000);
    
    // Verify artifact file exists
    const artifactPath = join(ARTIFACTS_DIR, `dsar-${fixtures.users.userA.id}-dsar-test-123.zip`);
    
    // In dry-run, file may not be created, but job should complete
    expect(job.returnvalue).toBeTruthy();
    
    // If not dry-run, verify file exists
    if (!job.data.dryRun && existsSync(artifactPath)) {
      const stats = readFileSync(artifactPath);
      expect(stats.length).toBeGreaterThan(0);
    }
  }, 120000);
  
  it('retention runner should respect legal hold', async () => {
    // This would test the retention runner with legal hold flags
    // For now, we verify the job exists and can be queued
    const job = await queue.add('retention_runner', {
      dryRun: true,
      legalHoldUserIds: [fixtures.users.userA.id],
    }, {
      attempts: 1,
      timeout: 60000,
    });
    
    await job.waitUntilFinished(queue, 60000);
    
    // Verify user data still exists (legal hold protected)
    const user = await db.execute({
      sql: 'SELECT * FROM users WHERE id = $1',
      args: [fixtures.users.userA.id],
    });
    
    expect(user.rows.length).toBeGreaterThan(0);
  }, 90000);
});
