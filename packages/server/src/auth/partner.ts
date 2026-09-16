// @ts-nocheck
/**
 * Partner Authentication
 * 
 * Handles partner JWT tokens and API key authentication via HMAC
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import type { NextRequest } from 'next/server';
import { db } from '../db/index';
import { partners, partnerApiKeys } from '../db/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || '';
const PARTNER_CONVERSION_HMAC_SECRET = process.env.PARTNER_CONVERSION_HMAC_SECRET || '';

export interface PartnerAuthContext {
  partner: {
    id: string;
    slug: string;
    name: string;
    tier: 'affiliate' | 'sponsor' | 'full';
  };
  scopes?: string[];
}

/**
 * Generate a partner JWT token (admin only)
 */
export async function mintPartnerToken(partnerId: string, scopes?: string[]): Promise<string> {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET must be set');
  }

  const [partner] = await db
    .select()
    .from(partners)
    .where(eq(partners.id, partnerId))
    .limit(1);

  if (!partner) {
    throw new Error('Partner not found');
  }

  const payload = {
    sub: partner.id,
    partner_id: partner.id,
    partner_slug: partner.slug,
    role: 'partner',
    scopes: scopes || [],
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '90d', // Partner tokens have long expiry
    issuer: 'nomad-platform',
    audience: 'partner-api',
  });
}

/**
 * Verify partner JWT token
 */
export async function verifyPartnerJWT(token: string): Promise<PartnerAuthContext | null> {
  if (!JWT_SECRET) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      sub: string;
      partner_id: string;
      partner_slug?: string;
      role?: string;
      scopes?: string[];
    };

    if (decoded.role !== 'partner' || !decoded.partner_id) {
      return null;
    }

    const [partner] = await db
      .select()
      .from(partners)
      .where(eq(partners.id, decoded.partner_id))
      .limit(1);

    if (!partner || partner.status !== 'active') {
      return null;
    }

    return {
      partner: {
        id: partner.id,
        slug: partner.slug,
        name: partner.name,
        tier: partner.tier as 'affiliate' | 'sponsor' | 'full',
      },
      scopes: decoded.scopes || [],
    };
  } catch (error) {
    return null;
  }
}

/**
 * Verify API key via HMAC
 * Supports scoped access
 */
export async function verifyApiKey(
  apiKey: string,
  requestBody: string,
  timestamp: string,
  signature: string,
): Promise<PartnerAuthContext | null> {
  // Hash the provided API key to look it up
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  const [apiKeyRecord] = await db
    .select({
      partner: partners,
      apiKey: partnerApiKeys,
    })
    .from(partnerApiKeys)
    .innerJoin(partners, eq(partnerApiKeys.partner_id, partners.id))
    .where(eq(partnerApiKeys.key_hash, keyHash))
    .limit(1);

  if (!apiKeyRecord || apiKeyRecord.partner.status !== 'active') {
    return null;
  }

  // Verify HMAC signature
  const payload = `${timestamp}:${requestBody}`;
  const expectedSignature = crypto
    .createHmac('sha256', apiKey)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    return null;
  }

  // Check timestamp (prevent replay attacks)
  const requestTime = parseInt(timestamp, 10);
  const now = Date.now();
  const timeDiff = Math.abs(now - requestTime);
  
  // Allow 5 minute window
  if (timeDiff > 5 * 60 * 1000) {
    return null;
  }

  // Update last_used_at
  await db
    .update(partnerApiKeys)
    .set({ last_used_at: new Date() })
    .where(eq(partnerApiKeys.id, apiKeyRecord.apiKey.id));

  return {
    partner: {
      id: apiKeyRecord.partner.id,
      slug: apiKeyRecord.partner.slug,
      name: apiKeyRecord.partner.name,
      tier: apiKeyRecord.partner.tier as 'affiliate' | 'sponsor' | 'full',
    },
    scopes: apiKeyRecord.apiKey.scopes || [],
  };
}

/**
 * Verify HMAC signature for conversion webhooks
 */
export function verifyConversionWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string,
): boolean {
  if (!PARTNER_CONVERSION_HMAC_SECRET) {
    return false;
  }

  const expectedPayload = `${timestamp}:${payload}`;
  const expectedSignature = crypto
    .createHmac('sha256', PARTNER_CONVERSION_HMAC_SECRET)
    .update(expectedPayload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}

/**
 * Extract partner auth from request
 * Supports both JWT (Bearer) and API key (X-API-Key header)
 */
export async function getPartnerAuth(req: Request | NextRequest): Promise<PartnerAuthContext | null> {
  const authHeader = req.headers.get?.('authorization') || (req as Request).headers.authorization;
  
  // Try JWT first
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return verifyPartnerJWT(token);
  }

  // Try API key
  const apiKey = req.headers.get?.('x-api-key') || (req as Request).headers['x-api-key'];
  if (apiKey) {
    const timestamp = req.headers.get?.('x-timestamp') || (req as Request).headers['x-timestamp'];
    const signature = req.headers.get?.('x-signature') || (req as Request).headers['x-signature'];
    
    if (typeof timestamp === 'string' && typeof signature === 'string') {
      // Get request body
      let body = '';
      if ('body' in req && req.body) {
        body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      } else if ('json' in req && typeof req.json === 'function') {
        // For NextRequest, body might not be available yet
        // API key auth should use raw body
        body = '';
      }
      
      return verifyApiKey(apiKey as string, body, timestamp, signature);
    }
  }

  return null;
}

/**
 * Middleware to require partner authentication
 */
export function requirePartnerAuth() {
  return async (req: Request & { partnerCtx?: PartnerAuthContext }, res: Response, next: NextFunction) => {
    const auth = await getPartnerAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.partnerCtx = auth;
    next();
  };
}

/**
 * Middleware to require specific scope
 */
export function requireScope(requiredScope: string) {
  return async (req: Request & { partnerCtx?: PartnerAuthContext }, res: Response, next: NextFunction) => {
    if (!req.partnerCtx) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const scopes = req.partnerCtx.scopes || [];
    if (!scopes.includes(requiredScope) && !scopes.includes('*')) {
      return res.status(403).json({ error: 'Insufficient permissions', required: requiredScope });
    }

    next();
  };
}
