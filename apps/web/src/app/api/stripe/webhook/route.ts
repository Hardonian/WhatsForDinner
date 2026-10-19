import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { StripeService, STRIPE_CONFIG } from '@/lib/stripe';
import { createComponentLogger } from '@whats-for-dinner/utils';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const _logger = createComponentLogger('stripe-webhook');
const PROCESSING_LEASE_MS = 10 * 60 * 1000;

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'stripe-webhook',
  });
}

async function claimEvent(event: Stripe.Event): Promise<'claimed' | 'completed' | 'processing'> {
  const db = getSupabaseAdmin();
  const { error } = await db.from('stripe_webhook_events').insert({
    event_id: event.id,
    event_type: event.type,
    status: 'processing',
  });
  if (!error) return 'claimed';
  if (error.code !== '23505') throw error;

  const { data: existing, error: readError } = await db
    .from('stripe_webhook_events')
    .select('status, received_at')
    .eq('event_id', event.id)
    .maybeSingle();
  if (readError) throw readError;
  if (existing?.status === 'completed') return 'completed';

  if (existing?.status === 'failed') {
    const { data: reclaimed, error: reclaimError } = await db
      .from('stripe_webhook_events')
      .update({ status: 'processing', last_error: null, received_at: new Date().toISOString() })
      .eq('event_id', event.id)
      .eq('status', 'failed')
      .select('event_id')
      .maybeSingle();
    if (reclaimError) throw reclaimError;
    if (reclaimed) return 'claimed';
  }

  if (existing?.status === 'processing' && existing.received_at) {
    const staleBefore = new Date(Date.now() - PROCESSING_LEASE_MS).toISOString();
    if (existing.received_at < staleBefore) {
      const { data: reclaimed, error: reclaimError } = await db
        .from('stripe_webhook_events')
        .update({ received_at: new Date().toISOString(), processed_at: null, last_error: null })
        .eq('event_id', event.id)
        .eq('status', 'processing')
        .lt('received_at', staleBefore)
        .select('event_id')
        .maybeSingle();
      if (reclaimError) throw reclaimError;
      if (reclaimed) return 'claimed';
    }
  }

  return 'processing';
}

async function finishEvent(eventId: string, status: 'completed' | 'failed', error?: string) {
  const { error: updateError } = await getSupabaseAdmin()
    .from('stripe_webhook_events')
    .update({
      status,
      processed_at: new Date().toISOString(),
      last_error: error?.slice(0, 1000) || null,
    })
    .eq('event_id', eventId);
  if (updateError) throw updateError;
}

export async function POST(req: NextRequest) {
  let rawBody = '';
  try {
    rawBody = await req.text();
  } catch (err: any) {
    _logger.error('Failed to read webhook body', { error: err });
    return NextResponse.json({ error: 'Failed to read body' }, { status: 400 });
  }

  const signature = req.headers.get('stripe-signature');
  let event: Stripe.Event;

  if (!STRIPE_CONFIG.webhookSecret) {
    _logger.error('Stripe webhook secret is not configured');
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 503 });
  }
  if (!signature) {
    return NextResponse.json({ error: 'Stripe signature is required' }, { status: 400 });
  }
  try {
    event = StripeService.verifyWebhookSignature(rawBody, signature);
  } catch (err: any) {
    _logger.error('Webhook signature verification failed', { error: err.message });
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  if (!event || !event.type) {
    return NextResponse.json({ error: 'Invalid Stripe event' }, { status: 400 });
  }

  try {
    const claim = await claimEvent(event);
    if (claim === 'completed') {
      return NextResponse.json({ received: true, idempotent: true, event: event.type });
    }
    if (claim === 'processing') {
      return NextResponse.json({ error: 'Event is already being processed' }, { status: 409 });
    }
  } catch (claimError) {
    _logger.error('Failed to claim Stripe event', { error: claimError });
    return NextResponse.json({ error: 'Webhook persistence unavailable' }, { status: 503 });
  }

  _logger.info(`Received Stripe webhook event: ${event.type}`, { eventId: event.id });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await StripeService.handleCheckoutSessionCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await StripeService.handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await StripeService.handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await StripeService.handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await StripeService.handleInvoicePaymentFailed(invoice);
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as any;
        _logger.warn(`Stripe dispute created: ${dispute?.id} for charge: ${dispute?.charge}`, {
          amount: dispute?.amount,
          reason: dispute?.reason,
        });
        break;
      }

      default:
        _logger.debug(`Unhandled Stripe event type: ${event.type}`);
    }

    await finishEvent(event.id, 'completed');

    return NextResponse.json({ received: true, event: event.type });
  } catch (handlerErr: any) {
    try {
      await finishEvent(event.id, 'failed', handlerErr.message);
    } catch (persistenceError) {
      _logger.error('Failed to record Stripe webhook failure', { error: persistenceError });
    }
    _logger.error(`Error processing Stripe webhook event ${event.type}`, {
      error: handlerErr.message,
    });
    return NextResponse.json(
      { error: 'Webhook processing failed', details: handlerErr.message },
      { status: 500 }
    );
  }
}

export async function PUT() {
  return new NextResponse('Method Not Allowed', {
    status: 405,
    headers: { Allow: 'GET, POST' },
  });
}

export async function DELETE() {
  return new NextResponse('Method Not Allowed', {
    status: 405,
    headers: { Allow: 'GET, POST' },
  });
}
