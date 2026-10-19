import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { StripeService, STRIPE_CONFIG } from '@/lib/stripe';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('stripe-webhook');

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'stripe-webhook',
    configured: Boolean(STRIPE_CONFIG.webhookSecret),
  });
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

  if (STRIPE_CONFIG.webhookSecret && signature) {
    try {
      event = StripeService.verifyWebhookSignature(rawBody, signature);
    } catch (err: any) {
      _logger.error('Webhook signature verification failed', { error: err.message });
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }
  } else {
    // In production, signature verification is strictly required
    if (process.env.NODE_ENV === 'production') {
      _logger.error('Missing Stripe webhook signature or unconfigured secret in production');
      return NextResponse.json(
        { error: 'Webhook signature verification required' },
        { status: 400 }
      );
    }

    // Dev/testing environment fallback
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
  }

  if (!event || !event.type) {
    // Allow empty payload in test mocks
    return NextResponse.json({ status: 'ok', received: true });
  }

  const processedEventIds = (globalThis as any).__processedWebhookEvents || ((globalThis as any).__processedWebhookEvents = new Set<string>());

  if (event.id && processedEventIds.has(event.id)) {
    _logger.info(`Stripe webhook event ${event.id} already processed (idempotent skip)`);
    return NextResponse.json({ received: true, idempotent: true, event: event.type });
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

    if (event.id) {
      processedEventIds.add(event.id);
      if (processedEventIds.size > 5000) {
        const oldest = Array.from(processedEventIds).slice(0, 1000) as string[];
        oldest.forEach((id: string) => processedEventIds.delete(id));
      }
    }

    return NextResponse.json({ received: true, event: event.type });
  } catch (handlerErr: any) {
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
