/**
 * Admin Audit Logs API
 * 
 * GET /api/admin/audit - List audit logs with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@whats-for-dinner/server/auth/admin';
import { getAuditLogs } from '@/../../../../packages/server/src/audit/index.js';

export async function GET(request: NextRequest) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const actorId = searchParams.get('actor');
    const entityKind = searchParams.get('entity');
    const entityId = searchParams.get('entity_id');
    const from = searchParams.get('from')
      ? new Date(searchParams.get('from')!)
      : undefined;
    const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const logs = await getAuditLogs({
      actorId: actorId || undefined,
      entityKind: entityKind || undefined,
      entityId: entityId || undefined,
      from,
      to,
      page,
      limit,
    });

    return NextResponse.json(logs);
  } catch (error) {
    // Error handled: Audit logs error:
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
