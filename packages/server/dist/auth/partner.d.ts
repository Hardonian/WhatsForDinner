/**
 * Partner Authentication
 *
 * Handles partner JWT tokens and API key authentication via HMAC
 */
import type { Request, Response, NextFunction } from 'express';
import type { NextRequest } from 'next/server';
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
export declare function mintPartnerToken(partnerId: string, scopes?: string[]): Promise<string>;
/**
 * Verify partner JWT token
 */
export declare function verifyPartnerJWT(token: string): Promise<PartnerAuthContext | null>;
/**
 * Verify API key via HMAC
 * Supports scoped access
 */
export declare function verifyApiKey(apiKey: string, requestBody: string, timestamp: string, signature: string): Promise<PartnerAuthContext | null>;
/**
 * Verify HMAC signature for conversion webhooks
 */
export declare function verifyConversionWebhookSignature(payload: string, signature: string, timestamp: string): boolean;
/**
 * Extract partner auth from request
 * Supports both JWT (Bearer) and API key (X-API-Key header)
 */
export declare function getPartnerAuth(req: Request | NextRequest): Promise<PartnerAuthContext | null>;
/**
 * Middleware to require partner authentication
 */
export declare function requirePartnerAuth(): (req: Request & {
    partnerCtx?: PartnerAuthContext;
}, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware to require specific scope
 */
export declare function requireScope(requiredScope: string): (req: Request & {
    partnerCtx?: PartnerAuthContext;
}, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=partner.d.ts.map