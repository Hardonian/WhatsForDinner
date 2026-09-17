import type { Request, Response, NextFunction } from 'express';
import type { NextRequest } from 'next/server';
import type { NextResponse } from 'next/server';
export declare function generateCSRFToken(): string;
export declare function validateCSRF(token: string, cookieToken: string): boolean;
export declare function validateCSRFMiddleware(req: NextRequest): Promise<{
    valid: boolean;
    error?: string;
}>;
export declare function csrfMiddleware(): (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare function corsMiddleware(): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function setCORSHeaders(res: NextResponse, origin: string | null): NextResponse;
export declare function rateLimit(key: string, limit?: number, windowSeconds?: number): Promise<{
    allowed: boolean;
    remaining: number;
    reset: number;
}>;
export declare function rateLimitMiddleware(limit?: number, windowSeconds?: number): (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare function verifyHMAC(payload: string | Buffer, signature: string, secret: string): boolean;
export declare function bodySizeLimitMiddleware(): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=index.d.ts.map