/**
 * Admin Incidents API
 * 
 * GET /api/admin/incidents - List incidents
 * POST /api/admin/incidents - Create incident
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminAuth } from '@whats-for-dinner/server/auth/admin';
import {
  createIncident,
  listIncidents,
  getIncident,
} from '@/../../../../packages/server/src/incidents/service.js';

const createIncidentSchema = z.object({
  title: z.string().min(1),
  severity: z.enum(['low', 'major', 'critical']),
  summary: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;
    const severity = searchParams.get('severity') as any;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const incidents = await listIncidents({
      status,
      severity,
      page,
      limit,
    });

    return NextResponse.json(incidents);
  } catch (error) {
    // Error handled: Incidents list error:
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminAuth = await getAdminAuth(request);
    if (!adminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createIncidentSchema.parse(body);

    const incidentId = await createIncident({
      ...data,
      openedBy: adminAuth.admin.id,
    });

    const incident = await getIncident(incidentId);

    return NextResponse.json(incident, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    // Error handled: Incident create error:
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
