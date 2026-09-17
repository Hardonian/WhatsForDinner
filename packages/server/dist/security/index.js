import crypto from 'crypto';
import Redis from 'ioredis';
let redisClient = null;
function getRedis() {
    if (!redisClient) {
        const redisUrl = process.env.REDIS_URL;
        if (!redisUrl) {
            throw new Error('REDIS_URL must be set for rate limiting');
        }
        redisClient = new Redis(redisUrl);
    }
    return redisClient;
}
// CSRF token generation
export function generateCSRFToken() {
    return crypto.randomBytes(32).toString('hex');
}
// CSRF validation for web forms
export function validateCSRF(token, cookieToken) {
    if (!token || !cookieToken) {
        return false;
    }
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(cookieToken));
}
// Next.js CSRF middleware
export async function validateCSRFMiddleware(req) {
    const token = req.headers.get('x-csrf-token');
    const cookieToken = req.cookies.get('csrf-token')?.value;
    if (!token || !cookieToken) {
        return { valid: false, error: 'CSRF token missing' };
    }
    if (!validateCSRF(token, cookieToken)) {
        return { valid: false, error: 'Invalid CSRF token' };
    }
    return { valid: true };
}
// Express CSRF middleware
export function csrfMiddleware() {
    return (req, res, next) => {
        if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
            return next();
        }
        const token = req.headers['x-csrf-token'];
        const cookieToken = req.cookies['csrf-token'];
        if (!validateCSRF(token, cookieToken)) {
            return res.status(403).json({ error: 'Invalid CSRF token' });
        }
        next();
    };
}
// CORS configuration
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());
export function corsMiddleware() {
    return (req, res, next) => {
        const origin = req.headers.origin;
        if (origin && allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-CSRF-Token');
            res.setHeader('Access-Control-Max-Age', '86400');
        }
        if (req.method === 'OPTIONS') {
            return res.status(204).end();
        }
        next();
    };
}
// Next.js CORS headers
export function setCORSHeaders(res, origin) {
    if (origin && allowedOrigins.includes(origin)) {
        res.headers.set('Access-Control-Allow-Origin', origin);
        res.headers.set('Access-Control-Allow-Credentials', 'true');
        res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-CSRF-Token');
    }
    return res;
}
// Rate limiting (token bucket)
export async function rateLimit(key, limit = 100, windowSeconds = 60) {
    const redis = getRedis();
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const reset = now + windowMs;
    const bucket = await redis.get(`ratelimit:${key}`);
    if (!bucket) {
        await redis.setex(`ratelimit:${key}`, windowSeconds, limit - 1);
        return { allowed: true, remaining: limit - 1, reset };
    }
    const tokens = parseInt(bucket, 10);
    if (tokens <= 0) {
        return { allowed: false, remaining: 0, reset };
    }
    await redis.decr(`ratelimit:${key}`);
    const newTokens = parseInt(await redis.get(`ratelimit:${key}`) || '0', 10);
    return { allowed: true, remaining: Math.max(0, newTokens), reset };
}
// Rate limit middleware
export function rateLimitMiddleware(limit = 100, windowSeconds = 60) {
    return async (req, res, next) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const user = req.ctx?.user?.id || 'anonymous';
        const key = `ratelimit:${ip}:${user}`;
        const result = await rateLimit(key, limit, windowSeconds);
        res.setHeader('X-RateLimit-Limit', limit.toString());
        res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
        res.setHeader('X-RateLimit-Reset', new Date(result.reset).toISOString());
        if (!result.allowed) {
            return res.status(429).json({
                error: 'Too many requests',
                retryAfter: windowSeconds,
            });
        }
        next();
    };
}
// HMAC signature verification for webhooks
export function verifyHMAC(payload, signature, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(typeof payload === 'string' ? payload : payload.toString());
    const expected = hmac.digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
// Body size limit middleware
const MAX_BODY_SIZE = 1024 * 1024; // 1MB
export function bodySizeLimitMiddleware() {
    return (req, res, next) => {
        const contentLength = parseInt(req.headers['content-length'] || '0', 10);
        if (contentLength > MAX_BODY_SIZE) {
            return res.status(413).json({ error: 'Payload too large' });
        }
        next();
    };
}
