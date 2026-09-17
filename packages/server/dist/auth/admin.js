// @ts-nocheck
/**
 * Admin Authentication & RBAC
 *
 * Handles admin JWT tokens, role-based access control, and 2FA
 */
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db/index';
import { adminUsers } from '../db/schema';
import { eq } from 'drizzle-orm';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || '';
const JWT_EXPIRY = process.env.ADMIN_JWT_EXPIRY || '8h';
/**
 * Generate admin JWT token
 */
export async function mintAdminToken(adminId) {
    if (!ADMIN_JWT_SECRET) {
        throw new Error('ADMIN_JWT_SECRET must be set');
    }
    const [admin] = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.id, adminId))
        .limit(1);
    if (!admin || admin.status !== 'active') {
        throw new Error('Admin not found or inactive');
    }
    const payload = {
        sub: admin.id,
        admin_id: admin.id,
        email: admin.email,
        role: admin.role,
        type: 'admin',
    };
    return jwt.sign(payload, ADMIN_JWT_SECRET, {
        expiresIn: JWT_EXPIRY,
        issuer: 'nomad-platform',
        audience: 'admin-panel',
    });
}
/**
 * Verify admin JWT token
 */
export async function verifyAdminJWT(token) {
    if (!ADMIN_JWT_SECRET) {
        return null;
    }
    try {
        const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
        if (decoded.type !== 'admin' || !decoded.admin_id) {
            return null;
        }
        const [admin] = await db
            .select()
            .from(adminUsers)
            .where(eq(adminUsers.id, decoded.admin_id))
            .limit(1);
        if (!admin || admin.status !== 'active') {
            return null;
        }
        // Update last login
        await db
            .update(adminUsers)
            .set({ last_login_at: new Date(), updated_at: new Date() })
            .where(eq(adminUsers.id, admin.id));
        return {
            admin: {
                id: admin.id,
                email: admin.email,
                role: admin.role,
            },
        };
    }
    catch (error) {
        return null;
    }
}
/**
 * Extract admin token from request
 */
export function extractAdminToken(req) {
    const authHeader = req.headers.get?.('authorization') || req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}
/**
 * Get admin auth from request
 */
export async function getAdminAuth(req) {
    const token = extractAdminToken(req);
    if (!token) {
        return null;
    }
    return verifyAdminJWT(token);
}
/**
 * Check if admin has required role
 */
export function hasRole(adminRole, requiredRole) {
    const roleHierarchy = {
        support: 1,
        reviewer: 2,
        finance: 3,
        auditor: 3,
        privacy_officer: 4,
        superadmin: 5,
    };
    return roleHierarchy[adminRole] >= roleHierarchy[requiredRole];
}
/**
 * Check if admin can perform action
 */
export function canPerformAction(role, action) {
    // Superadmin can do everything
    if (role === 'superadmin') {
        return true;
    }
    // Role-specific permissions
    const permissions = {
        superadmin: ['*'],
        finance: ['payout:approve', 'payout:view', 'revenue:export', 'audit:read'],
        reviewer: ['campaign:approve', 'campaign:reject', 'creative:approve', 'creative:reject', 'moderation:assign', 'moderation:resolve'],
        support: ['incident:create', 'incident:update', 'partner:read', 'audit:read'],
        privacy_officer: ['*', 'dsar:approve', 'dsar:fulfill', 'retention:override', 'evidence:export', 'vendor:approve', 'dpia:create', 'dpia:review', 'risk:modify'],
        auditor: ['audit:read', 'evidence:read', 'controls:read', 'reports:read', 'risk:read', 'vendor:read', 'dpia:read'],
    };
    const rolePerms = permissions[role] || [];
    return rolePerms.includes('*') || rolePerms.includes(action);
}
/**
 * Middleware to require admin authentication
 */
export function requireAdminAuth() {
    return async (req, res, next) => {
        const auth = await getAdminAuth(req);
        if (!auth) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        req.adminCtx = auth;
        next();
    };
}
/**
 * Middleware to require specific role
 */
export function requireRole(minRole) {
    return async (req, res, next) => {
        if (!req.adminCtx) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!hasRole(req.adminCtx.admin.role, minRole)) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                required: minRole,
                current: req.adminCtx.admin.role,
            });
        }
        next();
    };
}
/**
 * Middleware to require specific permission
 */
export function requirePermission(permission) {
    return async (req, res, next) => {
        if (!req.adminCtx) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        if (!canPerformAction(req.adminCtx.admin.role, permission)) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                required: permission,
            });
        }
        next();
    };
}
/**
 * Generate TOTP secret (for 2FA setup)
 */
export function generateTOTPSecret() {
    return crypto.randomBytes(20).toString('base32');
}
/**
 * Verify TOTP code (simple implementation - in production use speakeasy or similar)
 */
export function verifyTOTP(secret, token) {
    // This is a placeholder - implement proper TOTP verification
    // using speakeasy or otplib in production
    return token.length === 6 && /^\d+$/.test(token);
}
