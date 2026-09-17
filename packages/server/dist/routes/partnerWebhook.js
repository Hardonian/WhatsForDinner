import { NextResponse } from 'next/server';
import { verifyHMAC } from '../security/index';
import { webhookEventsRepo } from '../db/index';
import { queue } from '../queue/index';
import { logger } from '../observability/index';
import { addSecurityHeaders } from '../security/helmet';
import crypto from 'crypto';
export async function POST(request) {
    try {
        const signature = request.headers.get('x-nomad-signature');
        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
        }
        const secret = process.env.WEBHOOK_SECRET_PARTNER;
        if (!secret) {
            logger.error('WEBHOOK_SECRET_PARTNER not configured');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }
        const body = await request.text();
        const isValid = verifyHMAC(body, signature, secret);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
        const payload = JSON.parse(body);
        const externalId = payload.id || payload.event_id || crypto.randomUUID();
        // Check idempotency
        const existing = await webhookEventsRepo.findByExternalId('partner', externalId);
        if (existing && existing.processed_at) {
            logger.info({ externalId }, 'Webhook already processed');
            let res = NextResponse.json({ message: 'Already processed', id: existing.id }, { status: 200 });
            return addSecurityHeaders(res);
        }
        // Create or get webhook event
        let webhookEvent = existing;
        if (!webhookEvent) {
            webhookEvent = await webhookEventsRepo.create({
                source: 'partner',
                external_id: externalId,
                payload,
            });
        }
        // Enqueue processing (non-blocking)
        await queue.add('partner-webhook', {
            webhookId: webhookEvent.id,
            source: 'partner',
            payload,
        }, {
            attempts: 3,
        });
        // Return quickly
        let res = NextResponse.json({ received: true, id: webhookEvent.id }, { status: 202 });
        return addSecurityHeaders(res);
    }
    catch (error) {
        logger.error({ error }, 'Partner webhook error');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
