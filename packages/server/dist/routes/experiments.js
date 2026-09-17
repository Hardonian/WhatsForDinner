// @ts-nocheck
/**
 * Experiments API Routes
 */
import { NextResponse } from 'next/server';
import { getAuthContext } from '../auth/index';
import { assignExperiments, trackExposure } from '../experiments/service';
import { addSecurityHeaders, setCORSHeaders } from '../security/helmet';
import { logger } from '../observability/index';
/**
 * GET /api/experiments/assignments
 * Batch fetch experiment assignments
 */
export async function GET_ASSIGNMENTS(request) {
    try {
        const ctx = await getAuthContext(request);
        const { searchParams } = new URL(request.url);
        const keysParam = searchParams.get('keys');
        const anonId = searchParams.get('anon_id') || null;
        const userId = ctx?.user?.id || null;
        if (!keysParam) {
            return NextResponse.json({ error: 'keys parameter required' }, { status: 400 });
        }
        const experimentKeys = keysParam.split(',').filter(Boolean);
        const subjectId = userId || anonId;
        if (!subjectId) {
            return NextResponse.json({ error: 'user_id or anon_id required' }, { status: 400 });
        }
        // Check for overrides in header
        const overrideHeader = request.headers.get('X-Experiment-Override');
        const overrides = overrideHeader
            ? Object.fromEntries(overrideHeader.split(',').map((s) => {
                const [key, val] = s.split('=');
                return [key.trim(), val.trim()];
            }))
            : undefined;
        const assignments = await assignExperiments(experimentKeys, subjectId, overrides);
        let res = NextResponse.json({ assignments });
        res = addSecurityHeaders(res);
        return setCORSHeaders(res, request.headers.get('origin'));
    }
    catch (error) {
        logger.error({ error }, 'Error fetching experiment assignments');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
/**
 * POST /api/experiments/exposure
 * Track experiment exposure
 */
export async function POST_EXPOSURE(request) {
    try {
        const body = await request.json();
        const { experiment_key, variant_key, user_id, anon_id, metadata } = body;
        if (!experiment_key || !variant_key) {
            return NextResponse.json({ error: 'experiment_key and variant_key required' }, { status: 400 });
        }
        const subjectId = user_id || anon_id;
        if (!subjectId) {
            return NextResponse.json({ error: 'user_id or anon_id required' }, { status: 400 });
        }
        await trackExposure(experiment_key, variant_key, subjectId, metadata);
        let res = NextResponse.json({ tracked: true });
        res = addSecurityHeaders(res);
        return setCORSHeaders(res, request.headers.get('origin'));
    }
    catch (error) {
        logger.error({ error }, 'Error tracking experiment exposure');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
