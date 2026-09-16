/**
 * Admin Dashboard API
 * 
 * GET /api/admin/dashboard - Key metrics overview
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Note: In production, these should be imported from @nomad/server package
    // For now, using dynamic require
    const { getAdminAuth } = await import('@whats-for-dinner/server/auth/admin');
    const { db } = await import('../../../../packages/server/src/db/index.js');
    const schema = await import('../../../../packages/server/src/db/schema.js');
    const { eq, sql, count } = await import('drizzle-orm');

    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get metrics
    const [activePartners] = await db
      .select({ count: count() })
      .from(schema.partners)
      .where(eq(schema.partners.status, 'active'));

    const [flaggedCampaigns] = await db
      .select({ count: count() })
      .from(schema.moderationQueue)
      .where(eq(schema.moderationQueue.status, 'open'));

    const [openIncidents] = await db
      .select({ count: count() })
      .from(schema.incidents)
      .where(eq(schema.incidents.status, 'open'));

    const [highFraudSignals] = await db
      .select({ count: count() })
      .from(schema.fraudSignals)
      .where(sql`${schema.fraudSignals.score} > 0.7`);

    // Recent activity
    const recentCampaigns = await db
      .select()
      .from(schema.campaigns)
      .orderBy(sql`${schema.campaigns.created_at} DESC`)
      .limit(5);

    return NextResponse.json({
      metrics: {
        activePartners: Number(activePartners?.count || 0),
        flaggedCampaigns: Number(flaggedCampaigns?.count || 0),
        fraudAlerts: Number(highFraudSignals?.count || 0),
        openIncidents: Number(openIncidents?.count || 0),
      },
      recentCampaigns,
    });
  } catch (error) {
    // Error handled: Dashboard error:
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
