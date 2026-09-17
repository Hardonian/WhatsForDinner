// Helper for CORS headers
export function setCORSHeaders(res, origin) {
    const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
        .split(',')
        .map((o) => o.trim());
    if (origin && allowedOrigins.includes(origin)) {
        res.headers.set('Access-Control-Allow-Origin', origin);
        res.headers.set('Access-Control-Allow-Credentials', 'true');
        res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        res.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-CSRF-Token');
    }
    return res;
}
// Security headers middleware
export function securityHeadersMiddleware() {
    return (_req, res, next) => {
        // Content Security Policy
        res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';");
        // X-Frame-Options
        res.setHeader('X-Frame-Options', 'DENY');
        // X-Content-Type-Options
        res.setHeader('X-Content-Type-Options', 'nosniff');
        // X-XSS-Protection
        res.setHeader('X-XSS-Protection', '1; mode=block');
        // Referrer-Policy
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        // Permissions-Policy
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
        // Strict-Transport-Security (HSTS) - only in production
        if (process.env.NODE_ENV === 'production') {
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }
        next();
    };
}
// Next.js security headers helper
export function addSecurityHeaders(res) {
    return setSecurityHeaders(res);
}
function setSecurityHeaders(res) {
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data:",
        "connect-src 'self' https: wss:",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-src 'none'",
        "object-src 'none'",
        "media-src 'self'",
        "worker-src 'self' blob:",
        "manifest-src 'self'",
        "upgrade-insecure-requests",
        "block-all-mixed-content",
    ].join('; ');
    res.headers.set('Content-Security-Policy', csp);
    res.headers.set('X-Frame-Options', 'DENY');
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('X-XSS-Protection', '1; mode=block');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
    res.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    res.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
    if (process.env.NODE_ENV === 'production' || process.env.FORCE_HSTS === 'true') {
        res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        res.headers.set('Expect-CT', 'max-age=86400, enforce');
    }
    return res;
}
