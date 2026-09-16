// @ts-nocheck
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import type { NextRequest } from 'next/server';
import { usersRepo } from '../db/index';
import type { RequestContext, Plan } from '../types';

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || '';

export interface AuthContext {
  user: {
    id: string;
    email: string;
    plan: Plan;
    role?: 'admin' | 'user';
  };
}

// Verify Supabase JWT token
export async function verifySupabaseJWT(token: string): Promise<AuthContext | null> {
  if (!JWT_SECRET) {
    throw new Error('SUPABASE_JWT_SECRET must be set');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      sub: string;
      email?: string;
      user_metadata?: { role?: string };
    };

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
        role: (decoded.user_metadata?.role as 'admin' | 'user') || 'user',
      },
    };
  } catch (error) {
    return null;
  }
}

// Extract token from Authorization header
export function extractToken(req: Request | NextRequest): string | null {
  const authHeader = req.headers.get?.('authorization') || (req as Request).headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// Next.js middleware wrapper
export async function getAuthContext(req: NextRequest): Promise<RequestContext | null> {
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
  return async (req: Request & { ctx?: RequestContext }, res: Response, next: NextFunction) => {
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
export function requirePlan(requiredPlan: 'premium' | 'partner') {
  return async (req: Request & { ctx?: RequestContext }, res: Response, next: NextFunction) => {
    if (!req.ctx?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userPlan = req.ctx.user.plan;
    const planHierarchy: Plan[] = ['free', 'premium', 'partner'];
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
