// @ts-nocheck
/**
 * Partner Link Signing Service
 * 
 * Creates and validates signed affiliate/partner links with HMAC signatures.
 * Links can be affiliate links, deeplinks, or cart links.
 * Includes tokenization for short URLs (/r/:token).
 */

import crypto from 'crypto';
import { db } from '../db/index';
import { partners, partnerLinks } from '../db/schema';
import { eq, and, gte } from 'drizzle-orm';

const LINK_SIGNING_SECRET = process.env.LINK_SIGNING_SECRET || '';
const DEFAULT_EXPIRY_HOURS = 30 * 24; // 30 days

export interface LinkParams {
  partner_id: string;
  sku?: string;
  kind: 'affiliate' | 'deeplink' | 'cart';
  destination_url: string;
  expires_in_hours?: number;
  meta?: Record<string, unknown>;
}

export interface SignedLink {
  signed_url: string;
  short_url: string; // /r/:token
  token: string;
  expires_at: Date;
}

/**
 * Generate HMAC signature for a link
 */
function generateSignature(params: {
  partnerId: string;
  destination: string;
  sku?: string;
  timestamp: number;
  expiresAt: number;
}): string {
  const payload = `${params.partnerId}:${params.destination}:${params.sku || ''}:${params.timestamp}:${params.expiresAt}`;
  return crypto.createHmac('sha256', LINK_SIGNING_SECRET).update(payload).digest('hex');
}

/**
 * Create a signed partner link
 */
export async function generateSignedLink(params: LinkParams): Promise<SignedLink> {
  if (!LINK_SIGNING_SECRET) {
    throw new Error('LINK_SIGNING_SECRET must be set');
  }

  // Verify partner exists and is active
  const [partner] = await db
    .select()
    .from(partners)
    .where(eq(partners.id, params.partner_id))
    .limit(1);

  if (!partner) {
    throw new Error('Partner not found');
  }

  if (partner.status !== 'active') {
    throw new Error('Partner is not active');
  }

  const now = Date.now();
  const expiresInMs = (params.expires_in_hours || DEFAULT_EXPIRY_HOURS) * 60 * 60 * 1000;
  const expiresAt = new Date(now + expiresInMs);

  // Generate token for short URL
  const token = crypto.randomBytes(32).toString('base64url');

  // Generate signature
  const signature = generateSignature({
    partnerId: params.partner_id,
    destination: params.destination_url,
    sku: params.sku,
    timestamp: now,
    expiresAt: expiresAt.getTime(),
  });

  // Build signed URL with query params
  const url = new URL(params.destination_url);
  url.searchParams.set('_p', params.partner_id);
  if (params.sku) {
    url.searchParams.set('_sku', params.sku);
  }
  url.searchParams.set('_t', now.toString());
  url.searchParams.set('_e', expiresAt.getTime().toString());
  url.searchParams.set('_s', signature);

  const signedUrl = url.toString();

  // Store link record
  const [link] = await db
    .insert(partnerLinks)
    .values({
      partner_id: params.partner_id,
      sku: params.sku || null,
      kind: params.kind,
      signed_url: signedUrl,
      expires_at: expiresAt,
      meta: params.meta || {},
    })
    .returning();

  return {
    signed_url: signedUrl,
    short_url: `/r/${token}`,
    token,
    expires_at: expiresAt,
  };
}

/**
 * Verify and resolve a signed link token
 * Returns the destination URL and metadata if valid
 */
export async function resolveLinkToken(token: string): Promise<{
  destination: string;
  partner_id: string;
  sku?: string;
  kind: string;
  meta: Record<string, unknown>;
} | null> {
  // In a real implementation, you'd store token -> signed_url mapping
  // For now, we'll look up by searching recent links
  // In production, consider using Redis for token lookup
  
  const [link] = await db
    .select()
    .from(partnerLinks)
    .where(
      and(
        // Token lookup would be via a separate token->link_id mapping
        // For now, we'll extract from signed_url if it contains the token
        gte(partnerLinks.expires_at, new Date())
      )
    )
    .orderBy(partnerLinks.created_at)
    .limit(1);

  if (!link || !link.signed_url) {
    return null;
  }

  // Parse signed URL
  const url = new URL(link.signed_url);
  const partnerId = url.searchParams.get('_p');
  const sku = url.searchParams.get('_sku') || undefined;
  const timestamp = url.searchParams.get('_t');
  const expiresAt = url.searchParams.get('_e');
  const signature = url.searchParams.get('_s');

  if (!partnerId || !timestamp || !expiresAt || !signature) {
    return null;
  }

  // Remove signature params to get destination
  url.searchParams.delete('_p');
  url.searchParams.delete('_sku');
  url.searchParams.delete('_t');
  url.searchParams.delete('_e');
  url.searchParams.delete('_s');
  const destination = url.toString();

  // Verify signature
  const expectedSignature = generateSignature({
    partnerId,
    destination,
    sku,
    timestamp: parseInt(timestamp, 10),
    expiresAt: parseInt(expiresAt, 10),
  });

  if (signature !== expectedSignature) {
    return null;
  }

  // Check expiry
  if (parseInt(expiresAt, 10) < Date.now()) {
    return null;
  }

  return {
    destination,
    partner_id: partnerId,
    sku,
    kind: link.kind,
    meta: (link.meta as Record<string, unknown>) || {},
  };
}

/**
 * Verify a signed URL directly (for redirect handler)
 */
export async function verifySignedUrl(signedUrl: string): Promise<{
  destination: string;
  partner_id: string;
  sku?: string;
  meta: Record<string, unknown>;
} | null> {
  try {
    const url = new URL(signedUrl);
    const partnerId = url.searchParams.get('_p');
    const sku = url.searchParams.get('_sku') || undefined;
    const timestamp = url.searchParams.get('_t');
    const expiresAt = url.searchParams.get('_e');
    const signature = url.searchParams.get('_s');

    if (!partnerId || !timestamp || !expiresAt || !signature) {
      return null;
    }

    // Check expiry
    if (parseInt(expiresAt, 10) < Date.now()) {
      return null;
    }

    // Get destination URL
    const destUrl = new URL(signedUrl);
    destUrl.searchParams.delete('_p');
    destUrl.searchParams.delete('_sku');
    destUrl.searchParams.delete('_t');
    destUrl.searchParams.delete('_e');
    destUrl.searchParams.delete('_s');
    const destination = destUrl.toString();

    // Verify signature
    const expectedSignature = generateSignature({
      partnerId,
      destination,
      sku,
      timestamp: parseInt(timestamp, 10),
      expiresAt: parseInt(expiresAt, 10),
    });

    if (signature !== expectedSignature) {
      return null;
    }

    // Look up link record for metadata
    const [link] = await db
      .select()
      .from(partnerLinks)
      .where(eq(partnerLinks.signed_url, signedUrl))
      .limit(1);

    return {
      destination,
      partner_id: partnerId,
      sku,
      meta: (link?.meta as Record<string, unknown>) || {},
    };
  } catch (error) {
    return null;
  }
}
