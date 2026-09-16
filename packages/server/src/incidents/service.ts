// @ts-nocheck
/**
 * Incident Response Service
 * 
 * Handles incident CRUD, timeline management, and SLA tracking
 */

import { db } from '../db/index';
import { incidents, adminUsers } from '../db/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { logAction } from '../audit/index';
import { logger } from '../observability/index';

export interface CreateIncidentInput {
  title: string;
  severity: 'low' | 'major' | 'critical';
  summary: string;
  openedBy: string;
}

export interface UpdateIncidentInput {
  status?: 'open' | 'mitigated' | 'closed';
  summary?: string;
}

export interface TimelineEntry {
  ts: string;
  actor_id: string;
  action: string;
  details?: Record<string, unknown>;
}

/**
 * Create a new incident
 */
export async function createIncident(input: CreateIncidentInput): Promise<string> {
  const timeline: TimelineEntry[] = [
    {
      ts: new Date().toISOString(),
      actor_id: input.openedBy,
      action: 'opened',
      details: { severity: input.severity },
    },
  ];

  const [incident] = await db
    .insert(incidents)
    .values({
      title: input.title,
      severity: input.severity,
      summary: input.summary,
      opened_by: input.openedBy,
      status: 'open',
      timeline,
    })
    .returning();

  await logAction(input.openedBy, 'incident', 'create', {
    entityId: incident.id,
    after: { title: input.title, severity: input.severity },
  });

  // Schedule SLA reminders based on severity
  scheduleSLAReminder(incident.id, input.severity);

  return incident.id;
}

/**
 * Get incident by ID
 */
export async function getIncident(incidentId: string) {
  const [incident] = await db
    .select({
      incident: incidents,
      openedBy: adminUsers,
    })
    .from(incidents)
    .leftJoin(adminUsers, eq(incidents.opened_by, adminUsers.id))
    .where(eq(incidents.id, incidentId))
    .limit(1);

  if (!incident) {
    return null;
  }

  return {
    ...incident.incident,
    opened_by_user: incident.openedBy,
  };
}

/**
 * List incidents with filters
 */
export async function listIncidents(params: {
  status?: 'open' | 'mitigated' | 'closed';
  severity?: 'low' | 'major' | 'critical';
  openedBy?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}) {
  const page = params.page || 1;
  const limit = params.limit || 50;
  const offset = (page - 1) * limit;

  let query = db
    .select({
      incident: incidents,
      openedBy: adminUsers,
    })
    .from(incidents)
    .leftJoin(adminUsers, eq(incidents.opened_by, adminUsers.id));

  const conditions = [];

  if (params.status) {
    conditions.push(eq(incidents.status, params.status));
  }
  if (params.severity) {
    conditions.push(eq(incidents.severity, params.severity));
  }
  if (params.openedBy) {
    conditions.push(eq(incidents.opened_by, params.openedBy));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const results = await query
    .orderBy(desc(incidents.created_at))
    .limit(limit)
    .offset(offset);

  return results.map((r) => ({
    ...r.incident,
    opened_by_user: r.openedBy,
  }));
}

/**
 * Update incident
 */
export async function updateIncident(
  incidentId: string,
  actorId: string,
  input: UpdateIncidentInput,
): Promise<boolean> {
  const [existing] = await db
    .select()
    .from(incidents)
    .where(eq(incidents.id, incidentId))
    .limit(1);

  if (!existing) {
    return false;
  }

  const timelineEntry: TimelineEntry = {
    ts: new Date().toISOString(),
    actor_id: actorId,
    action: input.status ? `status_changed_to_${input.status}` : 'updated',
    details: input,
  };

  const updatedTimeline = [...(existing.timeline as TimelineEntry[]), timelineEntry];

  const updateData: any = {
    updated_at: new Date(),
    timeline: updatedTimeline,
  };

  if (input.status) {
    updateData.status = input.status;
    if (input.status === 'closed') {
      updateData.closed_at = new Date();
    }
  }

  if (input.summary) {
    updateData.summary = input.summary;
  }

  await db.update(incidents).set(updateData).where(eq(incidents.id, incidentId));

  await logAction(actorId, 'incident', 'update', {
    entityId: incidentId,
    before: {
      status: existing.status,
      summary: existing.summary,
    },
    after: updateData,
  });

  return true;
}

/**
 * Add timeline entry to incident
 */
export async function addTimelineEntry(
  incidentId: string,
  actorId: string,
  action: string,
  details?: Record<string, unknown>,
): Promise<boolean> {
  const [existing] = await db
    .select()
    .from(incidents)
    .where(eq(incidents.id, incidentId))
    .limit(1);

  if (!existing) {
    return false;
  }

  const timelineEntry: TimelineEntry = {
    ts: new Date().toISOString(),
    actor_id: actorId,
    action,
    details,
  };

  const updatedTimeline = [...(existing.timeline as TimelineEntry[]), timelineEntry];

  await db
    .update(incidents)
    .set({
      timeline: updatedTimeline,
      updated_at: new Date(),
    })
    .where(eq(incidents.id, incidentId));

  await logAction(actorId, 'incident', 'timeline_add', {
    entityId: incidentId,
    after: { action, details },
  });

  return true;
}

/**
 * Schedule SLA reminder (severity-based)
 */
function scheduleSLAReminder(incidentId: string, severity: 'low' | 'major' | 'critical'): void {
  // SLA thresholds
  const slaHours: Record<string, number> = {
    critical: 1, // 1 hour
    major: 4, // 4 hours
    low: 24, // 24 hours
  };

  const hours = slaHours[severity] || 24;
  const reminderTime = new Date(Date.now() + hours * 60 * 60 * 1000);

  // In production, use a job queue (e.g., Bull, BullMQ)
  // For now, just log
  logger.info(
    { incidentId, severity, reminderTime },
    'SLA reminder scheduled',
  );
}

/**
 * Get incidents needing SLA attention
 */
export async function getIncidentsNeedingAttention(): Promise<
  Array<{ id: string; title: string; severity: string; hoursOpen: number }>
> {
  const openIncidents = await db
    .select()
    .from(incidents)
    .where(eq(incidents.status, 'open'))
    .orderBy(desc(incidents.created_at));

  const now = new Date();
  const attention: Array<{ id: string; title: string; severity: string; hoursOpen: number }> =
    [];

  for (const incident of openIncidents) {
    const hoursOpen = (now.getTime() - incident.created_at.getTime()) / (1000 * 60 * 60);

    const thresholds: Record<string, number> = {
      critical: 1,
      major: 4,
      low: 24,
    };

    const threshold = thresholds[incident.severity] || 24;

    if (hoursOpen > threshold) {
      attention.push({
        id: incident.id,
        title: incident.title,
        severity: incident.severity,
        hoursOpen: Math.round(hoursOpen * 10) / 10,
      });
    }
  }

  return attention;
}

/**
 * Generate weekly incident digest
 */
export async function generateWeeklyDigest(from: Date, to: Date) {
  const allIncidents = await db
    .select()
    .from(incidents)
    .where(
      and(gte(incidents.created_at, from), lte(incidents.created_at, to)),
    )
    .orderBy(desc(incidents.created_at));

  const stats = {
    total: allIncidents.length,
    byStatus: {
      open: allIncidents.filter((i) => i.status === 'open').length,
      mitigated: allIncidents.filter((i) => i.status === 'mitigated').length,
      closed: allIncidents.filter((i) => i.status === 'closed').length,
    },
    bySeverity: {
      critical: allIncidents.filter((i) => i.severity === 'critical').length,
      major: allIncidents.filter((i) => i.severity === 'major').length,
      low: allIncidents.filter((i) => i.severity === 'low').length,
    },
    avgTimeToClose: 0,
    incidents: allIncidents,
  };

  // Calculate average time to close
  const closedIncidents = allIncidents.filter((i) => i.status === 'closed' && i.closed_at);
  if (closedIncidents.length > 0) {
    const totalHours = closedIncidents.reduce((sum, i) => {
      if (i.closed_at) {
        return sum + (i.closed_at.getTime() - i.created_at.getTime()) / (1000 * 60 * 60);
      }
      return sum;
    }, 0);
    stats.avgTimeToClose = totalHours / closedIncidents.length;
  }

  return stats;
}
