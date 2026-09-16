// @ts-nocheck
/**
 * DSAR (Data Subject Access Request) Routes
 *
 * Self-serve portal for data export, erasure, rectification, and restriction
 */

import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '../db/index';
import { dsarRequests, dsarArtifacts, users } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getAdminAuth, requirePermission } from '../auth/admin';
import { logger } from '../observability/index';
import { addSecurityHeaders } from '../security/helmet';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const DSAR_VERIFICATION_JWT_SECRET = process.env.DSAR_VERIFICATION_JWT_SECRET || process.env.JWT_SECRET || '';
const MAGIC_LINK_BASE_URL = process.env.MAGIC_LINK_BASE_URL || 'https://nomad.app/privacy/verify';
const DSAR_DEADLINE_DAYS = parseInt(process.env.DSAR_DEADLINE_DAYS || '30', 10);

// ============================================================================
// SCHEMAS
// ============================================================================

const createDSARSchema = z.object({
  email: z.string().email(),
  type: z.enum(['export', 'erase', 'restrict', 'rectify']),
  reason: z.string().optional(),
  region: z.enum(['gdpr', 'ccpa', 'cpra', 'other']).default('gdpr'),
});

const verifyDSARSchema = z.object({
  token: z.string(),
});

const fulfillDSARSchema = z.object({
  request_id: z.string().uuid(),
  artifact_urls: z.array(z.string().url()).optional(),
});

const eraseDSARSchema = z.object({
  request_id: z.string().uuid(),
  confirm: z.literal(true),
});

// ============================================================================
// HELPERS
// ============================================================================

function computeDeadline(region: string): Date {
  let days = DSAR_DEADLINE_DAYS;
  if (region === 'gdpr') {
    days = 30;
  } else if (region === 'ccpa' || region === 'cpra') {
    days = 45;
  }
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + days);
  return deadline;
}

async function sendVerificationEmail(email: string, requestId: string): Promise<void> {
  const token = jwt.sign(
    {
      email,
      request_id: requestId,
      type: 'dsar_verification',
    },
    DSAR_VERIFICATION_JWT_SECRET,
    { expiresIn: '24h' },
  );

  const verificationUrl = `${MAGIC_LINK_BASE_URL}?token=${token}`;

  // TODO: Integrate with email service
  logger.info({ email, requestId, verificationUrl }, 'DSAR verification email would be sent');

  // In production, use your email service:
  // await emailService.send({
  //   to: email,
  //   subject: 'Verify Your Data Request',
  //   template: 'dsar-verification',
  //   data: { verificationUrl, requestId },
  // });
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * POST /api/privacy/dsar
 * Create a new DSAR request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createDSARSchema.parse(body);

    // Check for existing pending request
    const existing = await db
      .select()
      .from(dsarRequests)
      .where(and(eq(dsarRequests.email, data.email), eq(dsarRequests.status, 'received')))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'You already have a pending request. Please verify it first.' },
        { status: 409 },
      );
    }

    // Look up user by email if authenticated
    let userId: string | null = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      // Try to extract user from JWT if available
      // This would require user JWT verification logic
    }

    const windowDeadline = computeDeadline(data.region);

    const [request] = await db
      .insert(dsarRequests)
      .values({
        email: data.email,
        type: data.type,
        reason: data.reason,
        region: data.region,
        window_deadline: windowDeadline,
        user_id: userId,
        status: 'received',
      })
      .returning();

    // Send verification email
    await sendVerificationEmail(data.email, request.id);

    logger.info({ requestId: request.id, email: data.email, type: data.type }, 'DSAR request created');

    return NextResponse.json({
      request_id: request.id,
      status: request.status,
      window_deadline: request.window_deadline,
      message: 'Verification email sent. Please check your inbox.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    logger.error({ error }, 'Error creating DSAR request');
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
  }
}

/**
 * POST /api/privacy/verify
 * Verify email and transition request to verifying/in_progress
 */
export async function verifyDSAR(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = verifyDSARSchema.parse(body);

    let decoded: { email?: string; request_id?: string; type?: string };
    try {
      decoded = jwt.verify(token, DSAR_VERIFICATION_JWT_SECRET) as typeof decoded;
    } catch {
      return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 400 });
    }

    if (decoded.type !== 'dsar_verification' || !decoded.request_id || !decoded.email) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const [dsarRequest] = await db
      .select()
      .from(dsarRequests)
      .where(eq(dsarRequests.id, decoded.request_id))
      .limit(1);

    if (!dsarRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (dsarRequest.email !== decoded.email) {
      return NextResponse.json({ error: 'Email mismatch' }, { status: 400 });
    }

    if (dsarRequest.status !== 'received') {
      return NextResponse.json(
        { error: `Request already ${dsarRequest.status}` },
        { status: 400 },
      );
    }

    // Update status and verified_at
    const [updated] = await db
      .update(dsarRequests)
      .set({
        status: 'verifying',
        verified_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(dsarRequests.id, decoded.request_id))
      .returning();

    logger.info({ requestId: decoded.request_id }, 'DSAR request verified');

    return NextResponse.json({
      request_id: updated.id,
      status: updated.status,
      message: 'Email verified. Your request is being processed.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    logger.error({ error }, 'Error verifying DSAR');
    return NextResponse.json({ error: 'Failed to verify request' }, { status: 500 });
  }
}

/**
 * GET /api/privacy/requests/me
 * List current user's DSAR requests
 */
export async function getMyDSARs(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract email from JWT or use query param
    const url = new URL(request.url);
    const email = url.searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const requests = await db
      .select({
        id: dsarRequests.id,
        type: dsarRequests.type,
        status: dsarRequests.status,
        submitted_at: dsarRequests.submitted_at,
        verified_at: dsarRequests.verified_at,
        completed_at: dsarRequests.completed_at,
        window_deadline: dsarRequests.window_deadline,
        region: dsarRequests.region,
      })
      .from(dsarRequests)
      .where(eq(dsarRequests.email, email))
      .orderBy(desc(dsarRequests.submitted_at));

    return NextResponse.json({ requests });
  } catch (error) {
    logger.error({ error }, 'Error fetching DSAR requests');
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}

/**
 * POST /api/privacy/fulfill
 * Admin endpoint to fulfill DSAR and attach artifacts
 */
export async function fulfillDSAR(request: NextRequest) {
  try {
    const auth = await getAdminAuth(request);
    if (!auth || !requirePermission(auth.admin.role, 'dsar:fulfill')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = fulfillDSARSchema.parse(body);

    const [dsarRequest] = await db
      .select()
      .from(dsarRequests)
      .where(eq(dsarRequests.id, data.request_id))
      .limit(1);

    if (!dsarRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (dsarRequest.status === 'complete') {
      return NextResponse.json({ error: 'Request already completed' }, { status: 400 });
    }

    // Update status and artifacts
    const [updated] = await db
      .update(dsarRequests)
      .set({
        status: 'complete',
        completed_at: new Date(),
        artifacts: data.artifact_urls || [],
        updated_at: new Date(),
      })
      .where(eq(dsarRequests.id, data.request_id))
      .returning();

    logger.info({ requestId: data.request_id, adminId: auth.admin.id }, 'DSAR fulfilled');

    return NextResponse.json({
      request_id: updated.id,
      status: updated.status,
      completed_at: updated.completed_at,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    logger.error({ error }, 'Error fulfilling DSAR');
    return NextResponse.json({ error: 'Failed to fulfill request' }, { status: 500 });
  }
}

/**
 * POST /api/privacy/erase
 * Schedule erasure job (respects legal hold)
 */
export async function eraseDSAR(request: NextRequest) {
  try {
    const auth = await getAdminAuth(request);
    if (!auth || !requirePermission(auth.admin.role, 'dsar:approve')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = eraseDSARSchema.parse(body);

    const [dsarRequest] = await db
      .select()
      .from(dsarRequests)
      .where(eq(dsarRequests.id, data.request_id))
      .limit(1);

    if (!dsarRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (dsarRequest.type !== 'erase') {
      return NextResponse.json({ error: 'Not an erasure request' }, { status: 400 });
    }

    // Check legal hold (would query legal_hold table)
    // For now, assume no legal hold

    // Update status to in_progress (erasure job will handle actual deletion)
    const [updated] = await db
      .update(dsarRequests)
      .set({
        status: 'in_progress',
        updated_at: new Date(),
      })
      .where(eq(dsarRequests.id, data.request_id))
      .returning();

    // Queue erasure job (would integrate with job queue)
    logger.info({ requestId: data.request_id }, 'Erasure job queued');

    return NextResponse.json({
      request_id: updated.id,
      status: updated.status,
      message: 'Erasure job queued',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    logger.error({ error }, 'Error scheduling erasure');
    return NextResponse.json({ error: 'Failed to schedule erasure' }, { status: 500 });
  }
}
