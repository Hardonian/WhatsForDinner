/**
 * Admin Authentication & RBAC
 *
 * Handles admin JWT tokens, role-based access control, and 2FA
 */
import type { Request, Response, NextFunction } from 'express';
import type { NextRequest } from 'next/server';
export type AdminRole = 'superadmin' | 'finance' | 'reviewer' | 'support' | 'privacy_officer' | 'auditor';
export interface AdminAuthContext {
    admin: {
        id: string;
        email: string;
        role: AdminRole;
    };
}
/**
 * Generate admin JWT token
 */
export declare function mintAdminToken(adminId: string): Promise<string>;
/**
 * Verify admin JWT token
 */
export declare function verifyAdminJWT(token: string): Promise<AdminAuthContext | null>;
/**
 * Extract admin token from request
 */
export declare function extractAdminToken(req: Request | NextRequest): string | null;
/**
 * Get admin auth from request
 */
export declare function getAdminAuth(req: Request | NextRequest): Promise<AdminAuthContext | null>;
/**
 * Check if admin has required role
 */
export declare function hasRole(adminRole: AdminRole, requiredRole: AdminRole): boolean;
/**
 * Check if admin can perform action
 */
export declare function canPerformAction(role: AdminRole, action: string): boolean;
/**
 * Middleware to require admin authentication
 */
export declare function requireAdminAuth(): (req: Request & {
    adminCtx?: AdminAuthContext;
}, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware to require specific role
 */
export declare function requireRole(minRole: AdminRole): (req: Request & {
    adminCtx?: AdminAuthContext;
}, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware to require specific permission
 */
export declare function requirePermission(permission: string): (req: Request & {
    adminCtx?: AdminAuthContext;
}, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Generate TOTP secret (for 2FA setup)
 */
export declare function generateTOTPSecret(): string;
/**
 * Verify TOTP code (simple implementation - in production use speakeasy or similar)
 */
export declare function verifyTOTP(secret: string, token: string): boolean;
//# sourceMappingURL=admin.d.ts.map