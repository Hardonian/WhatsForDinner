import Stripe from 'stripe';
import { createComponentLogger } from '@whats-for-dinner/utils';
import { supabase, supabaseAdmin } from './supabaseClient';

const _logger = createComponentLogger('stripe-service');

const stripeApiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';

export const stripe = new Stripe(stripeApiKey, {
  typescript: true,
});

export const STRIPE_CONFIG = {
  plans: {
    free: {
      name: 'Free',
      price: 0,
      priceId: undefined as string | undefined,
      features: ['3 AI meals per day', '1 pantry list', 'Basic recipes'],
      limits: {
        dailyMeals: 3,
        pantryLists: 1,
        aiTokens: 1000,
      },
    },
    pro: {
      name: 'Pro',
      price: 9.99,
      priceId: process.env.STRIPE_PRO_PRICE_ID,
      features: [
        'Unlimited AI meals',
        'Unlimited pantry lists',
        'AI nutrition summaries',
        'Advanced recipe filtering',
        'Export recipes',
      ],
      limits: {
        dailyMeals: 1000,
        pantryLists: -1, // unlimited
        aiTokens: 50000,
      },
    },
    family: {
      name: 'Family',
      price: 19.99,
      priceId: process.env.STRIPE_FAMILY_PRICE_ID,
      features: [
        'Everything in Pro',
        'Up to 5 family members',
        'Shared pantry lists',
        'Family meal planning',
        'Priority support',
      ],
      limits: {
        dailyMeals: 1000,
        pantryLists: -1, // unlimited
        aiTokens: 100000,
        maxMembers: 5,
      },
    },
  },
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
};

export type PlanType = keyof typeof STRIPE_CONFIG.plans;

export interface CreateCheckoutSessionParams {
  tenantId?: string;
  userId?: string;
  customerId?: string;
  plan?: PlanType;
  price?: number;
  currency?: string;
  billingPeriod?: string;
  metadata?: Record<string, any>;
  successUrl: string;
  cancelUrl?: string;
}

export interface CreateCustomerPortalSessionParams {
  tenantId?: string;
  userId?: string;
  customerId?: string;
  returnUrl: string;
}

export class StripeService {
  /**
   * Create a Stripe checkout session for subscription or one-time payment
   */
  static async createCheckoutSession(params: CreateCheckoutSessionParams) {
    const {
      tenantId = '',
      userId = '',
      customerId,
      plan,
      price,
      currency = 'usd',
      billingPeriod,
      metadata = {},
      successUrl,
      cancelUrl = successUrl,
    } = params;

    const isSubscription = Boolean(plan || billingPeriod);
    const planConfig = plan ? STRIPE_CONFIG.plans[plan] : undefined;
    const effectivePrice = price ?? planConfig?.price ?? 0;
    const interval = billingPeriod === 'year' ? 'year' : 'month';

    const lineItems: any[] = planConfig?.priceId
      ? [
          {
            price: planConfig.priceId,
            quantity: 1,
          },
        ]
      : [
          {
            price_data: {
              currency: currency || 'usd',
              product_data: {
                name: (metadata?.productName as string) || (metadata?.type as string) || (planConfig ? `${planConfig.name} Plan` : "What's For Dinner Purchase"),
              },
              unit_amount: Math.round(effectivePrice * 100),
              ...(isSubscription ? { recurring: { interval } } : {}),
            },
            quantity: 1,
          },
        ];

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      ...(customerId ? { customer: customerId } : {}),
      metadata: {
        tenantId,
        userId: userId || customerId || '',
        ...(plan ? { plan } : {}),
        ...metadata,
      },
      ...(isSubscription
        ? {
            subscription_data: {
              metadata: {
                tenantId,
                userId: userId || customerId || '',
                ...(plan ? { plan } : {}),
                ...metadata,
              },
            },
          }
        : {}),
    });

    return session;
  }

  /**
   * Create a customer portal session for subscription management
   */
  static async createCustomerPortalSession({
    tenantId,
    userId,
    customerId,
    returnUrl,
  }: CreateCustomerPortalSessionParams) {
    let resolvedCustomerId = customerId;

    if (!resolvedCustomerId && userId) {
      try {
        const { data: sub } = await supabaseAdmin
          .from('subscriptions')
          .select('stripe_customer_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sub?.stripe_customer_id) {
          resolvedCustomerId = sub.stripe_customer_id;
        }
      } catch (err) {
        _logger.warn('Could not retrieve customer ID from user subscriptions', { userId, error: err });
      }
    }

    if (!resolvedCustomerId && tenantId) {
      try {
        const { data: tenant } = await supabaseAdmin
          .from('tenants')
          .select('stripe_customer_id')
          .eq('id', tenantId)
          .maybeSingle();

        if (tenant?.stripe_customer_id) {
          resolvedCustomerId = tenant.stripe_customer_id;
        }
      } catch (err) {
        _logger.warn('Could not retrieve customer ID from tenant', { tenantId, error: err });
      }
    }

    if (!resolvedCustomerId) {
      throw new Error('No Stripe customer found for user or tenant');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: resolvedCustomerId,
      return_url: returnUrl,
    });

    return session;
  }

  /**
   * Get subscription details
   */
  static async getSubscription(subscriptionId: string) {
    return await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method', 'customer'],
    });
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(subscriptionId: string, immediately = false) {
    if (immediately) {
      return await stripe.subscriptions.cancel(subscriptionId);
    } else {
      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }
  }

  /**
   * Update subscription plan
   */
  static async updateSubscriptionPlan(
    subscriptionId: string,
    newPlan: PlanType
  ) {
    const planConfig = STRIPE_CONFIG.plans[newPlan];

    if (!planConfig.priceId) {
      throw new Error(`Price ID not configured for plan: ${newPlan}`);
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    return await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0]?.id || '',
          price: planConfig.priceId,
        },
      ],
      proration_behavior: 'create_prorations',
    });
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(payload: string, signature: string) {
    if (!STRIPE_CONFIG.webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    }

    return stripe.webhooks.constructEvent(
      payload,
      signature,
      STRIPE_CONFIG.webhookSecret
    );
  }

  /**
   * Handle checkout.session.completed event
   */
  static async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
    const metadata = session.metadata || {};
    const userId = metadata.userId || '';
    const tenantId = metadata.tenantId || '';
    const plan = (metadata.plan as PlanType) || 'pro';

    _logger.info('Handling checkout session completed', {
      sessionId: session.id,
      userId,
      tenantId,
      plan,
      subscriptionId,
      mode: session.mode,
    });

    if (session.mode === 'subscription' && subscriptionId) {
      let periodStart: string | null = null;
      let periodEnd: string | null = null;
      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        periodStart = sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null;
        periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
      } catch (err) {
        _logger.warn('Could not retrieve subscription dates during checkout completion', { error: err });
      }

      try {
        await supabaseAdmin.from('subscriptions').upsert(
          {
            user_id: userId || null,
            tenant_id: tenantId || null,
            stripe_customer_id: customerId || null,
            stripe_subscription_id: subscriptionId,
            plan: plan === 'family' ? 'family' : 'pro',
            status: 'active',
            current_period_start: periodStart,
            current_period_end: periodEnd,
            cancel_at_period_end: false,
            metadata: { ...metadata, checkoutSessionId: session.id },
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'stripe_subscription_id' }
        );
      } catch (dbErr) {
        _logger.error('Error saving subscription to Supabase', { error: dbErr });
      }

      if (tenantId) {
        try {
          await supabaseAdmin
            .from('tenants')
            .update({
              stripe_customer_id: customerId || null,
              stripe_subscription_id: subscriptionId,
              plan: plan === 'family' ? 'family' : 'pro',
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', tenantId);
        } catch (tenantErr) {
          _logger.error('Error updating tenant in Supabase', { error: tenantErr });
        }
      }
    } else if (session.mode === 'payment') {
      const purchaseType = metadata.type || 'credit_purchase';
      _logger.info('Processed one-time payment fulfillment', {
        userId,
        purchaseType,
        amount: session.amount_total,
      });

      if (purchaseType === 'usage_credits' || purchaseType === 'credits') {
        const credits = parseInt(metadata.credits || '0', 10);
        if (credits > 0 && userId) {
          try {
            await supabaseAdmin.from('usage_credits').insert({
              user_id: userId,
              tenant_id: tenantId || null,
              credits,
              metadata: {
                stripeSessionId: session.id,
                featureId: metadata.feature_id || metadata.featureId || null,
              },
              created_at: new Date().toISOString(),
            });
            _logger.info('Successfully credited user balance', { userId, credits });
          } catch (credErr) {
            _logger.error('Failed to credit user balance in Supabase', { error: credErr });
          }
        }
      } else if (purchaseType === 'streak_freeze') {
        if (userId) {
          try {
            await supabaseAdmin.from('user_gamification').upsert(
              {
                user_id: userId,
                streak_freeze_active: true,
                streak_freeze_purchased_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }
            );
            _logger.info('Activated streak freeze for user', { userId });
          } catch (freezeErr) {
            _logger.warn('Failed to update streak freeze in DB', { error: freezeErr });
          }
        }
      }
    }
  }

  /**
   * Handle customer.subscription.updated event
   */
  static async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const metadata = subscription.metadata || {};
    const tenantId = metadata.tenantId || '';

    _logger.info('Handling subscription updated', {
      subscriptionId: subscription.id,
      status: subscription.status,
    });

    try {
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: subscription.status as any,
          current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null,
          current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);
    } catch (err) {
      _logger.error('Error updating subscription in database', { error: err });
    }

    if (tenantId && subscription.status !== 'active') {
      try {
        await supabaseAdmin
          .from('tenants')
          .update({
            status: subscription.status === 'past_due' ? 'suspended' : 'inactive',
            updated_at: new Date().toISOString(),
          })
          .eq('id', tenantId);
      } catch (err) {
        _logger.error('Error updating tenant status on subscription update', { error: err });
      }
    }
  }

  /**
   * Handle customer.subscription.deleted event
   */
  static async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const metadata = subscription.metadata || {};
    const tenantId = metadata.tenantId || '';

    _logger.info('Handling subscription deleted / canceled', {
      subscriptionId: subscription.id,
    });

    try {
      await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'canceled',
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);
    } catch (err) {
      _logger.error('Error marking subscription canceled in database', { error: err });
    }

    if (tenantId) {
      try {
        await supabaseAdmin
          .from('tenants')
          .update({
            plan: 'free',
            status: 'active',
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tenantId);
      } catch (err) {
        _logger.error('Error downgrading tenant on subscription deletion', { error: err });
      }
    }
  }

  /**
   * Handle invoice.payment_succeeded event
   */
  static async handleInvoicePaid(invoice: Stripe.Invoice) {
    _logger.info('Handling invoice payment succeeded', {
      invoiceId: invoice.id,
      customer: invoice.customer,
      amountPaid: invoice.amount_paid,
    });
  }

  /**
   * Handle invoice.payment_failed event
   */
  static async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    _logger.warn('Handling invoice payment failed', {
      invoiceId: invoice.id,
      customer: invoice.customer,
      attemptCount: invoice.attempt_count,
    });
  }

  /**
   * Calculate usage-based pricing for AI tokens
   */
  static calculateTokenCost(tokens: number, model: string): number {
    const pricing = {
      'gpt-4o': 0.005, // $0.005 per 1K tokens
      'gpt-4o-mini': 0.00015, // $0.00015 per 1K tokens
    };

    const pricePer1K =
      pricing[model as keyof typeof pricing] || pricing['gpt-4o-mini'];
    return (tokens / 1000) * pricePer1K;
  }
}

