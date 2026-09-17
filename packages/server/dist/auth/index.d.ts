import type { Request, Response, NextFunction } from 'express';
import type { NextRequest } from 'next/server';
import type { RequestContext, Plan } from '../types';
export interface AuthContext {
    user: {
        id: string;
        email: string;
        plan: Plan;
        role?: 'admin' | 'user';
    };
}
export declare function verifySupabaseJWT(token: string): Promise<AuthContext | null>;
export declare function extractToken(req: Request | NextRequest): string | null;
export declare function getAuthContext(req: NextRequest): Promise<RequestContext | null>;
export declare function requireAuth(): (req: Request & {
    ctx?: RequestContext;
}, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
export declare function requirePlan(requiredPlan: 'premium' | 'partner'): (req: Request & {
    ctx?: RequestContext;
}, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=index.d.ts.map