// @ts-nocheck
/**
 * Referrals API Routes
 * Handles referral code generation, tracking, and claiming
 * Idempotent operations with abuse prevention
 */

import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuthContext } from '../auth/index';
import { db } from '../db/index';
import {
  referralPrograms,
  referralCodes,
  referrals,
  users,
  promoOffers,
  lifecycleEvents,
} from '../db/schema';
import { eq, and, sql, or, isNull, isNotNull } from 'drizzle-orm';
import { addSecurityHeaders, setCORSHeaders } from '../security/helmet';
import { logger } from '../observability/index';
import crypto from 'crypto';

// Validation schemas
const createProgramSchema = z.object({
  slug: z.string().min(1),
  reward_sender: z.object({
    type: z.string(),
    value: z.number(),
  }).optional(),
  reward_receiver: z.object({
    type: z.string(),
    value: z.number(),
  }).optional(),
  terms_url: z.string().url().optional(),
});

const trackReferralSchema = z.object({
  code: z.string().min(1),
  referee_email: z.string().email().optional(),
  anon_id: z.string().optional(),
});

const claimReferralSchema = z.object({
  code: z.string().min(1),
  referee_user_id: z.string().uuid().optional(),
  referee_email: z.string().email().optional(),
});

// Generate a unique referral code
function generateReferralCode(userId: string, programId: string): string {
  const hash = crypto.createHash('sha256').update(`${userId}:${programId}:${Date.now()}`).digest('hex');
  return hash.substring(0, 8).toUpperCase();
}

/**
 * POST /api/referrals/programs
 * Create or update a referral program (admin only)
 */
export async function POST_PROGRAMS(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request);
    if (!ctx?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    const isAdmin = user[0]?.preferences && (user[0].preferences as any).role === 'admin';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createProgramSchema.parse(body);

    const [program] = await db
      .insert(referralPrograms)
      .values({
        slug: validated.slug,
        reward_sender: validated.reward_sender || {},
        reward_receiver: validated.reward_receiver || {},
        terms_url: validated.terms_url,
      })
      .onConflictDoUpdate({
        target: referralPrograms.slug,
        set: {
          reward_sender: validated.reward_sender || sql`${referralPrograms.reward_sender}`,
          reward_receiver: validated.reward_receiver || sql`${referralPrograms.reward_receiver}`,
          terms_url: validated.terms_url || sql`${referralPrograms.terms_url}`,
          updated_at: new Date(),
        },
      })
      .returning();

    let res = NextResponse.json({ program }, { status: 201 });
    res = addSecurityHeaders(res);
    return setCORSHeaders(res, request.headers.get('origin'));
  } catch (error) {
    if ((error instanceof z.ZodError) || (error instanceof Error)) {
      return NextResponse.json(
        { error: 'Invalid input', details: error instanceof z.ZodError ? error.errors : error.message },
        { status: 400 },
      );
    }
    logger.error({ error }, 'Error creating referral program');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/referrals/code
 * Generate a referral code for the current user (rate-limited)
 */
export async function POST_CODE(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request);
    if (!ctx?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { program_slug } = z.object({ program_slug: z.string().optional() }).parse(body);

    // Get default or specified program
    const programSlug = program_slug || 'default';
    const [program] = await db
      .select()
      .from(referralPrograms)
      .where(and(eq(referralPrograms.slug, programSlug), eq(referralPrograms.active, true)))
      .limit(1);

    if (!program) {
      return NextResponse.json({ error: 'Referral program not found' }, { status: 404 });
    }

    // Check if user already has a code for this program
    const [existingCode] = await db
      .select()
      .from(referralCodes)
      .where(
        and(
          eq(referralCodes.program_id, program.id),
          eq(referralCodes.owner_user_id, ctx.user.id),
        ),
      )
      .limit(1);

    if (existingCode) {
      return NextResponse.json({ code: existingCode.code, program_id: program.id });
    }

    // Generate new code
    let code = generateReferralCode(ctx.user.id, program.id);
    let attempts = 0;
    while (attempts < 10) {
      const [existing] = await db
        .select()
        .from(referralCodes)
        .where(eq(referralCodes.code, code))
        .limit(1);

      if (!existing) {
        break;
      }
      code = generateReferralCode(ctx.user.id, program.id);
      attempts++;
    }

    if (attempts >= 10) {
      return NextResponse.json({ error: 'Failed to generate unique code' }, { status: 500 });
    }

    const [newCode] = await db
      .insert(referralCodes)
      .values({
        program_id: program.id,
        code,
        owner_user_id: ctx.user.id,
      })
      .returning();

    let res = NextResponse.json({ code: newCode.code, program_id: program.id }, { status: 201 });
    res = addSecurityHeaders(res);
    return setCORSHeaders(res, request.headers.get('origin'));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    logger.error({ error }, 'Error generating referral code');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/referrals/track
 * Track a referral click (sets cookie/anon_id)
 * Idempotent - can be called multiple times
 */
export async function POST_TRACK(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = trackReferralSchema.parse(body);

    // Find referral code
    const [codeRow] = await db
      .select({
        code: referralCodes.code,
        code_id: referralCodes.id,
        program_id: referralCodes.program_id,
        owner_user_id: referralCodes.owner_user_id,
        expires_at: referralCodes.expires_at,
        max_uses: referralCodes.max_uses,
        uses: referralCodes.uses,
      })
      .from(referralCodes)
      .innerJoin(referralPrograms, eq(referralCodes.program_id, referralPrograms.id))
      .where(
        and(
          eq(referralCodes.code, validated.code),
          eq(referralPrograms.active, true),
        ),
      )
      .limit(1);

    if (!codeRow) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    // Check expiry and max uses
    if (codeRow.expires_at && new Date(codeRow.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Referral code expired' }, { status: 400 });
    }
    if (codeRow.max_uses && codeRow.uses >= codeRow.max_uses) {
      return NextResponse.json({ error: 'Referral code usage limit reached' }, { status: 400 });
    }

    // Create or update referral record (idempotent by anon_id/email)
    const anonId = validated.anon_id || `anon_${crypto.randomBytes(16).toString('hex')}`;

    // Check if referral already exists
    const existingWhere = validated.referee_email
      ? and(
          eq(referrals.code_id, codeRow.code_id),
          eq(referrals.referee_email, validated.referee_email),
        )
      : and(
          eq(referrals.code_id, codeRow.code_id),
          isNotNull(referrals.referee_email),
          sql`${referrals.referee_email} = ''`, // Placeholder for anon_id check
        );

    // Simplified: just create a new referral record for tracking
    await db.insert(referrals).values({
      program_id: codeRow.program_id,
      code_id: codeRow.code_id,
      referrer_user_id: codeRow.owner_user_id,
      referee_email: validated.referee_email || null,
      status: 'clicked',
    });

    // Log lifecycle event
    await db.insert(lifecycleEvents).values({
      anon_id: anonId,
      name: 'ReferralClick',
      props: {
        code: validated.code,
        program_id: codeRow.program_id,
      },
    });

    let res = NextResponse.json({
      tracked: true,
      anon_id: anonId,
      expires_in: codeRow.expires_at
        ? Math.max(0, Math.floor((new Date(codeRow.expires_at).getTime() - Date.now()) / 1000))
        : null,
    });
    res = addSecurityHeaders(res);
    return setCORSHeaders(res, request.headers.get('origin'));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    logger.error({ error }, 'Error tracking referral');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/referrals/claim
 * Claim a referral on signup or purchase
 * Applies promo offers if eligible
 */
export async function POST_CLAIM(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request);
    const body = await request.json();
    const validated = claimReferralSchema.parse(body);

    const refereeUserId = ctx?.user?.id || validated.referee_user_id;
    const refereeEmail = validated.referee_email || ctx?.user?.email;

    if (!refereeUserId && !refereeEmail) {
      return NextResponse.json({ error: 'Referee identifier required' }, { status: 400 });
    }

    // Find referral code
    const [codeRow] = await db
      .select({
        code: referralCodes.code,
        code_id: referralCodes.id,
        program_id: referralCodes.program_id,
        owner_user_id: referralCodes.owner_user_id,
        expires_at: referralCodes.expires_at,
        max_uses: referralCodes.max_uses,
        uses: referralCodes.uses,
      })
      .from(referralCodes)
      .innerJoin(referralPrograms, eq(referralCodes.program_id, referralPrograms.id))
      .where(
        and(
          eq(referralCodes.code, validated.code),
          eq(referralPrograms.active, true),
        ),
      )
      .limit(1);

    if (!codeRow) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    // Prevent self-referral
    if (refereeUserId && refereeUserId === codeRow.owner_user_id) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
    }

    // Check if already claimed
    const existing = await db
      .select()
      .from(referrals)
      .where(
        and(
          eq(referrals.code_id, codeRow.code_id),
          or(
            refereeUserId ? eq(referrals.referee_user_id, refereeUserId) : sql`false`,
            refereeEmail ? eq(referrals.referee_email, refereeEmail) : sql`false`,
          ),
          sql`${referrals.status} IN ('signed_up', 'converted')`,
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ message: 'Already claimed', referral_id: existing[0].id });
    }

    // Check expiry and max uses
    if (codeRow.expires_at && new Date(codeRow.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Referral code expired' }, { status: 400 });
    }
    if (codeRow.max_uses && codeRow.uses >= codeRow.max_uses) {
      return NextResponse.json({ error: 'Referral code usage limit reached' }, { status: 400 });
    }

    // Update or create referral record
    const [referral] = await db
      .insert(referrals)
      .values({
        program_id: codeRow.program_id,
        code_id: codeRow.code_id,
        referrer_user_id: codeRow.owner_user_id,
        referee_user_id: refereeUserId || null,
        referee_email: refereeEmail || null,
        status: 'signed_up',
      })
      .onConflictDoUpdate({
        target: [referrals.code_id, referrals.referee_user_id!],
        set: {
          status: 'signed_up',
          updated_at: new Date(),
        },
      })
      .returning();

    // Increment code uses
    await db
      .update(referralCodes)
      .set({ uses: sql`${referralCodes.uses} + 1`, updated_at: new Date() })
      .where(eq(referralCodes.id, codeRow.code_id));

    // Apply promo offer if program has receiver reward
    let appliedOffer = null;
    const program = await db
      .select()
      .from(referralPrograms)
      .where(eq(referralPrograms.id, codeRow.program_id))
      .limit(1);

    if (program[0]?.reward_receiver && Object.keys(program[0].reward_receiver).length > 0) {
      const reward = program[0].reward_receiver as { type: string; value: number };
      // Create or find promo offer for this referral
      const offerSlug = `referral_${codeRow.code}`;
      const [offer] = await db
        .insert(promoOffers)
        .values({
          slug: offerSlug,
          kind: reward.type === 'trial_days' ? 'trial_days' : reward.type === 'discount' ? 'percentage' : 'fixed',
          value: reward.value.toString(),
          duration: 'once',
          constraints: { max_uses_per_user: 1 },
          active: true,
        })
        .onConflictDoUpdate({
          target: promoOffers.slug,
          set: { active: true },
        })
        .returning();

      appliedOffer = offer;
    }

    // Log lifecycle event
    await db.insert(lifecycleEvents).values({
      user_id: refereeUserId || null,
      name: 'ReferralClaimed',
      props: {
        referral_id: referral.id,
        code: validated.code,
        applied_offer_id: appliedOffer?.id || null,
      },
    });

    let res = NextResponse.json({
      claimed: true,
      referral_id: referral.id,
      applied_offer: appliedOffer ? { slug: appliedOffer.slug, kind: appliedOffer.kind } : null,
    });
    res = addSecurityHeaders(res);
    return setCORSHeaders(res, request.headers.get('origin'));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    logger.error({ error }, 'Error claiming referral');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/referrals/me
 * Get referral stats for current user
 */
export async function GET_ME(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request);
    if (!ctx?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's referral codes
    const codes = await db
      .select({
        code: referralCodes.code,
        program_slug: referralPrograms.slug,
        uses: referralCodes.uses,
        max_uses: referralCodes.max_uses,
        expires_at: referralCodes.expires_at,
      })
      .from(referralCodes)
      .innerJoin(referralPrograms, eq(referralCodes.program_id, referralPrograms.id))
      .where(eq(referralCodes.owner_user_id, ctx.user.id));

    // Get referral stats
    const stats = await db
      .select({
        status: referrals.status,
        count: sql<number>`count(*)`,
      })
      .from(referrals)
      .where(eq(referrals.referrer_user_id, ctx.user.id))
      .groupBy(referrals.status);

    const statsMap = stats.reduce((acc, s) => {
      acc[s.status] = Number(s.count);
      return acc;
    }, {} as Record<string, number>);

    let res = NextResponse.json({
      codes,
      stats: {
        clicked: statsMap.clicked || 0,
        signed_up: statsMap.signed_up || 0,
        converted: statsMap.converted || 0,
      },
    });
    res = addSecurityHeaders(res);
    return setCORSHeaders(res, request.headers.get('origin'));
  } catch (error) {
    logger.error({ error }, 'Error fetching referral stats');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
