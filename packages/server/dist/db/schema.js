// @ts-nocheck
import { pgTable, uuid, text, jsonb, timestamp, numeric, pgEnum, boolean, integer, date, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
// Enums
export const planEnum = pgEnum('plan', ['free', 'premium', 'partner']);
export const roleEnum = pgEnum('role', ['owner', 'adult', 'teen', 'child']);
export const recipeSourceEnum = pgEnum('recipe_source', ['curated', 'partner', 'user']);
export const healthMetricKindEnum = pgEnum('health_metric_kind', ['weight', 'sleep', 'water', 'steps', 'calories']);
export const roomKindEnum = pgEnum('room_kind', ['family', 'dm']);
// Users table
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    plan: planEnum('plan').default('free').notNull(),
    preferences: jsonb('preferences').$type(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Households table
export const households = pgTable('households', {
    id: uuid('id').primaryKey().defaultRandom(),
    owner_id: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    name: text('name'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Household members table
export const householdMembers = pgTable('household_members', {
    household_id: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }).notNull(),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    role: roleEnum('role').default('adult').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    pk: { primaryKey: { columns: [table.household_id, table.user_id] } },
}));
// Recipes table
export const recipes = pgTable('recipes', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    media_url: text('media_url'),
    steps: jsonb('steps').$type().notNull(),
    ingredients: jsonb('ingredients').$type().notNull(),
    macros: jsonb('macros').$type(),
    tags: text('tags').array(),
    source: recipeSourceEnum('source').default('user').notNull(),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Meal plans table (RLS enabled: user_id = auth.uid() or household member)
export const mealPlans = pgTable('meal_plans', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    household_id: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }),
    day: date('day').notNull(),
    items: jsonb('items').$type().notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userDayIdx: { index: 'meal_plans_user_day_idx', on: [table.user_id, table.day] },
}));
// Grocery lists table
export const groceryLists = pgTable('grocery_lists', {
    id: uuid('id').primaryKey().defaultRandom(),
    household_id: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }).notNull(),
    name: text('name'),
    items: jsonb('items').$type().notNull().default([]),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Health metrics table
export const healthMetrics = pgTable('health_metrics', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    kind: healthMetricKindEnum('kind').notNull(),
    value: numeric('value').notNull(),
    unit: text('unit').notNull(),
    ts: timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userKindTsIdx: { index: 'health_metrics_user_kind_ts_idx', on: [table.user_id, table.kind, table.ts] },
}));
// Rooms table (for family communication)
export const rooms = pgTable('rooms', {
    id: uuid('id').primaryKey().defaultRandom(),
    household_id: uuid('household_id').references(() => households.id, { onDelete: 'cascade' }),
    kind: roomKindEnum('kind').default('family').notNull(),
    participants: uuid('participants').array().notNull().default([]),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Messages table
export const messages = pgTable('messages', {
    id: uuid('id').primaryKey().defaultRandom(),
    room_id: uuid('room_id').references(() => rooms.id, { onDelete: 'cascade' }).notNull(),
    sender_id: uuid('sender_id').references(() => users.id, { onDelete: 'set null' }).notNull(),
    body: text('body').notNull(),
    attachments: jsonb('attachments').$type().default([]),
    ts: timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    roomTsIdx: { index: 'messages_room_ts_idx', on: [table.room_id, table.ts] },
}));
// Feature flags table
export const featureFlags = pgTable('feature_flags', {
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    flags: jsonb('flags').$type().notNull().default({}),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    pk: { primaryKey: { columns: [table.user_id] } },
}));
// Ad impressions table
export const adImpressions = pgTable('ad_impressions', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    slot: text('slot').notNull(),
    kind: text('kind').notNull(),
    ts: timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
    metadata: jsonb('metadata').$type().default({}),
});
// Events table (analytics)
export const events = pgTable('events', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    props: jsonb('props').$type().default({}),
    ts: timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userTsIdx: { index: 'events_user_ts_idx', on: [table.user_id, table.ts] },
}));
// API keys table (for partners)
export const apiKeys = pgTable('api_keys', {
    id: uuid('id').primaryKey().defaultRandom(),
    partner_slug: text('partner_slug').notNull(),
    key_hash: text('key_hash').notNull(), // bcrypt hash
    scopes: text('scopes').array().notNull().default([]),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
// Webhook events table (for idempotency)
export const webhookEvents = pgTable('webhook_events', {
    id: uuid('id').primaryKey().defaultRandom(),
    source: text('source').notNull(), // 'partner', 'payments', etc.
    external_id: text('external_id').notNull(),
    payload: jsonb('payload').notNull(),
    processed_at: timestamp('processed_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    uniqueExternalId: { unique: true, columns: [table.source, table.external_id] },
}));
// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
    mealPlans: many(mealPlans),
    healthMetrics: many(healthMetrics),
    ownedHouseholds: many(households),
    householdMemberships: many(householdMembers),
    featureFlags: one(featureFlags),
}));
export const householdsRelations = relations(households, ({ many, one }) => ({
    owner: one(users, { fields: [households.owner_id], references: [users.id] }),
    members: many(householdMembers),
    mealPlans: many(mealPlans),
    groceryLists: many(groceryLists),
    rooms: many(rooms),
}));
export const mealPlansRelations = relations(mealPlans, ({ one }) => ({
    user: one(users, { fields: [mealPlans.user_id], references: [users.id] }),
    household: one(households, { fields: [mealPlans.household_id], references: [households.id] }),
}));
// ============================================================================
// GROWTH SYSTEMS SCHEMA
// ============================================================================
// Enums
export const emailSubscriptionStatusEnum = pgEnum('email_subscription_status', ['subscribed', 'unsubscribed', 'bounced']);
export const referralStatusEnum = pgEnum('referral_status', ['clicked', 'signed_up', 'converted']);
export const promoOfferKindEnum = pgEnum('promo_offer_kind', ['percentage', 'fixed', 'trial_days']);
export const promoDurationEnum = pgEnum('promo_duration', ['once', 'repeat', 'lifecycle']);
export const experimentStatusEnum = pgEnum('experiment_status', ['draft', 'running', 'paused', 'complete']);
export const pricingPlatformEnum = pgEnum('pricing_platform', ['ios', 'android', 'web', 'any']);
export const pricingPlanEnum = pgEnum('pricing_plan', ['monthly', 'annual']);
// Email subscriptions table
export const emailSubscriptions = pgTable('email_subscriptions', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    status: emailSubscriptionStatusEnum('status').default('subscribed').notNull(),
    source: text('source'),
    ts: timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userIdx: { index: 'email_subscriptions_user_id_idx', on: [table.user_id] },
    emailIdx: { index: 'email_subscriptions_email_idx', on: [table.email] },
    statusIdx: { index: 'email_subscriptions_status_idx', on: [table.status] },
}));
// Referral programs table
export const referralPrograms = pgTable('referral_programs', {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    active: boolean('active').default(true).notNull(),
    reward_sender: jsonb('reward_sender').$type().default({ type: 'credit', value: 0 }),
    reward_receiver: jsonb('reward_receiver').$type().default({ type: 'credit', value: 0 }),
    terms_url: text('terms_url'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// Referral codes table
export const referralCodes = pgTable('referral_codes', {
    id: uuid('id').primaryKey().defaultRandom(),
    program_id: uuid('program_id').references(() => referralPrograms.id, { onDelete: 'cascade' }).notNull(),
    code: text('code').notNull().unique(),
    owner_user_id: uuid('owner_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    uses: integer('uses').default(0).notNull(),
    max_uses: integer('max_uses'),
    expires_at: timestamp('expires_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    programIdx: { index: 'referral_codes_program_id_idx', on: [table.program_id] },
    ownerIdx: { index: 'referral_codes_owner_user_id_idx', on: [table.owner_user_id] },
    codeIdx: { index: 'referral_codes_code_idx', on: [table.code] },
}));
// Referrals table
export const referrals = pgTable('referrals', {
    id: uuid('id').primaryKey().defaultRandom(),
    program_id: uuid('program_id').references(() => referralPrograms.id, { onDelete: 'cascade' }).notNull(),
    code_id: uuid('code_id').references(() => referralCodes.id, { onDelete: 'cascade' }).notNull(),
    referrer_user_id: uuid('referrer_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    referee_user_id: uuid('referee_user_id').references(() => users.id, { onDelete: 'set null' }),
    referee_email: varchar('referee_email', { length: 255 }),
    status: referralStatusEnum('status').default('clicked').notNull(),
    ts: timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    codeIdx: { index: 'referrals_code_id_idx', on: [table.code_id] },
    referrerIdx: { index: 'referrals_referrer_user_id_idx', on: [table.referrer_user_id] },
    refereeIdx: { index: 'referrals_referee_user_id_idx', on: [table.referee_user_id] },
    statusIdx: { index: 'referrals_status_idx', on: [table.status] },
}));
// Promo offers table
export const promoOffers = pgTable('promo_offers', {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    kind: promoOfferKindEnum('kind').notNull(),
    value: numeric('value').notNull(),
    duration: promoDurationEnum('duration').default('once').notNull(),
    constraints: jsonb('constraints').$type().default({}),
    active: boolean('active').default(true).notNull(),
    starts_at: timestamp('starts_at', { withTimezone: true }),
    ends_at: timestamp('ends_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    slugIdx: { index: 'promo_offers_slug_idx', on: [table.slug] },
}));
// Experiments table
export const experiments = pgTable('experiments', {
    id: uuid('id').primaryKey().defaultRandom(),
    key: text('key').notNull().unique(),
    description: text('description'),
    status: experimentStatusEnum('status').default('draft').notNull(),
    hypothesis: text('hypothesis'),
    primary_metric: text('primary_metric').notNull(),
    guardrail_metrics: jsonb('guardrail_metrics').$type().default([]),
    created_by: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    started_at: timestamp('started_at', { withTimezone: true }),
    stopped_at: timestamp('stopped_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    keyIdx: { index: 'experiments_key_idx', on: [table.key] },
}));
// Experiment variants table
export const experimentVariants = pgTable('experiment_variants', {
    id: uuid('id').primaryKey().defaultRandom(),
    experiment_id: uuid('experiment_id').references(() => experiments.id, { onDelete: 'cascade' }).notNull(),
    key: text('key').notNull(),
    weight: integer('weight').default(50).notNull(),
    meta: jsonb('meta').$type().default({}),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    experimentIdx: { index: 'experiment_variants_experiment_id_idx', on: [table.experiment_id] },
    uniqueVariant: { unique: true, columns: [table.experiment_id, table.key] },
}));
// Experiment assignments table
export const experimentAssignments = pgTable('experiment_assignments', {
    id: uuid('id').primaryKey().defaultRandom(),
    experiment_id: uuid('experiment_id').references(() => experiments.id, { onDelete: 'cascade' }).notNull(),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    anon_id: text('anon_id'),
    variant_key: text('variant_key').notNull(),
    assigned_at: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
    sticky: boolean('sticky').default(true).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    experimentIdx: { index: 'experiment_assignments_experiment_id_idx', on: [table.experiment_id] },
    userIdx: { index: 'experiment_assignments_user_id_idx', on: [table.user_id] },
    anonIdx: { index: 'experiment_assignments_anon_id_idx', on: [table.anon_id] },
    uniqueAssignment: { unique: true, columns: [table.experiment_id, table.user_id, table.anon_id] },
}));
// Pricing rules table
export const pricingRules = pgTable('pricing_rules', {
    id: uuid('id').primaryKey().defaultRandom(),
    country: varchar('country', { length: 3 }),
    platform: pricingPlatformEnum('platform').default('any').notNull(),
    plan: pricingPlanEnum('plan').notNull(),
    price_cents: integer('price_cents').notNull(),
    currency: varchar('currency', { length: 3 }).default('USD').notNull(),
    promo_offer_id: uuid('promo_offer_id').references(() => promoOffers.id, { onDelete: 'set null' }),
    active: boolean('active').default(true).notNull(),
    starts_at: timestamp('starts_at', { withTimezone: true }),
    ends_at: timestamp('ends_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    countryPlatformIdx: { index: 'pricing_rules_country_platform_idx', on: [table.country, table.platform] },
}));
// Lifecycle events table
export const lifecycleEvents = pgTable('lifecycle_events', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    anon_id: text('anon_id'),
    name: text('name').notNull(),
    props: jsonb('props').$type().default({}),
    ts: timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userIdx: { index: 'lifecycle_events_user_id_idx', on: [table.user_id] },
    anonIdx: { index: 'lifecycle_events_anon_id_idx', on: [table.anon_id] },
    nameTsIdx: { index: 'lifecycle_events_name_ts_idx', on: [table.name, table.ts] },
}));
// Journey states table
export const journeyStates = pgTable('journey_states', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    key: text('key').notNull(),
    step: text('step').notNull(),
    last_sent_at: timestamp('last_sent_at', { withTimezone: true }),
    meta: jsonb('meta').$type().default({}),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userIdx: { index: 'journey_states_user_id_idx', on: [table.user_id] },
    keyIdx: { index: 'journey_states_key_idx', on: [table.key] },
    uniqueJourney: { unique: true, columns: [table.user_id, table.key] },
}));
// Relations for growth tables
export const referralProgramsRelations = relations(referralPrograms, ({ many }) => ({
    codes: many(referralCodes),
    referrals: many(referrals),
}));
export const referralCodesRelations = relations(referralCodes, ({ one, many }) => ({
    program: one(referralPrograms, { fields: [referralCodes.program_id], references: [referralPrograms.id] }),
    owner: one(users, { fields: [referralCodes.owner_user_id], references: [users.id] }),
    referrals: many(referrals),
}));
export const referralsRelations = relations(referrals, ({ one }) => ({
    program: one(referralPrograms, { fields: [referrals.program_id], references: [referralPrograms.id] }),
    code: one(referralCodes, { fields: [referrals.code_id], references: [referralCodes.id] }),
    referrer: one(users, { fields: [referrals.referrer_user_id], references: [users.id] }),
    referee: one(users, { fields: [referrals.referee_user_id], references: [users.id] }),
}));
export const experimentsRelations = relations(experiments, ({ one, many }) => ({
    creator: one(users, { fields: [experiments.created_by], references: [users.id] }),
    variants: many(experimentVariants),
    assignments: many(experimentAssignments),
}));
export const experimentVariantsRelations = relations(experimentVariants, ({ one }) => ({
    experiment: one(experiments, { fields: [experimentVariants.experiment_id], references: [experiments.id] }),
}));
export const experimentAssignmentsRelations = relations(experimentAssignments, ({ one }) => ({
    experiment: one(experiments, { fields: [experimentAssignments.experiment_id], references: [experiments.id] }),
    user: one(users, { fields: [experimentAssignments.user_id], references: [users.id] }),
}));
// ============================================================================
// REVENUE OPTIMIZATION SCHEMA
// ============================================================================
// Enums
export const transactionStatusEnum = pgEnum('transaction_status', ['success', 'failed', 'refunded', 'trial']);
export const transactionPlatformEnum = pgEnum('transaction_platform', ['ios', 'android', 'web']);
export const ltvSegmentEnum = pgEnum('ltv_segment', ['new', 'retained', 'churned', 'reactivated']);
// Transactions table
export const transactions = pgTable('transactions', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    plan: text('plan').notNull(),
    platform: transactionPlatformEnum('platform').notNull(),
    currency: varchar('currency', { length: 3 }).default('USD').notNull(),
    amount_cents: integer('amount_cents').notNull(),
    country: varchar('country', { length: 3 }),
    promo_offer_id: uuid('promo_offer_id').references(() => promoOffers.id, { onDelete: 'set null' }),
    status: transactionStatusEnum('status').default('success').notNull(),
    ts: timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userIdIdx: { index: 'transactions_user_id_idx', on: [table.user_id] },
    tsIdx: { index: 'transactions_ts_idx', on: [table.ts] },
    countryPlanIdx: { index: 'transactions_country_plan_idx', on: [table.country, table.plan] },
    platformIdx: { index: 'transactions_platform_idx', on: [table.platform] },
    statusIdx: { index: 'transactions_status_idx', on: [table.status] },
}));
// Revenue snapshots table
export const revenueSnapshots = pgTable('revenue_snapshots', {
    id: uuid('id').primaryKey().defaultRandom(),
    period: date('period').notNull().unique(),
    mrr_cents: integer('mrr_cents').default(0).notNull(),
    arr_cents: integer('arr_cents').default(0).notNull(),
    arpu_cents: integer('arpu_cents').default(0).notNull(),
    ltv_cents: integer('ltv_cents').default(0).notNull(),
    cac_cents: integer('cac_cents').default(0).notNull(),
    churn_rate: numeric('churn_rate', { precision: 5, scale: 4 }).default('0').notNull(),
    conversion_rate: numeric('conversion_rate', { precision: 5, scale: 4 }).default('0').notNull(),
    computed_at: timestamp('computed_at', { withTimezone: true }).defaultNow().notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    periodIdx: { index: 'revenue_snapshots_period_idx', on: [table.period] },
}));
// Price experiments table
export const priceExperiments = pgTable('price_experiments', {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    plan: text('plan').notNull(),
    country: varchar('country', { length: 3 }),
    platform: transactionPlatformEnum('platform'),
    variant_a_price_cents: integer('variant_a_price_cents').notNull(),
    variant_b_price_cents: integer('variant_b_price_cents').notNull(),
    started_at: timestamp('started_at', { withTimezone: true }),
    stopped_at: timestamp('stopped_at', { withTimezone: true }),
    status: experimentStatusEnum('status').default('draft').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    slugIdx: { index: 'price_experiments_slug_idx', on: [table.slug] },
    statusIdx: { index: 'price_experiments_status_idx', on: [table.status] },
    countryPlanIdx: { index: 'price_experiments_country_plan_idx', on: [table.country, table.plan] },
}));
// Elasticity results table
export const elasticityResults = pgTable('elasticity_results', {
    id: uuid('id').primaryKey().defaultRandom(),
    country: varchar('country', { length: 3 }),
    plan: text('plan').notNull(),
    price_points: jsonb('price_points').$type().default([]).notNull(),
    demand: jsonb('demand').$type().default([]).notNull(),
    elasticity: numeric('elasticity', { precision: 8, scale: 4 }).notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    countryPlanIdx: { index: 'elasticity_results_country_plan_idx', on: [table.country, table.plan], unique: true },
}));
// Van Westendorp surveys table
export const vanWestendorpSurveys = pgTable('vanwestendorp_surveys', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    country: varchar('country', { length: 3 }).notNull(),
    responses: jsonb('responses').$type().default([]).notNull(),
    median_optimal_price: integer('median_optimal_price'),
    currency: varchar('currency', { length: 3 }).default('USD').notNull(),
    ts: timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userIdIdx: { index: 'vanwestendorp_surveys_user_id_idx', on: [table.user_id] },
    countryIdx: { index: 'vanwestendorp_surveys_country_idx', on: [table.country] },
    tsIdx: { index: 'vanwestendorp_surveys_ts_idx', on: [table.ts] },
}));
// LTV segments table
export const ltvSegments = pgTable('ltv_segments', {
    id: uuid('id').primaryKey().defaultRandom(),
    segment: ltvSegmentEnum('segment').notNull().unique(),
    avg_ltv_cents: integer('avg_ltv_cents').default(0).notNull(),
    avg_cac_cents: integer('avg_cac_cents').default(0).notNull(),
    margin_pct: numeric('margin_pct', { precision: 5, scale: 2 }).default('0').notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    segmentIdx: { index: 'ltv_segments_segment_idx', on: [table.segment] },
}));
// ============================================================================
// PARTNER REVENUE NETWORK SCHEMA
// ============================================================================
// Enums
export const partnerStatusEnum = pgEnum('partner_status', ['invited', 'active', 'suspended']);
export const partnerTierEnum = pgEnum('partner_tier', ['affiliate', 'sponsor', 'full']);
export const catalogFeedSourceEnum = pgEnum('catalog_feed_source', ['api', 's3', 'csv', 'xml']);
export const catalogAvailabilityEnum = pgEnum('catalog_availability', ['in_stock', 'out_of_stock', 'preorder', 'discontinued']);
export const campaignKindEnum = pgEnum('campaign_kind', ['sponsored_tile', 'banner', 'recipe_pin', 'search_boost']);
export const campaignStatusEnum = pgEnum('campaign_status', ['draft', 'running', 'paused', 'completed']);
export const creativeKindEnum = pgEnum('creative_kind', ['tile', 'banner', 'video', 'native']);
export const creativeStatusEnum = pgEnum('creative_status', ['pending', 'approved', 'rejected']);
export const partnerLinkKindEnum = pgEnum('partner_link_kind', ['affiliate', 'deeplink', 'cart']);
export const attributionModelEnum = pgEnum('attribution_model', ['last_click', 'first_click', 'multi']);
export const payoutStatusEnum = pgEnum('payout_status', ['pending', 'in_review', 'paid', 'failed']);
export const fraudRelatedKindEnum = pgEnum('fraud_related_kind', ['click', 'conversion', 'campaign', 'partner']);
// Partners table
export const partners = pgTable('partners', {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    contact_email: text('contact_email').notNull(),
    status: partnerStatusEnum('status').default('invited').notNull(),
    tier: partnerTierEnum('tier').default('affiliate').notNull(),
    stripe_connect_id: text('stripe_connect_id'),
    attribution_window_days: integer('attribution_window_days').default(7).notNull(),
    revenue_share_pct: numeric('revenue_share_pct', { precision: 5, scale: 4 }).default('0.10').notNull(),
    kyc_status: text('kyc_status').default('pending'),
    tax_form_status: text('tax_form_status'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    slugIdx: { index: 'partners_slug_idx', on: [table.slug] },
    statusIdx: { index: 'partners_status_idx', on: [table.status] },
    tierIdx: { index: 'partners_tier_idx', on: [table.tier] },
}));
// Partner API keys table
export const partnerApiKeys = pgTable('partner_api_keys', {
    id: uuid('id').primaryKey().defaultRandom(),
    partner_id: uuid('partner_id').references(() => partners.id, { onDelete: 'cascade' }).notNull(),
    key_hash: text('key_hash').notNull(),
    scopes: text('scopes').array().notNull().default([]),
    last_used_at: timestamp('last_used_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    partnerIdIdx: { index: 'partner_api_keys_partner_id_idx', on: [table.partner_id] },
    keyHashIdx: { index: 'partner_api_keys_key_hash_idx', on: [table.key_hash] },
}));
// Catalog feeds table
export const catalogFeeds = pgTable('catalog_feeds', {
    id: uuid('id').primaryKey().defaultRandom(),
    partner_id: uuid('partner_id').references(() => partners.id, { onDelete: 'cascade' }).notNull(),
    source: catalogFeedSourceEnum('source').notNull(),
    url: text('url'),
    schedule_cron: text('schedule_cron'),
    last_sync_at: timestamp('last_sync_at', { withTimezone: true }),
    status: text('status').default('pending'),
    notes: text('notes'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    partnerIdIdx: { index: 'catalog_feeds_partner_id_idx', on: [table.partner_id] },
    statusIdx: { index: 'catalog_feeds_status_idx', on: [table.status] },
}));
// Catalog items table
export const catalogItems = pgTable('catalog_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    partner_id: uuid('partner_id').references(() => partners.id, { onDelete: 'cascade' }).notNull(),
    sku: text('sku').notNull(),
    title: text('title').notNull(),
    brand: text('brand'),
    url: text('url'),
    image_url: text('image_url'),
    price_cents: integer('price_cents'),
    currency: varchar('currency', { length: 3 }).default('USD').notNull(),
    availability: catalogAvailabilityEnum('availability').default('in_stock'),
    tags: text('tags').array().default([]),
    affiliateable: boolean('affiliateable').default(true).notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    partnerIdIdx: { index: 'catalog_items_partner_id_idx', on: [table.partner_id] },
    skuIdx: { index: 'catalog_items_sku_idx', on: [table.sku] },
    affiliateableIdx: { index: 'catalog_items_affiliateable_idx', on: [table.affiliateable] },
    partnerSkuUnique: { unique: true, columns: [table.partner_id, table.sku] },
}));
// Campaigns table
export const campaigns = pgTable('campaigns', {
    id: uuid('id').primaryKey().defaultRandom(),
    partner_id: uuid('partner_id').references(() => partners.id, { onDelete: 'cascade' }).notNull(),
    name: text('name').notNull(),
    kind: campaignKindEnum('kind').notNull(),
    start_at: timestamp('start_at', { withTimezone: true }).notNull(),
    end_at: timestamp('end_at', { withTimezone: true }),
    budget_cents: integer('budget_cents').notNull(),
    currency: varchar('currency', { length: 3 }).default('USD').notNull(),
    cpm_cents: integer('cpm_cents'),
    cpc_cents: integer('cpc_cents'),
    cpa_cents: integer('cpa_cents'),
    cap_daily: integer('cap_daily'),
    status: campaignStatusEnum('status').default('draft').notNull(),
    targeting: jsonb('targeting').default({}),
    spent_cents: integer('spent_cents').default(0).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    partnerIdIdx: { index: 'campaigns_partner_id_idx', on: [table.partner_id] },
    statusIdx: { index: 'campaigns_status_idx', on: [table.status] },
    kindIdx: { index: 'campaigns_kind_idx', on: [table.kind] },
}));
// Creatives table
export const creatives = pgTable('creatives', {
    id: uuid('id').primaryKey().defaultRandom(),
    campaign_id: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }).notNull(),
    kind: creativeKindEnum('kind').notNull(),
    assets: jsonb('assets').default({}),
    click_url: text('click_url'),
    impression_url: text('impression_url'),
    width: integer('width'),
    height: integer('height'),
    status: creativeStatusEnum('status').default('pending').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    campaignIdIdx: { index: 'creatives_campaign_id_idx', on: [table.campaign_id] },
    statusIdx: { index: 'creatives_status_idx', on: [table.status] },
}));
// Placements table
export const placements = pgTable('placements', {
    id: uuid('id').primaryKey().defaultRandom(),
    campaign_id: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'cascade' }).notNull(),
    slot: text('slot').notNull(),
    rules: jsonb('rules').default({}),
    priority: integer('priority').default(0).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    campaignIdIdx: { index: 'placements_campaign_id_idx', on: [table.campaign_id] },
    slotIdx: { index: 'placements_slot_idx', on: [table.slot] },
}));
// Partner links table
export const partnerLinks = pgTable('partner_links', {
    id: uuid('id').primaryKey().defaultRandom(),
    partner_id: uuid('partner_id').references(() => partners.id, { onDelete: 'cascade' }).notNull(),
    sku: text('sku'),
    kind: partnerLinkKindEnum('kind').notNull(),
    signed_url: text('signed_url').notNull(),
    expires_at: timestamp('expires_at', { withTimezone: true }),
    meta: jsonb('meta').default({}),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    partnerIdIdx: { index: 'partner_links_partner_id_idx', on: [table.partner_id] },
    signedUrlIdx: { index: 'partner_links_signed_url_idx', on: [table.signed_url] },
    expiresAtIdx: { index: 'partner_links_expires_at_idx', on: [table.expires_at] },
}));
// Clicks table
export const clicks = pgTable('clicks', {
    id: uuid('id').primaryKey().defaultRandom(),
    ts: timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    anon_id: text('anon_id'),
    partner_id: uuid('partner_id').references(() => partners.id, { onDelete: 'cascade' }).notNull(),
    campaign_id: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
    sku: text('sku'),
    source: text('source'),
    country: varchar('country', { length: 3 }),
    ua_hash: text('ua_hash'),
    ip_hash: text('ip_hash'),
    consent: boolean('consent').default(false).notNull(),
    signature: text('signature'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    partnerIdIdx: { index: 'clicks_partner_id_idx', on: [table.partner_id] },
    campaignIdIdx: { index: 'clicks_campaign_id_idx', on: [table.campaign_id] },
    tsIdx: { index: 'clicks_ts_idx', on: [table.ts] },
    userIdIdx: { index: 'clicks_user_id_idx', on: [table.user_id] },
    anonIdIdx: { index: 'clicks_anon_id_idx', on: [table.anon_id] },
    partnerTsIdx: { index: 'clicks_partner_ts_idx', on: [table.partner_id, table.ts] },
}));
// Conversions table
export const conversions = pgTable('conversions', {
    id: uuid('id').primaryKey().defaultRandom(),
    ts: timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
    partner_id: uuid('partner_id').references(() => partners.id, { onDelete: 'cascade' }).notNull(),
    campaign_id: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
    order_id: text('order_id').notNull(),
    sku: text('sku'),
    amount_cents: integer('amount_cents').notNull(),
    currency: varchar('currency', { length: 3 }).default('USD').notNull(),
    attribution: attributionModelEnum('attribution').default('last_click').notNull(),
    click_id: uuid('click_id').references(() => clicks.id, { onDelete: 'set null' }),
    meta: jsonb('meta').default({}),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    partnerIdIdx: { index: 'conversions_partner_id_idx', on: [table.partner_id] },
    campaignIdIdx: { index: 'conversions_campaign_id_idx', on: [table.campaign_id] },
    orderIdIdx: { index: 'conversions_order_id_idx', on: [table.order_id] },
    tsIdx: { index: 'conversions_ts_idx', on: [table.ts] },
    clickIdIdx: { index: 'conversions_click_id_idx', on: [table.click_id] },
    partnerOrderUnique: { unique: true, columns: [table.partner_id, table.order_id] },
}));
// Payouts table
export const payouts = pgTable('payouts', {
    id: uuid('id').primaryKey().defaultRandom(),
    partner_id: uuid('partner_id').references(() => partners.id, { onDelete: 'cascade' }).notNull(),
    period_start: date('period_start').notNull(),
    period_end: date('period_end').notNull(),
    revenue_cents: integer('revenue_cents').default(0).notNull(),
    share_pct: numeric('share_pct', { precision: 5, scale: 4 }).notNull(),
    payout_cents: integer('payout_cents').notNull(),
    currency: varchar('currency', { length: 3 }).default('USD').notNull(),
    status: payoutStatusEnum('status').default('pending').notNull(),
    stripe_transfer_id: text('stripe_transfer_id'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    partnerIdIdx: { index: 'payouts_partner_id_idx', on: [table.partner_id] },
    statusIdx: { index: 'payouts_status_idx', on: [table.status] },
    periodIdx: { index: 'payouts_period_idx', on: [table.period_start, table.period_end] },
}));
// Fraud signals table
export const fraudSignals = pgTable('fraud_signals', {
    id: uuid('id').primaryKey().defaultRandom(),
    related_id: uuid('related_id').notNull(),
    related_kind: fraudRelatedKindEnum('related_kind').notNull(),
    signal: text('signal').notNull(),
    score: numeric('score', { precision: 3, scale: 2 }).notNull(),
    ts: timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    relatedIdx: { index: 'fraud_signals_related_idx', on: [table.related_id, table.related_kind] },
    scoreIdx: { index: 'fraud_signals_score_idx', on: [table.score] },
    tsIdx: { index: 'fraud_signals_ts_idx', on: [table.ts] },
}));
// Relations for partner tables
export const partnersRelations = relations(partners, ({ many }) => ({
    apiKeys: many(partnerApiKeys),
    catalogFeeds: many(catalogFeeds),
    catalogItems: many(catalogItems),
    campaigns: many(campaigns),
    partnerLinks: many(partnerLinks),
    clicks: many(clicks),
    conversions: many(conversions),
    payouts: many(payouts),
}));
export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
    partner: one(partners, { fields: [campaigns.partner_id], references: [partners.id] }),
    creatives: many(creatives),
    placements: many(placements),
    clicks: many(clicks),
    conversions: many(conversions),
}));
export const catalogFeedsRelations = relations(catalogFeeds, ({ one }) => ({
    partner: one(partners, { fields: [catalogFeeds.partner_id], references: [partners.id] }),
}));
export const catalogItemsRelations = relations(catalogItems, ({ one }) => ({
    partner: one(partners, { fields: [catalogItems.partner_id], references: [partners.id] }),
}));
export const creativesRelations = relations(creatives, ({ one }) => ({
    campaign: one(campaigns, { fields: [creatives.campaign_id], references: [campaigns.id] }),
}));
export const clicksRelations = relations(clicks, ({ one }) => ({
    user: one(users, { fields: [clicks.user_id], references: [users.id] }),
    partner: one(partners, { fields: [clicks.partner_id], references: [partners.id] }),
    campaign: one(campaigns, { fields: [clicks.campaign_id], references: [campaigns.id] }),
}));
export const conversionsRelations = relations(conversions, ({ one }) => ({
    partner: one(partners, { fields: [conversions.partner_id], references: [partners.id] }),
    campaign: one(campaigns, { fields: [conversions.campaign_id], references: [campaigns.id] }),
    click: one(clicks, { fields: [conversions.click_id], references: [clicks.id] }),
}));
// ============================================================================
// ADMIN OPS & TRUST CENTER SCHEMA
// ============================================================================
// Enums
export const adminRoleEnum = pgEnum('admin_role', ['superadmin', 'finance', 'reviewer', 'support', 'privacy_officer', 'auditor']);
export const adminStatusEnum = pgEnum('admin_status', ['active', 'suspended']);
export const moderationEntityKindEnum = pgEnum('moderation_entity_kind', ['campaign', 'creative', 'partner', 'message']);
export const moderationPriorityEnum = pgEnum('moderation_priority', ['low', 'normal', 'high']);
export const moderationStatusEnum = pgEnum('moderation_status', ['open', 'in_review', 'resolved', 'escalated']);
export const incidentSeverityEnum = pgEnum('incident_severity', ['low', 'major', 'critical']);
export const incidentStatusEnum = pgEnum('incident_status', ['open', 'mitigated', 'closed']);
export const dataAccessActionEnum = pgEnum('data_access_action', ['read', 'export', 'delete', 'modify']);
// Admin users table
export const adminUsers = pgTable('admin_users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    role: adminRoleEnum('role').notNull(),
    status: adminStatusEnum('status').default('active').notNull(),
    last_login_at: timestamp('last_login_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    emailIdx: { index: 'admin_users_email_idx', on: [table.email] },
    roleIdx: { index: 'admin_users_role_idx', on: [table.role] },
    statusIdx: { index: 'admin_users_status_idx', on: [table.status] },
}));
// Audit logs table (immutable, append-only)
export const auditLogs = pgTable('audit_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    actor_id: uuid('actor_id').references(() => adminUsers.id, { onDelete: 'set null' }),
    entity_kind: text('entity_kind').notNull(),
    entity_id: uuid('entity_id'),
    action: text('action').notNull(),
    before: jsonb('before').$type(),
    after: jsonb('after').$type(),
    reason: text('reason'),
    ts: timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
    signature: text('signature').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    actorIdx: { index: 'audit_logs_actor_id_idx', on: [table.actor_id] },
    entityIdx: { index: 'audit_logs_entity_idx', on: [table.entity_kind, table.entity_id] },
    tsIdx: { index: 'audit_logs_ts_idx', on: [table.ts] },
    signatureIdx: { index: 'audit_logs_signature_idx', on: [table.signature] },
}));
// Moderation queue table
export const moderationQueue = pgTable('moderation_queue', {
    id: uuid('id').primaryKey().defaultRandom(),
    entity_kind: moderationEntityKindEnum('entity_kind').notNull(),
    entity_id: uuid('entity_id').notNull(),
    priority: moderationPriorityEnum('priority').default('normal').notNull(),
    status: moderationStatusEnum('status').default('open').notNull(),
    flag_reason: text('flag_reason'),
    assigned_to: uuid('assigned_to').references(() => adminUsers.id, { onDelete: 'set null' }),
    notes: text('notes'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    entityIdx: { index: 'moderation_queue_entity_idx', on: [table.entity_kind, table.entity_id] },
    statusIdx: { index: 'moderation_queue_status_idx', on: [table.status] },
    priorityIdx: { index: 'moderation_queue_priority_idx', on: [table.priority] },
    assignedIdx: { index: 'moderation_queue_assigned_idx', on: [table.assigned_to] },
}));
// Incidents table
export const incidents = pgTable('incidents', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    severity: incidentSeverityEnum('severity').default('low').notNull(),
    summary: text('summary').notNull(),
    opened_by: uuid('opened_by').references(() => adminUsers.id, { onDelete: 'set null' }).notNull(),
    status: incidentStatusEnum('status').default('open').notNull(),
    timeline: jsonb('timeline').$type().default([]).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    closed_at: timestamp('closed_at', { withTimezone: true }),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    statusIdx: { index: 'incidents_status_idx', on: [table.status] },
    severityIdx: { index: 'incidents_severity_idx', on: [table.severity] },
    openedByIdx: { index: 'incidents_opened_by_idx', on: [table.opened_by] },
}));
// Data access logs table
export const dataAccessLogs = pgTable('data_access_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    admin_id: uuid('admin_id').references(() => adminUsers.id, { onDelete: 'set null' }),
    action: dataAccessActionEnum('action').notNull(),
    resource: text('resource').notNull(),
    success: boolean('success').default(true).notNull(),
    ts: timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userIdx: { index: 'data_access_logs_user_id_idx', on: [table.user_id] },
    adminIdx: { index: 'data_access_logs_admin_id_idx', on: [table.admin_id] },
    tsIdx: { index: 'data_access_logs_ts_idx', on: [table.ts] },
    resourceIdx: { index: 'data_access_logs_resource_idx', on: [table.resource] },
}));
// Retention policies table
export const retentionPolicies = pgTable('retention_policies', {
    id: uuid('id').primaryKey().defaultRandom(),
    category: text('category').notNull().unique(),
    days: integer('days').notNull(),
    auto_purge: boolean('auto_purge').default(true).notNull(),
    last_run_at: timestamp('last_run_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    categoryIdx: { index: 'retention_policies_category_idx', on: [table.category] },
}));
// Relations for admin tables
export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
    auditLogs: many(auditLogs),
    moderationAssigned: many(moderationQueue),
    incidentsOpened: many(incidents),
    dataAccessLogs: many(dataAccessLogs),
}));
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
    actor: one(adminUsers, { fields: [auditLogs.actor_id], references: [adminUsers.id] }),
}));
export const moderationQueueRelations = relations(moderationQueue, ({ one }) => ({
    assignedTo: one(adminUsers, { fields: [moderationQueue.assigned_to], references: [adminUsers.id] }),
}));
export const incidentsRelations = relations(incidents, ({ one }) => ({
    openedBy: one(adminUsers, { fields: [incidents.opened_by], references: [adminUsers.id] }),
}));
export const dataAccessLogsRelations = relations(dataAccessLogs, ({ one }) => ({
    user: one(users, { fields: [dataAccessLogs.user_id], references: [users.id] }),
    admin: one(adminUsers, { fields: [dataAccessLogs.admin_id], references: [adminUsers.id] }),
}));
// ============================================================================
// REGTECH LAYER SCHEMA
// ============================================================================
// Enums
export const dsarRequestTypeEnum = pgEnum('dsar_request_type', ['export', 'erase', 'restrict', 'rectify']);
export const dsarRequestStatusEnum = pgEnum('dsar_request_status', ['received', 'verifying', 'in_progress', 'complete', 'rejected']);
export const dsarChannelEnum = pgEnum('dsar_channel', ['portal', 'email', 'api']);
export const dsarRegionEnum = pgEnum('dsar_region', ['gdpr', 'ccpa', 'cpra', 'other']);
export const dsarArtifactKindEnum = pgEnum('dsar_artifact_kind', ['data_export', 'erasure_log', 'correction_log', 'restriction_token']);
export const lawfulBasisEnum = pgEnum('lawful_basis', ['consent', 'contract', 'legitimate_interest', 'legal_obligation']);
export const riskCategoryEnum = pgEnum('risk_category', ['security', 'privacy', 'operational', 'vendor']);
export const riskSeverityEnum = pgEnum('risk_severity', ['low', 'med', 'high', 'critical']);
export const riskLikelihoodEnum = pgEnum('risk_likelihood', ['unlikely', 'possible', 'likely']);
export const riskStatusEnum = pgEnum('risk_status', ['open', 'mitigated', 'accepted', 'transferred']);
export const controlFrameworkEnum = pgEnum('control_framework', ['soc2', 'iso27001', 'custom']);
export const controlFrequencyEnum = pgEnum('control_frequency', ['continuous', 'daily', 'weekly', 'monthly', 'quarterly']);
export const evidenceKindEnum = pgEnum('evidence_kind', ['log', 'screenshot', 'report', 'config']);
export const controlStatusEnum = pgEnum('control_status', ['passing', 'failing', 'waived']);
export const controlResultEnum = pgEnum('control_result', ['pass', 'fail', 'waive']);
export const vendorCategoryEnum = pgEnum('vendor_category', ['hosting', 'analytics', 'ads', 'payments', 'crm', 'devtools']);
export const vendorRiskLevelEnum = pgEnum('vendor_risk_level', ['low', 'med', 'high']);
export const vendorStatusEnum = pgEnum('vendor_status', ['approved', 'pending', 'denied']);
export const residualRiskEnum = pgEnum('residual_risk', ['low', 'med', 'high']);
export const dpiaDecisionEnum = pgEnum('dpia_decision', ['proceed', 'revise', 'block']);
export const regulatoryRegionEnum = pgEnum('regulatory_region', ['gdpr', 'ccpa', 'cpra', 'other']);
// DSAR Requests table
export const dsarRequests = pgTable('dsar_requests', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    email: varchar('email', { length: 255 }).notNull(),
    type: dsarRequestTypeEnum('type').notNull(),
    status: dsarRequestStatusEnum('status').default('received').notNull(),
    submitted_at: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
    verified_at: timestamp('verified_at', { withTimezone: true }),
    completed_at: timestamp('completed_at', { withTimezone: true }),
    reason: text('reason'),
    channel: dsarChannelEnum('channel').default('portal').notNull(),
    region: dsarRegionEnum('region').default('gdpr').notNull(),
    window_deadline: timestamp('window_deadline', { withTimezone: true }).notNull(),
    artifacts: jsonb('artifacts').$type().default([]).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userIdIdx: { index: 'dsar_requests_user_id_idx', on: [table.user_id] },
    emailIdx: { index: 'dsar_requests_email_idx', on: [table.email] },
    statusIdx: { index: 'dsar_requests_status_idx', on: [table.status] },
    regionIdx: { index: 'dsar_requests_region_idx', on: [table.region] },
    windowDeadlineIdx: { index: 'dsar_requests_window_deadline_idx', on: [table.window_deadline] },
}));
// DSAR Artifacts table
export const dsarArtifacts = pgTable('dsar_artifacts', {
    id: uuid('id').primaryKey().defaultRandom(),
    request_id: uuid('request_id').references(() => dsarRequests.id, { onDelete: 'cascade' }).notNull(),
    kind: dsarArtifactKindEnum('kind').notNull(),
    url: text('url').notNull(),
    checksum: text('checksum').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    requestIdIdx: { index: 'dsar_artifacts_request_id_idx', on: [table.request_id] },
    kindIdx: { index: 'dsar_artifacts_kind_idx', on: [table.kind] },
}));
// Processing Activities table
export const processingActivities = pgTable('processing_activities', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    purpose: text('purpose').notNull(),
    lawful_basis: lawfulBasisEnum('lawful_basis').notNull(),
    data_categories: text('data_categories').array().default([]).notNull(),
    recipients: text('recipients').array().default([]).notNull(),
    dpa_links: text('dpa_links').array().default([]).notNull(),
    retention_days: integer('retention_days'),
    systems: text('systems').array().default([]).notNull(),
    last_reviewed_at: timestamp('last_reviewed_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    nameIdx: { index: 'processing_activities_name_idx', on: [table.name] },
    lawfulBasisIdx: { index: 'processing_activities_lawful_basis_idx', on: [table.lawful_basis] },
}));
// Risk Register table
export const riskRegister = pgTable('risk_register', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    category: riskCategoryEnum('category').notNull(),
    severity: riskSeverityEnum('severity').notNull(),
    likelihood: riskLikelihoodEnum('likelihood').notNull(),
    owner: text('owner').notNull(),
    status: riskStatusEnum('status').default('open').notNull(),
    controls: text('controls').array().default([]).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    categoryIdx: { index: 'risk_register_category_idx', on: [table.category] },
    severityIdx: { index: 'risk_register_severity_idx', on: [table.severity] },
    statusIdx: { index: 'risk_register_status_idx', on: [table.status] },
    ownerIdx: { index: 'risk_register_owner_idx', on: [table.owner] },
}));
// Controls table
export const controls = pgTable('controls', {
    id: uuid('id').primaryKey().defaultRandom(),
    key: text('key').unique().notNull(),
    framework: controlFrameworkEnum('framework').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    owner: text('owner').notNull(),
    frequency: controlFrequencyEnum('frequency').default('monthly').notNull(),
    evidence_kind: evidenceKindEnum('evidence_kind').default('report').notNull(),
    last_checked_at: timestamp('last_checked_at', { withTimezone: true }),
    status: controlStatusEnum('status').default('failing').notNull(),
    notes: text('notes'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    keyIdx: { index: 'controls_key_idx', on: [table.key] },
    frameworkIdx: { index: 'controls_framework_idx', on: [table.framework] },
    statusIdx: { index: 'controls_status_idx', on: [table.status] },
    ownerIdx: { index: 'controls_owner_idx', on: [table.owner] },
}));
// Control Evidence table
export const controlEvidence = pgTable('control_evidence', {
    id: uuid('id').primaryKey().defaultRandom(),
    control_id: uuid('control_id').references(() => controls.id, { onDelete: 'cascade' }).notNull(),
    ts: timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
    result: controlResultEnum('result').notNull(),
    artifact_url: text('artifact_url').notNull(),
    artifact_checksum: text('artifact_checksum').notNull(),
    collector: text('collector').notNull(),
    meta: jsonb('meta').$type().default({}).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    controlIdIdx: { index: 'control_evidence_control_id_idx', on: [table.control_id] },
    resultIdx: { index: 'control_evidence_result_idx', on: [table.result] },
    tsIdx: { index: 'control_evidence_ts_idx', on: [table.ts] },
    collectorIdx: { index: 'control_evidence_collector_idx', on: [table.collector] },
}));
// Vendor Catalog table
export const vendorCatalog = pgTable('vendor_catalog', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    category: vendorCategoryEnum('category').notNull(),
    dpa_url: text('dpa_url'),
    subprocessor: boolean('subprocessor').default(false).notNull(),
    pii_access: boolean('pii_access').default(false).notNull(),
    risk_level: vendorRiskLevelEnum('risk_level').default('med').notNull(),
    status: vendorStatusEnum('status').default('pending').notNull(),
    owner: text('owner').notNull(),
    review_date: timestamp('review_date', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    nameIdx: { index: 'vendor_catalog_name_idx', on: [table.name] },
    categoryIdx: { index: 'vendor_catalog_category_idx', on: [table.category] },
    statusIdx: { index: 'vendor_catalog_status_idx', on: [table.status] },
    riskLevelIdx: { index: 'vendor_catalog_risk_level_idx', on: [table.risk_level] },
}));
// DPIA Records table
export const dpiaRecords = pgTable('dpia_records', {
    id: uuid('id').primaryKey().defaultRandom(),
    processing_activity_id: uuid('processing_activity_id').references(() => processingActivities.id, { onDelete: 'set null' }),
    summary: text('summary').notNull(),
    risks: text('risks').array().default([]).notNull(),
    mitigations: text('mitigations').array().default([]).notNull(),
    residual_risk: residualRiskEnum('residual_risk').notNull(),
    decision: dpiaDecisionEnum('decision').default('proceed').notNull(),
    reviewer: text('reviewer').notNull(),
    reviewed_at: timestamp('reviewed_at', { withTimezone: true }).defaultNow().notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    processingActivityIdIdx: { index: 'dpia_records_processing_activity_id_idx', on: [table.processing_activity_id] },
    residualRiskIdx: { index: 'dpia_records_residual_risk_idx', on: [table.residual_risk] },
    decisionIdx: { index: 'dpia_records_decision_idx', on: [table.decision] },
}));
// Legal Hold table
export const legalHold = pgTable('legal_hold', {
    id: uuid('id').primaryKey().defaultRandom(),
    scope: text('scope').notNull(),
    active: boolean('active').default(true).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    activeIdx: { index: 'legal_hold_active_idx', on: [table.active] },
    scopeIdx: { index: 'legal_hold_scope_idx', on: [table.scope] },
}));
// Regulatory Reports table
export const regulatoryReports = pgTable('regulatory_reports', {
    id: uuid('id').primaryKey().defaultRandom(),
    period_start: timestamp('period_start', { withTimezone: true }).notNull(),
    period_end: timestamp('period_end', { withTimezone: true }).notNull(),
    region: regulatoryRegionEnum('region').notNull(),
    metrics: jsonb('metrics').$type().notNull(),
    generated_at: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    regionIdx: { index: 'regulatory_reports_region_idx', on: [table.region] },
    periodIdx: { index: 'regulatory_reports_period_idx', on: [table.period_start, table.period_end] },
    generatedAtIdx: { index: 'regulatory_reports_generated_at_idx', on: [table.generated_at] },
}));
// Relations
export const dsarRequestsRelations = relations(dsarRequests, ({ one, many }) => ({
    user: one(users, { fields: [dsarRequests.user_id], references: [users.id] }),
    artifacts: many(dsarArtifacts),
}));
export const dsarArtifactsRelations = relations(dsarArtifacts, ({ one }) => ({
    request: one(dsarRequests, { fields: [dsarArtifacts.request_id], references: [dsarRequests.id] }),
}));
export const processingActivitiesRelations = relations(processingActivities, ({ many }) => ({
    dpiaRecords: many(dpiaRecords),
}));
export const controlsRelations = relations(controls, ({ many }) => ({
    evidence: many(controlEvidence),
}));
export const controlEvidenceRelations = relations(controlEvidence, ({ one }) => ({
    control: one(controls, { fields: [controlEvidence.control_id], references: [controls.id] }),
}));
export const dpiaRecordsRelations = relations(dpiaRecords, ({ one }) => ({
    processingActivity: one(processingActivities, { fields: [dpiaRecords.processing_activity_id], references: [processingActivities.id] }),
}));
// ============================================================================
// PRIVACY-FIRST USAGE MONITORING SCHEMA
// ============================================================================
// Enums
export const monitoringScopeEnum = pgEnum('monitoring_scope', ['metadata_only', 'metadata_plus_usage', 'none']);
export const telemetryEventTypeEnum = pgEnum('telemetry_event_type', ['app_focus', 'app_switch', 'window_change', 'duration', 'interaction']);
export const transparencyLogActionEnum = pgEnum('transparency_log_action', ['consent_granted', 'consent_revoked', 'app_added', 'app_removed', 'signal_toggled', 'data_exported', 'data_deleted', 'policy_changed', 'mfa_verified', 'session_elevated']);
// Privacy preferences table (per-user)
export const privacyPrefs = pgTable('privacy_prefs', {
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).primaryKey(),
    monitoring_enabled: boolean('monitoring_enabled').default(false).notNull(),
    data_retention_days: integer('data_retention_days').default(14).notNull(),
    mfa_required: boolean('mfa_required').default(true).notNull(),
    last_reviewed_at: timestamp('last_reviewed_at', { withTimezone: true }),
    paused_until: timestamp('paused_until', { withTimezone: true }),
    kill_switch_active: boolean('kill_switch_active').default(false).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userIdIdx: { index: 'privacy_prefs_user_id_idx', on: [table.user_id] },
}));
// App allowlist table (per-user)
export const appAllowlist = pgTable('app_allowlist', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    app_id: text('app_id').notNull(),
    app_name: text('app_name').notNull(),
    enabled: boolean('enabled').default(false).notNull(),
    scope: monitoringScopeEnum('scope').default('metadata_only').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userIdIdx: { index: 'app_allowlist_user_id_idx', on: [table.user_id] },
    appIdIdx: { index: 'app_allowlist_app_id_idx', on: [table.app_id] },
    uniqueUserApp: { unique: true, columns: [table.user_id, table.app_id] },
}));
// Signal toggles table (per-user)
export const signalToggles = pgTable('signal_toggles', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    signal_key: text('signal_key').notNull(),
    enabled: boolean('enabled').default(false).notNull(),
    sampling_rate: numeric('sampling_rate', { precision: 3, scale: 2 }).default('1.0').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userIdIdx: { index: 'signal_toggles_user_id_idx', on: [table.user_id] },
    signalKeyIdx: { index: 'signal_toggles_signal_key_idx', on: [table.signal_key] },
    uniqueUserSignal: { unique: true, columns: [table.user_id, table.signal_key] },
}));
// Telemetry events table (per-user, encrypted at rest)
export const telemetryEvents = pgTable('telemetry_events', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    ts: timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
    app_id: text('app_id').notNull(),
    event_type: telemetryEventTypeEnum('event_type').notNull(),
    duration_ms: integer('duration_ms'),
    metadata_redacted_json: jsonb('metadata_redacted_json').$type().default({}),
    encrypted_payload: text('encrypted_payload'), // pgcrypto encrypted sensitive fields
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userIdIdx: { index: 'telemetry_events_user_id_idx', on: [table.user_id] },
    tsIdx: { index: 'telemetry_events_ts_idx', on: [table.ts] },
    appIdIdx: { index: 'telemetry_events_app_id_idx', on: [table.app_id] },
    userTsIdx: { index: 'telemetry_events_user_ts_idx', on: [table.user_id, table.ts] },
}));
// Privacy transparency log table (per-user, immutable append-only)
export const privacyTransparencyLog = pgTable('privacy_transparency_log', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    action: transparencyLogActionEnum('action').notNull(),
    actor_id: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    entity_type: text('entity_type'),
    entity_id: uuid('entity_id'),
    old_value_hash: text('old_value_hash'),
    new_value_hash: text('new_value_hash'),
    metadata: jsonb('metadata').$type().default({}),
    ts: timestamp('ts', { withTimezone: true }).defaultNow().notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userIdIdx: { index: 'privacy_transparency_log_user_id_idx', on: [table.user_id] },
    tsIdx: { index: 'privacy_transparency_log_ts_idx', on: [table.ts] },
    actionIdx: { index: 'privacy_transparency_log_action_idx', on: [table.action] },
}));
// MFA enforced sessions table
export const mfaEnforcedSessions = pgTable('mfa_enforced_sessions', {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    session_token: text('session_token').notNull().unique(),
    expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
    action_type: text('action_type').notNull(),
    verified_at: timestamp('verified_at', { withTimezone: true }).defaultNow().notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    userIdIdx: { index: 'mfa_enforced_sessions_user_id_idx', on: [table.user_id] },
    sessionTokenIdx: { index: 'mfa_enforced_sessions_session_token_idx', on: [table.session_token] },
    expiresAtIdx: { index: 'mfa_enforced_sessions_expires_at_idx', on: [table.expires_at] },
}));
// Relations for privacy tables
export const privacyPrefsRelations = relations(privacyPrefs, ({ one, many }) => ({
    user: one(users, { fields: [privacyPrefs.user_id], references: [users.id] }),
    appAllowlist: many(appAllowlist),
    signalToggles: many(signalToggles),
    telemetryEvents: many(telemetryEvents),
    transparencyLog: many(privacyTransparencyLog),
    mfaSessions: many(mfaEnforcedSessions),
}));
export const appAllowlistRelations = relations(appAllowlist, ({ one }) => ({
    user: one(users, { fields: [appAllowlist.user_id], references: [users.id] }),
}));
export const signalTogglesRelations = relations(signalToggles, ({ one }) => ({
    user: one(users, { fields: [signalToggles.user_id], references: [users.id] }),
}));
export const telemetryEventsRelations = relations(telemetryEvents, ({ one }) => ({
    user: one(users, { fields: [telemetryEvents.user_id], references: [users.id] }),
}));
export const privacyTransparencyLogRelations = relations(privacyTransparencyLog, ({ one }) => ({
    user: one(users, { fields: [privacyTransparencyLog.user_id], references: [users.id] }),
    actor: one(users, { fields: [privacyTransparencyLog.actor_id], references: [users.id] }),
}));
export const mfaEnforcedSessionsRelations = relations(mfaEnforcedSessions, ({ one }) => ({
    user: one(users, { fields: [mfaEnforcedSessions.user_id], references: [users.id] }),
}));
