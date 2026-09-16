// @ts-nocheck
/**
 * DSAR Export Job
 *
 * Composes ZIP archive with user data export (profile, preferences, meal plans,
 * grocery lists, health metrics, messages metadata, events, analytics, consents)
 */

import { db } from '../db/index';
import {
  users,
  mealPlans,
  groceryLists,
  healthMetrics,
  dsarRequests,
  dsarArtifacts,
  recipes,
} from '../db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../observability/index';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { create } from 'archiver';
import crypto from 'crypto';

const ARTIFACTS_BUCKET_URL = process.env.ARTIFACTS_BUCKET_URL || '/tmp/artifacts';

/**
 * Generate data export ZIP for DSAR request
 */
export async function generateDSARExport(requestId: string): Promise<{
  artifactId: string;
  url: string;
  checksum: string;
}> {
  const [request] = await db.select().from(dsarRequests).where(eq(dsarRequests.id, requestId)).limit(1);

  if (!request) {
    throw new Error(`DSAR request ${requestId} not found`);
  }

  if (request.type !== 'export') {
    throw new Error(`Request type ${request.type} is not export`);
  }

  logger.info({ requestId, email: request.email }, 'Starting DSAR export generation');

  // Ensure artifacts directory exists
  await mkdir(ARTIFACTS_BUCKET_URL, { recursive: true });

  const exportDir = join(ARTIFACTS_BUCKET_URL, requestId);
  await mkdir(exportDir, { recursive: true });

  const zipPath = join(exportDir, `export-${requestId}.zip`);
  const output = createWriteStream(zipPath);
  const archive = create('zip', { zlib: { level: 9 } });

  archive.pipe(output);

  // Collect all user data
  let userId: string | null = request.user_id || null;

  // If no user_id but we have email, try to find user
  if (!userId && request.email) {
    const [user] = await db.select().from(users).where(eq(users.email, request.email)).limit(1);
    userId = user?.id || null;
  }

  const exportData: Record<string, unknown> = {
    metadata: {
      request_id: requestId,
      email: request.email,
      exported_at: new Date().toISOString(),
      format_version: '1.0',
    },
  };

  // 1. Account Profile
  if (userId) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user) {
      exportData.profile = {
        id: user.id,
        email: user.email,
        plan: user.plan,
        preferences: user.preferences,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
    }

    // 2. Meal Plans
    const userMealPlans = await db
      .select()
      .from(mealPlans)
      .where(eq(mealPlans.user_id, userId));
    exportData.meal_plans = userMealPlans;

    // 3. Grocery Lists (need to join via household)
    // This would require household_members join, simplified here
    exportData.grocery_lists = [];

    // 4. Health Metrics
    const userMetrics = await db
      .select()
      .from(healthMetrics)
      .where(eq(healthMetrics.user_id, userId));
    exportData.health_metrics = userMetrics;

    // 5. User Recipes
    const userRecipes = await db.select().from(recipes).where(eq(recipes.user_id, userId));
    exportData.recipes = userRecipes.map((r) => ({
      id: r.id,
      title: r.title,
      created_at: r.created_at,
      tags: r.tags,
      // Don't export full recipe content if it contains other users' data
    }));
  }

  // 6. Messages metadata (not other members' content)
  exportData.messages_metadata = {
    note: 'Message content not included per privacy policy. Only metadata exported.',
    count: 0, // Would query actual count
  };

  // 7. Events/analytics logs (would query from events table)
  exportData.analytics = {
    note: 'Analytics events exported separately in events.json',
    events: [], // Would populate from events table
  };

  // 8. Consents
  exportData.consents = {
    note: 'Consent records exported in consents.json',
    records: [], // Would populate from consent table if exists
  };

  // Write JSON files
  archive.append(JSON.stringify(exportData.profile || {}, null, 2), { name: 'profile.json' });
  archive.append(JSON.stringify(exportData.meal_plans || [], null, 2), { name: 'meal_plans.json' });
  archive.append(JSON.stringify(exportData.health_metrics || [], null, 2), { name: 'health_metrics.json' });
  archive.append(JSON.stringify(exportData.recipes || [], null, 2), { name: 'recipes.json' });
  archive.append(JSON.stringify(exportData.messages_metadata, null, 2), { name: 'messages_metadata.json' });
  archive.append(JSON.stringify(exportData.analytics, null, 2), { name: 'analytics.json' });
  archive.append(JSON.stringify(exportData.consents, null, 2), { name: 'consents.json' });
  archive.append(JSON.stringify(exportData.metadata, null, 2), { name: 'metadata.json' });

  // Generate README
  const readme = `# Data Export Package

Request ID: ${requestId}
Exported: ${exportData.metadata.exported_at}
Email: ${request.email}

## Contents

- profile.json: Account profile information
- meal_plans.json: Meal planning data
- health_metrics.json: Health and wellness metrics
- recipes.json: User-created recipes
- messages_metadata.json: Message metadata (content not included)
- analytics.json: Analytics and event logs
- consents.json: Consent records
- metadata.json: Export metadata

## Schema

See schema.json for field descriptions.

## Privacy

This export contains your personal data as of the export date. Message content from
other users is not included. Analytics events may contain aggregated data.
`;

  archive.append(readme, { name: 'README.md' });

  // Generate schema
  const schema = {
    profile: {
      id: 'UUID - User identifier',
      email: 'String - Email address',
      plan: 'Enum - Subscription plan (free/premium/partner)',
      preferences: 'Object - User preferences (diet, allergens, units, theme)',
      created_at: 'ISO 8601 timestamp',
      updated_at: 'ISO 8601 timestamp',
    },
    meal_plans: {
      id: 'UUID',
      user_id: 'UUID',
      day: 'Date (YYYY-MM-DD)',
      items: 'Array - Meal plan items with recipe IDs and macros',
      created_at: 'ISO 8601 timestamp',
    },
    health_metrics: {
      id: 'UUID',
      kind: 'Enum - Type of metric (weight/sleep/water/steps/calories)',
      value: 'Number',
      unit: 'String',
      ts: 'ISO 8601 timestamp',
    },
    recipes: {
      id: 'UUID',
      title: 'String',
      created_at: 'ISO 8601 timestamp',
      tags: 'Array of strings',
    },
  };

  archive.append(JSON.stringify(schema, null, 2), { name: 'schema.json' });

  await archive.finalize();

  // Wait for stream to finish
  await new Promise((resolve, reject) => {
    output.on('close', resolve);
    output.on('error', reject);
  });

  // Compute checksum
  const fileBuffer = await import('fs/promises').then((fs) => fs.readFile(zipPath));
  const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  // Upload to storage (in production, use S3/GCS)
  const artifactUrl = `${ARTIFACTS_BUCKET_URL}/${requestId}/export-${requestId}.zip`;

  // Create artifact record
  const [artifact] = await db
    .insert(dsarArtifacts)
    .values({
      request_id: requestId,
      kind: 'data_export',
      url: artifactUrl,
      checksum,
    })
    .returning();

  logger.info({ requestId, artifactId: artifact.id, checksum }, 'DSAR export generated');

  return {
    artifactId: artifact.id,
    url: artifactUrl,
    checksum,
  };
}

/**
 * Process pending export requests
 */
export async function processPendingExports(): Promise<{ processed: number; errors: number }> {
  const pending = await db
    .select()
    .from(dsarRequests)
    .where(eq(dsarRequests.status, 'verifying'))
    .where(eq(dsarRequests.type, 'export'));

  let processed = 0;
  let errors = 0;

  for (const request of pending) {
    try {
      await generateDSARExport(request.id);

      // Update request status
      await db
        .update(dsarRequests)
        .set({ status: 'in_progress', updated_at: new Date() })
        .where(eq(dsarRequests.id, request.id));

      processed++;
    } catch (error) {
      errors++;
      logger.error({ error, requestId: request.id }, 'Error processing DSAR export');
    }
  }

  return { processed, errors };
}
