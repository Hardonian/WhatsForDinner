/**
 * MFA Enforcement Middleware for Privacy Actions
 * Requires TOTP + backup codes for sensitive privacy operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
const crypto = typeof window === 'undefined' ? require('crypto') : null;
import { db } from '@/server/db';
import { mfaEnforcedSessions } from '@/server/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export interface ElevatedSession {
  sessionToken: string;
  userId: string;
  actionType: string;
  expiresAt: Date;
}

const SESSION_DURATION_MINUTES = 15; // Time-boxed elevated sessions

/**
 * Generate a secure session token for elevated MFA sessions
 */
export function generateElevatedSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create an elevated MFA session
 */
export async function createElevatedSession(
  userId: string,
  actionType: string
): Promise<{ sessionToken: string; expiresAt: Date }> {
  const sessionToken = generateElevatedSessionToken();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + SESSION_DURATION_MINUTES);

  const supabase = createRouteHandlerClient({ cookies });
  
  await supabase.from('mfa_enforced_sessions').insert({
    user_id: userId,
    session_token: sessionToken,
    expires_at: expiresAt.toISOString(),
    action_type: actionType,
  });

  return { sessionToken, expiresAt };
}

/**
 * Verify an elevated MFA session token
 */
export async function verifyElevatedSession(
  sessionToken: string,
  userId: string,
  actionType: string
): Promise<boolean> {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data, error } = await supabase
    .from('mfa_enforced_sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .eq('user_id', userId)
    .eq('action_type', actionType)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * Require MFA for sensitive privacy actions
 */
export async function requireMFA(
  request: NextRequest,
  actionType: string
): Promise<
  | { success: true; userId: string; sessionToken?: string }
  | { success: false; response: NextResponse }
> {
  const supabase = createRouteHandlerClient({ cookies });
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Unauthorized', requiresMFA: true },
        { status: 401 }
      ),
    };
  }

  // Check if privacy kill-switch is active
  const killSwitchActive = process.env.PRIVACY_KILL_SWITCH === 'true';
  if (killSwitchActive) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Privacy monitoring is disabled system-wide' },
        { status: 503 }
      ),
    };
  }

  // Check if user has privacy prefs requiring MFA
  const { data: prefs } = await supabase
    .from('privacy_prefs')
    .select('mfa_required')
    .eq('user_id', user.id)
    .single();

  const requiresMFA = prefs?.mfa_required ?? true;

  if (!requiresMFA) {
    // MFA not required for this user
    return { success: true, userId: user.id };
  }

  // Check for existing elevated session
  const sessionToken = request.headers.get('x-mfa-session-token');
  if (sessionToken) {
    const isValid = await verifyElevatedSession(sessionToken, user.id, actionType);
    if (isValid) {
      return { success: true, userId: user.id, sessionToken };
    }
  }

  // No valid session - require MFA verification
  return {
    success: false,
    response: NextResponse.json(
      {
        error: 'MFA required',
        requiresMFA: true,
        actionType,
        message: 'Multi-factor authentication is required to proceed.',
      },
      { status: 403 }
    ),
  };
}

/**
 * Verify TOTP code and create elevated session
 */
export async function verifyMFAAndCreateSession(
  userId: string,
  totpCode: string,
  actionType: string
): Promise<{ success: boolean; sessionToken?: string; expiresAt?: Date; error?: string }> {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Verify TOTP with Supabase Auth
  const { data, error } = await supabase.auth.verifyOtp({
    token: totpCode,
    type: 'totp',
  });

  if (error || !data.user) {
    return { success: false, error: 'Invalid TOTP code' };
  }

  // Create elevated session
  const session = await createElevatedSession(userId, actionType);
  
  return {
    success: true,
    sessionToken: session.sessionToken,
    expiresAt: session.expiresAt,
  };
}

/**
 * Clean up expired MFA sessions (should be run as a cron job)
 */
export async function cleanupExpiredMfaSessions(): Promise<number> {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data, error } = await supabase
    .from('mfa_enforced_sessions')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select();

  return data?.length || 0;
}
