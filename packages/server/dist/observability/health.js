// @ts-nocheck
/**
 * Aggregated Health Check Endpoints
 *
 * Provides /healthz endpoint that aggregates health from:
 * - Web service
 * - API service
 * - Queue workers
 * - Background jobs
 * - Database connections
 * - Redis connections
 * - External dependencies
 */
import { db } from '../db/index';
import { logger } from './index';
const startTime = Date.now();
/**
 * Check database connectivity
 */
async function checkDatabase() {
    const start = Date.now();
    try {
        await db.execute({ sql: 'SELECT 1', args: [] });
        const latency = Date.now() - start;
        return {
            status: latency < 100 ? 'healthy' : latency < 500 ? 'degraded' : 'unhealthy',
            latency,
        };
    }
    catch (error) {
        return {
            status: 'unhealthy',
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
/**
 * Check Redis connectivity (if configured)
 */
async function checkRedis() {
    const start = Date.now();
    try {
        const redisUrl = process.env.REDIS_URL;
        if (!redisUrl) {
            return {
                status: 'healthy',
                details: { message: 'Redis not configured, skipping' },
            };
        }
        // Try to create a simple Redis client and ping
        const { Redis } = await import('ioredis');
        const client = new Redis(redisUrl, {
            connectTimeout: 2000,
            maxRetriesPerRequest: 1,
        });
        await client.ping();
        await client.quit();
        const latency = Date.now() - start;
        return {
            status: latency < 50 ? 'healthy' : latency < 200 ? 'degraded' : 'unhealthy',
            latency,
        };
    }
    catch (error) {
        return {
            status: 'unhealthy',
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
/**
 * Check external dependencies
 */
async function checkExternalDependencies() {
    const checks = [];
    // Check Supabase
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        checks.push(fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
            method: 'HEAD',
            signal: AbortSignal.timeout(3000),
        })
            .then(() => ({ name: 'supabase', healthy: true }))
            .catch((err) => ({ name: 'supabase', healthy: false, error: err.message })));
    }
    // Check Stripe (if configured)
    if (process.env.STRIPE_SECRET_KEY) {
        // Just validate key format, don't make actual API call
        checks.push(Promise.resolve({
            name: 'stripe',
            healthy: process.env.STRIPE_SECRET_KEY.startsWith('sk_'),
        }));
    }
    const results = await Promise.allSettled(checks);
    const dependencies = {};
    let allHealthy = true;
    for (const result of results) {
        if (result.status === 'fulfilled') {
            dependencies[result.value.name] = result.value.healthy;
            if (!result.value.healthy)
                allHealthy = false;
        }
        else {
            allHealthy = false;
        }
    }
    return {
        status: allHealthy ? 'healthy' : 'degraded',
        details: { dependencies },
    };
}
/**
 * Aggregate all health checks
 */
export async function aggregateHealthCheck() {
    const [dbHealth, redisHealth, externalHealth] = await Promise.all([
        checkDatabase(),
        checkRedis(),
        checkExternalDependencies(),
    ]);
    const services = {
        database: dbHealth,
        redis: redisHealth,
        external: externalHealth,
    };
    // Determine overall status
    const statuses = Object.values(services).map((s) => s.status);
    let overallStatus = 'healthy';
    if (statuses.includes('unhealthy')) {
        overallStatus = 'unhealthy';
    }
    else if (statuses.includes('degraded')) {
        overallStatus = 'degraded';
    }
    return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        services,
        overall: {
            uptime: Math.floor((Date.now() - startTime) / 1000),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'production',
        },
    };
}
/**
 * Register health check endpoints on Fastify instance
 */
export function registerHealthRoutes(app) {
    // Liveness probe (simple check)
    app.get('/healthz/live', async (_request, reply) => {
        return reply.status(200).send({ status: 'ok' });
    });
    // Readiness probe (aggregated check)
    app.get('/healthz/ready', async (_request, reply) => {
        try {
            const health = await aggregateHealthCheck();
            const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
            return reply.status(statusCode).send(health);
        }
        catch (error) {
            logger.error({ error }, 'Health check failed');
            return reply.status(503).send({
                status: 'unhealthy',
                error: error instanceof Error ? error.message : String(error),
            });
        }
    });
    // Full health check with details
    app.get('/healthz', async (_request, reply) => {
        try {
            const health = await aggregateHealthCheck();
            const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
            return reply.status(statusCode).send(health);
        }
        catch (error) {
            logger.error({ error }, 'Health check failed');
            return reply.status(503).send({
                status: 'unhealthy',
                error: error instanceof Error ? error.message : String(error),
            });
        }
    });
    logger.info('Health check routes registered');
}
/**
 * Standalone health check function (for use in scripts)
 */
export async function runHealthCheck() {
    return aggregateHealthCheck();
}
