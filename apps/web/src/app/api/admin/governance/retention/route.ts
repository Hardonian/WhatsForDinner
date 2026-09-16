/**
 * Admin Data Governance - Retention Policies API
 * 
 * GET /api/admin/governance/retention - List policies & preview
 * POST /api/admin/governance/retention/run - Run retention policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@whats-for-dinner/server/auth/admin';
import {
  runRetentionPolicies,
  getRetentionPreview,
} from '@whats-for-dinner/server/jobs/retentionRunner';
import { db } from '@whats-for-dinner/server/db';
import { retentionPolicies } from '@whats-for-dinner/server/db/schema';

export async function GET(request: NextRequest) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (adminAuth.admin.role !== 'superadmin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const previewDays = searchParams.get('preview_days');

    if (category && previewDays) {
      const preview = await getRetentionPreview(category, parseInt(previewDays, 10));
      return NextResponse.json(preview);
    }

    const policies = await db.select().from(retentionPolicies);

    return NextResponse.json({ policies });
  } catch (error) {
    // Error handled: Retention policies error:
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (adminAuth.admin.role !== 'superadmin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const dryRun = body.dry_run !== false; // Default to true for safety

    const result = await runRetentionPolicies(dryRun);

    return NextResponse.json(result);
  } catch (error) {
    // Error handled: Retention run error:
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
