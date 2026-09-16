import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('tracking');

/**
 * Program Tracking Utilities
 * Client-side tracking for referrals, affiliates, and partners
 */

export type ProgramType = 'referral' | 'affiliate' | 'partner';
export type EventType = 'click' | 'signup' | 'conversion' | 'visit';

interface TrackEventParams {
  programType: ProgramType;
  programId: string;
  eventType: EventType;
  metadata?: Record<string, unknown>;
}

export async function trackProgramEvent(params: TrackEventParams): Promise<void> {
  try {
    const response = await fetch('/api/programs/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        program_type: params.programType,
        program_id: params.programId,
        event_type: params.eventType,
        metadata: params.metadata || {},
      }),
    });

    if (!response.ok) {
      _logger.error('Failed to track program event');
    }
  } catch (error) {
    _logger.error('Error tracking program event:', { error: error instanceof Error ? error.message : String(error) });
  }
}

export function getAttributionCode(type: 'ref' | 'aff'): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const cookieName = `program_${type}`;
  
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === cookieName && value) {
      return decodeURIComponent(value);
    }
  }
  
  return null;
}

export function setAttributionCode(type: 'ref' | 'aff', code: string): void {
  if (typeof document === 'undefined') return;
  
  const cookieName = `program_${type}`;
  const expires = new Date();
  expires.setTime(expires.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
  
  document.cookie = `${cookieName}=${encodeURIComponent(code)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function handleAttributionOnSignup(userId: string): Promise<void> {
  return fetch('/api/programs/attribution', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  })
    .then((response) => {
      if (!response.ok) {
        _logger.error('Failed to process attribution');
      }
    })
    .catch((error) => {
      _logger.error('Error processing attribution:', { error: error instanceof Error ? error.message : String(error) });
    });
}

/**
 * Track referral link click
 */
export async function trackReferralClick(referralCode: string): Promise<void> {
  // Set attribution cookie
  await fetch(`/api/programs/attribution?code=${referralCode}&type=ref`);
  
  // Track analytics
  await trackProgramEvent({
    programType: 'referral',
    programId: referralCode,
    eventType: 'click',
    metadata: {
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
    },
  });
}

/**
 * Track affiliate link click
 */
export async function trackAffiliateClick(affiliateCode: string): Promise<void> {
  // Set attribution cookie
  await fetch(`/api/programs/attribution?code=${affiliateCode}&type=aff`);
  
  // Track analytics
  await trackProgramEvent({
    programType: 'affiliate',
    programId: affiliateCode,
    eventType: 'click',
    metadata: {
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
    },
  });
}
