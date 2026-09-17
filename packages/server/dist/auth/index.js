// @ts-nocheck
import jwt from 'jsonwebtoken';
import { usersRepo } from '../db/index';
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || '';
// Verify Supabase JWT token
export async function verifySupabaseJWT(token) {
    if (!JWT_SECRET) {
        throw new Error('SUPABASE_JWT_SECRET must be set');
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.sub;
        const user = await usersRepo.findById(userId);
        if (!user) {
            return null;
        }
        return {
            user: {
                id: user.id,
                email: user.email,
                plan: user.plan,
                role: decoded.user_metadata?.role || 'user',
            },
        };
    }
    catch (error) {
        return null;
    }
}
// Extract token from Authorization header
export function extractToken(req) {
    const authHeader = req.headers.get?.('authorization') || req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}
// Next.js middleware wrapper
export async function getAuthContext(req) {
    const token = extractToken(req);
    if (!token) {
        return null;
    }
    const auth = await verifySupabaseJWT(token);
    if (!auth) {
        return null;
    }
    return { user: auth.user };
}
// Express middleware
export function requireAuth() {
    return async (req, res, next) => {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const auth = await verifySupabaseJWT(token);
        if (!auth) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        req.ctx = { user: auth.user };
        next();
    };
}
// Require specific plan middleware
export function requirePlan(requiredPlan) {
    return async (req, res, next) => {
        if (!req.ctx?.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userPlan = req.ctx.user.plan;
        const planHierarchy = ['free', 'premium', 'partner'];
        const userLevel = planHierarchy.indexOf(userPlan);
        const requiredLevel = planHierarchy.indexOf(requiredPlan);
        if (userLevel < requiredLevel) {
            return res.status(403).json({
                error: 'Plan upgrade required',
                required: requiredPlan,
                current: userPlan,
            });
        }
        next();
    };
}
