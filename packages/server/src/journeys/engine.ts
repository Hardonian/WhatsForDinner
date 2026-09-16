// @ts-nocheck
/**
 * Journey Orchestration Engine
 * Stateless rules engine with state persistence
 * Built-in journeys: onboarding, habit_loop, premium_upsell, churn_save, winback
 */

import { db } from '../db/index';
import { journeyStates, users, mealPlans, lifecycleEvents } from '../db/schema';
import { eq, and, sql, gte, lte, count } from 'drizzle-orm';
import { logger } from '../observability/index';
import { crmAdapter } from '@whats-for-dinner/adapters-crm';
import type { EmailMessage } from '@whats-for-dinner/adapters-crm/types';

export interface JourneyRule {
  key: string;
  name: string;
  steps: JourneyStep[];
}

export interface JourneyStep {
  key: string;
  name: string;
  trigger: (user: UserContext, state?: JourneyState) => Promise<boolean>;
  action: (user: UserContext, state?: JourneyState) => Promise<void>;
  delay?: number; // Delay in milliseconds before executing action
}

export interface UserContext {
  id: string;
  email: string;
  plan: string;
  created_at: Date;
  [key: string]: unknown;
}

export interface JourneyState {
  id: string;
  user_id: string;
  key: string;
  step: string;
  last_sent_at: Date | null;
  meta: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

// Built-in journeys
export const builtInJourneys: JourneyRule[] = [
  {
    key: 'onboarding',
    name: 'Onboarding Activation',
    steps: [
      {
        key: 'welcome',
        name: 'Welcome Email',
        trigger: async (user) => {
          // Trigger immediately on signup (D0)
          const state = await getJourneyState(user.id, 'onboarding');
          return !state || state.step === 'start';
        },
        action: async (user) => {
          await sendEmail(user, 'Welcome', {
            subject: 'Welcome to Nomad!',
            template: 'Welcome',
            props: { userName: user.email.split('@')[0] },
          });
        },
        delay: 0,
      },
      {
        key: 'planner_tips',
        name: 'Planner Tips (D2)',
        trigger: async (user, state) => {
          if (!state || state.step !== 'welcome') return false;
          const daysSinceWelcome = Date.now() - (state.last_sent_at?.getTime() || state.created_at.getTime());
          return daysSinceWelcome >= 2 * 24 * 60 * 60 * 1000; // 2 days
        },
        action: async (user) => {
          await sendEmail(user, 'PlannerTips', {
            subject: 'Tips for Better Meal Planning',
            template: 'WeeklyDigest',
            props: {},
          });
        },
        delay: 2 * 24 * 60 * 60 * 1000,
      },
      {
        key: 'first_week_plan',
        name: 'First Week Plan Nudge (D4)',
        trigger: async (user, state) => {
          if (!state || state.step !== 'planner_tips') return false;
          const daysSinceTips = Date.now() - (state.last_sent_at?.getTime() || state.created_at.getTime());
          return daysSinceTips >= 2 * 24 * 60 * 60 * 1000; // 2 more days
        },
        action: async (user) => {
          await sendEmail(user, 'FirstWeekPlan', {
            subject: 'Create Your First Meal Plan',
            template: 'WeeklyDigest',
            props: {},
          });
        },
        delay: 4 * 24 * 60 * 60 * 1000,
      },
    ],
  },
  {
    key: 'premium_upsell',
    name: 'Premium Upsell',
    steps: [
      {
        key: 'contextual_upsell',
        name: 'Contextual Upsell (after 3 plans)',
        trigger: async (user) => {
          if (user.plan === 'premium') return false;
          const [result] = await db
            .select({ count: count() })
            .from(mealPlans)
            .where(eq(mealPlans.user_id, user.id));
          return Number(result.count) >= 3;
        },
        action: async (user) => {
          await sendEmail(user, 'PremiumUpsell', {
            subject: 'Unlock Premium Features',
            template: 'PremiumUpsell',
            props: {},
          });
        },
      },
      {
        key: 'paywall_email',
        name: 'Paywall Email (if not converted)',
        trigger: async (user, state) => {
          if (user.plan === 'premium') return false;
          if (!state || state.step !== 'contextual_upsell') return false;
          const daysSinceUpsell = Date.now() - (state.last_sent_at?.getTime() || state.created_at.getTime());
          return daysSinceUpsell >= 3 * 24 * 60 * 60 * 1000; // 3 days later
        },
        action: async (user) => {
          await sendEmail(user, 'PaywallEmail', {
            subject: 'Limited Time: Try Premium Free',
            template: 'PremiumUpsell',
            props: {},
          });
        },
        delay: 3 * 24 * 60 * 60 * 1000,
      },
    ],
  },
  {
    key: 'churn_save',
    name: 'Churn Save',
    steps: [
      {
        key: 'detect_downgrade',
        name: 'Detect Downgrade/Intended Cancel',
        trigger: async (user) => {
          // Check for downgrade intent (simplified - in production, track cancel flow)
          const recentEvents = await db
            .select()
            .from(lifecycleEvents)
            .where(
              and(
                eq(lifecycleEvents.user_id, user.id),
                eq(lifecycleEvents.name, 'PurchaseStarted'), // User started purchase but didn't complete
                gte(lifecycleEvents.ts, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
              ),
            )
            .limit(1);
          return recentEvents.length > 0 && user.plan === 'free';
        },
        action: async (user) => {
          await sendEmail(user, 'ChurnSave', {
            subject: 'We Miss You! Special Offer Inside',
            template: 'Winback',
            props: { offerType: 'trial_days', offerValue: 7 },
          });
        },
      },
    ],
  },
  {
    key: 'winback',
    name: 'Winback',
    steps: [
      {
        key: 'inactive_nudge',
        name: 'Winback for N-day Inactive Users',
        trigger: async (user) => {
          // User inactive for 7+ days but had recent engagement before
          const lastEvent = await db
            .select()
            .from(lifecycleEvents)
            .where(eq(lifecycleEvents.user_id, user.id))
            .orderBy(sql`${lifecycleEvents.ts} DESC`)
            .limit(1);

          if (!lastEvent[0]) return false;
          const daysSinceEvent = (Date.now() - lastEvent[0].ts.getTime()) / (24 * 60 * 60 * 1000);
          return daysSinceEvent >= 7 && daysSinceEvent <= 14; // 7-14 days inactive
        },
        action: async (user) => {
          await sendEmail(user, 'Winback', {
            subject: 'Restart Your Journey with New Recipes',
            template: 'Winback',
            props: {},
          });
        },
      },
    ],
  },
];

/**
 * Get journey state for user
 */
async function getJourneyState(userId: string, journeyKey: string): Promise<JourneyState | null> {
  const [state] = await db
    .select()
    .from(journeyStates)
    .where(and(eq(journeyStates.user_id, userId), eq(journeyStates.key, journeyKey)))
    .limit(1);

  return state || null;
}

/**
 * Update journey state
 */
async function updateJourneyState(
  userId: string,
  journeyKey: string,
  step: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  await db
    .insert(journeyStates)
    .values({
      user_id: userId,
      key: journeyKey,
      step,
      last_sent_at: new Date(),
      meta: meta || {},
    })
    .onConflictDoUpdate({
      target: [journeyStates.user_id, journeyStates.key],
      set: {
        step,
        last_sent_at: new Date(),
        meta: meta || {},
        updated_at: new Date(),
      },
    });
}

/**
 * Send email via CRM adapter
 */
async function sendEmail(
  user: UserContext,
  eventName: string,
  options: {
    subject: string;
    template: string;
    props: Record<string, unknown>;
  },
): Promise<void> {
  try {
    // In production, render React Email template to HTML
    // For now, use template ID or HTML
    const message: EmailMessage = {
      to: user.email,
      subject: options.subject,
      templateId: options.template,
      templateData: {
        ...options.props,
        userName: user.email.split('@')[0],
        userId: user.id,
      },
      metadata: {
        journey_event: eventName,
        user_id: user.id,
      },
    };

    const result = await crmAdapter.sendTransactional(message);
    if (!result.success) {
      logger.error({ error: result.error, user: user.id }, 'Failed to send journey email');
      return;
    }

    // Log lifecycle event
    await db.insert(lifecycleEvents).values({
      user_id: user.id,
      name: 'JourneyEmailSent',
      props: {
        journey_event: eventName,
        template: options.template,
        message_id: result.messageId,
      },
    });

    logger.info({ user: user.id, event: eventName }, 'Journey email sent');
  } catch (error) {
    logger.error({ error, user: user.id }, 'Error sending journey email');
  }
}

/**
 * Process a single journey for a user
 */
export async function processJourney(userId: string, journey: JourneyRule): Promise<void> {
  try {
    const [userData] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userData) {
      logger.warn({ userId }, 'User not found for journey processing');
      return;
    }

    const user: UserContext = {
      id: userData.id,
      email: userData.email,
      plan: userData.plan || 'free',
      created_at: userData.created_at,
    };

    const state = await getJourneyState(userId, journey.key);

    // Find next step to execute
    let currentStepIndex = -1;
    if (state) {
      currentStepIndex = journey.steps.findIndex((s) => s.key === state.step);
    }

    // Start from beginning if no state
    if (!state) {
      await updateJourneyState(userId, journey.key, 'start', {});
    }

    // Check each step after current
    for (let i = Math.max(0, currentStepIndex + 1); i < journey.steps.length; i++) {
      const step = journey.steps[i];
      const shouldTrigger = await step.trigger(user, state || undefined);

      if (shouldTrigger) {
        // Apply delay if specified
        if (step.delay && step.delay > 0) {
          const lastSent = state?.last_sent_at || state?.created_at;
          if (lastSent && Date.now() - lastSent.getTime() < step.delay) {
            // Not enough time has passed
            continue;
          }
        }

        // Execute action
        await step.action(user, state || undefined);

        // Update state
        await updateJourneyState(userId, journey.key, step.key, {
          executed_at: new Date().toISOString(),
        });

        // Only execute one step per run
        break;
      }
    }
  } catch (error) {
    logger.error({ error, userId, journey: journey.key }, 'Error processing journey');
  }
}

/**
 * Run all journeys for eligible users
 * Called by BullMQ worker
 */
export async function runJourneys(): Promise<{ processed: number; errors: number }> {
  const results = { processed: 0, errors: 0 };

  try {
    // Get all active users (simplified - in production, filter by criteria)
    const activeUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(gte(users.created_at, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))) // Last 90 days
      .limit(1000); // Batch limit

    for (const user of activeUsers) {
      for (const journey of builtInJourneys) {
        try {
          await processJourney(user.id, journey);
          results.processed++;
        } catch (error) {
          results.errors++;
          logger.error({ error, userId: user.id, journey: journey.key }, 'Journey processing error');
        }
      }
    }
  } catch (error) {
    logger.error({ error }, 'Error running journeys');
    results.errors++;
  }

  return results;
}

/**
 * Manually trigger a journey step (admin)
 */
export async function triggerJourneyStep(
  userId: string,
  journeyKey: string,
  stepKey: string,
): Promise<void> {
  const journey = builtInJourneys.find((j) => j.key === journeyKey);
  if (!journey) {
    throw new Error(`Journey ${journeyKey} not found`);
  }

  const step = journey.steps.find((s) => s.key === stepKey);
  if (!step) {
    throw new Error(`Step ${stepKey} not found in journey ${journeyKey}`);
  }

  const [userData] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!userData) {
    throw new Error(`User ${userId} not found`);
  }

  const user: UserContext = {
    id: userData.id,
    email: userData.email,
    plan: userData.plan || 'free',
    created_at: userData.created_at,
  };

  const state = await getJourneyState(userId, journeyKey);
  await step.action(user, state || undefined);
  await updateJourneyState(userId, journeyKey, stepKey, {
    manually_triggered: true,
    executed_at: new Date().toISOString(),
  });
}
