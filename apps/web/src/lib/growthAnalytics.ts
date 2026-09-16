import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('growthanalytics');

import { supabase } from './supabaseClient';
import { Database } from './supabaseClient';

type GrowthMetric = Database['public']['Tables']['growth_metrics']['Row'];
type GrowthMetricInsert =
  Database['public']['Tables']['growth_metrics']['Insert'];
type FunnelEvent = Database['public']['Tables']['funnel_events']['Row'];
type FunnelEventInsert =
  Database['public']['Tables']['funnel_events']['Insert'];
type Referral = Database['public']['Tables']['referrals']['Row'];
type ReferralInsert = Database['public']['Tables']['referrals']['Insert'];

export interface CohortRetentionData {
  cohort_date: string;
  days_since_signup: number;
  users_in_cohort: number;
  users_retained: number;
  retention_rate: number;
}

export interface GrowthMetricsSummary {
  mrr: number;
  ltv: number;
  cac: number;
  churn_rate: number;
  conversion_rate: number;
  activation_rate: number;
  engagement_score: number;
  ai_cost_ratio: number;
}

export interface FunnelConversionRates {
  landing_to_signup: number;
  signup_to_onboarding: number;
  onboarding_to_first_recipe: number;
  first_recipe_to_subscription: number;
  subscription_to_activation: number;
}

export class GrowthAnalytics {
  /**
   * Track a funnel event for conversion analysis
   */
  static async trackFunnelEvent(
    userId: string | null,
    sessionId: string,
    stage: FunnelEvent['funnel_stage'],
    eventData: Record<string, unknown> = {},
    pageUrl?: string,
    utmSource?: string,
    utmMedium?: string,
    utmCampaign?: string
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('track_funnel_event', {
        user_id_param: userId,
        session_id_param: sessionId,
        funnel_stage_param: stage,
        event_data_param: eventData,
        page_url_param: pageUrl,
        utm_source_param: utmSource,
        utm_medium_param: utmMedium,
        utm_campaign_param: utmCampaign,
      });

      if (error) {
        // Error handled: Error tracking funnel event:
        throw error;
      }
    } catch (error) {
      // Error handled: Failed to track funnel event:
      throw error;
    }
  }

  /**
   * Get cohort retention data
   */
  static async getCohortRetention(
    cohortDate: string,
    days: number
  ): Promise<CohortRetentionData[]> {
    try {
      const { data, error } = await supabase.rpc('calculate_cohort_retention', {
        cohort_date_param: cohortDate,
        days_param: days,
      });

      if (error) {
        // Error handled: Error calculating cohort retention:
        throw error;
      }

      return data || [];
    } catch (error) {
      // Error handled: Failed to get cohort retention:
      throw error;
    }
  }

  /**
   * Calculate user LTV
   */
  static async calculateUserLTV(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('calculate_user_ltv', {
        user_id_param: userId,
      });

      if (error) {
        // Error handled: Error calculating user LTV:
        throw error;
      }

      return data || 0;
    } catch (error) {
      // Error handled: Failed to calculate user LTV:
      throw error;
    }
  }

  /**
   * Store growth metrics
   */
  static async storeGrowthMetric(
    tenantId: string,
    metricType: GrowthMetric['metric_type'],
    value: number,
    periodStart: string,
    periodEnd: string,
    cohortDate?: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      const metricData: GrowthMetricInsert = {
        tenant_id: tenantId,
        metric_type: metricType,
        value,
        period_start: periodStart,
        period_end: periodEnd,
        cohort_date: cohortDate,
        metadata,
      };

      const { error } = await supabase
        .from('growth_metrics')
        .insert(metricData);

      if (error) {
        // Error handled: Error storing growth metric:
        throw error;
      }
    } catch (error) {
      // Error handled: Failed to store growth metric:
      throw error;
    }
  }

  /**
   * Get growth metrics summary for a tenant
   */
  static async getGrowthMetricsSummary(
    tenantId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<GrowthMetricsSummary> {
    try {
      const { data, error } = await supabase
        .from('growth_metrics')
        .select('metric_type, value')
        .eq('tenant_id', tenantId)
        .eq('period_start', periodStart)
        .eq('period_end', periodEnd);

      if (error) {
        // Error handled: Error fetching growth metrics:
        throw error;
      }

      const metrics = data || [];
      const summary: GrowthMetricsSummary = {
        mrr: 0,
        ltv: 0,
        cac: 0,
        churn_rate: 0,
        conversion_rate: 0,
        activation_rate: 0,
        engagement_score: 0,
        ai_cost_ratio: 0,
      };

      metrics.forEach(metric => {
        switch (metric.metric_type) {
          case 'mrr':
            summary.mrr = metric.value;
            break;
          case 'ltv':
            summary.ltv = metric.value;
            break;
          case 'cac':
            summary.cac = metric.value;
            break;
          case 'churn_rate':
            summary.churn_rate = metric.value;
            break;
          case 'conversion_rate':
            summary.conversion_rate = metric.value;
            break;
          case 'activation_rate':
            summary.activation_rate = metric.value;
            break;
          case 'engagement_score':
            summary.engagement_score = metric.value;
            break;
          case 'ai_cost_ratio':
            summary.ai_cost_ratio = metric.value;
            break;
        }
      });

      return summary;
    } catch (error) {
      // Error handled: Failed to get growth metrics summary:
      throw error;
    }
  }

  /**
   * Calculate funnel conversion rates
   */
  static async getFunnelConversionRates(
    tenantId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<FunnelConversionRates> {
    try {
      const { data, error } = await supabase
        .from('funnel_events')
        .select('funnel_stage')
        .eq('tenant_id', tenantId)
        .gte('timestamp', periodStart)
        .lte('timestamp', periodEnd);

      if (error) {
        // Error handled: Error fetching funnel events:
        throw error;
      }

      const events = data || [];
      const stageCounts = events.reduce(
        (acc, event) => {
          acc[event.funnel_stage] = (acc[event.funnel_stage] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const rates: FunnelConversionRates = {
        landing_to_signup: 0,
        signup_to_onboarding: 0,
        onboarding_to_first_recipe: 0,
        first_recipe_to_subscription: 0,
        subscription_to_activation: 0,
      };

      // Calculate conversion rates
      if (stageCounts.landing > 0) {
        rates.landing_to_signup =
          (stageCounts.signup || 0) / stageCounts.landing;
      }
      if (stageCounts.signup > 0) {
        rates.signup_to_onboarding =
          (stageCounts.onboarding || 0) / stageCounts.signup;
      }
      if (stageCounts.onboarding > 0) {
        rates.onboarding_to_first_recipe =
          (stageCounts.first_recipe || 0) / stageCounts.onboarding;
      }
      if (stageCounts.first_recipe > 0) {
        rates.first_recipe_to_subscription =
          (stageCounts.subscription || 0) / stageCounts.first_recipe;
      }
      if (stageCounts.subscription > 0) {
        rates.subscription_to_activation =
          (stageCounts.activation || 0) / stageCounts.subscription;
      }

      return rates;
    } catch (error) {
      // Error handled: Failed to get funnel conversion rates:
      throw error;
    }
  }

  /**
   * Generate referral code for a user
   */
  static async generateReferralCode(userId: string): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('generate_referral_code');

      if (error) {
        // Error handled: Error generating referral code:
        throw error;
      }

      const referralCode = data;

      // Store the referral record
      const referralData: ReferralInsert = {
        referrer_id: userId,
        referral_code: referralCode,
        reward_type: 'pro_extension',
        reward_value: 7, // 7 days of Pro
      };

      const { error: insertError } = await supabase
        .from('referrals')
        .insert(referralData);

      if (insertError) {
        _logger.error('Error storing referral:', { insertError });
        throw insertError;
      }

      return referralCode;
    } catch (error) {
      // Error handled: Failed to generate referral code:
      throw error;
    }
  }

  /**
   * Process referral conversion
   */
  static async processReferralConversion(
    referralCode: string,
    newUserId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc(
        'process_referral_conversion',
        {
          referral_code_param: referralCode,
          new_user_id: newUserId,
        }
      );

      if (error) {
        // Error handled: Error processing referral conversion:
        throw error;
      }

      return data || false;
    } catch (error) {
      // Error handled: Failed to process referral conversion:
      throw error;
    }
  }

  /**
   * Get user's referral stats
   */
  static async getUserReferralStats(userId: string): Promise<{
    total_referrals: number;
    successful_referrals: number;
    pending_referrals: number;
    total_earnings: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('reward_status, reward_value')
        .eq('referrer_id', userId);

      if (error) {
        // Error handled: Error fetching referral stats:
        throw error;
      }

      const referrals = data || [];
      const stats = {
        total_referrals: referrals.length,
        successful_referrals: referrals.filter(
          r => r.reward_status === 'earned' || r.reward_status === 'paid'
        ).length,
        pending_referrals: referrals.filter(r => r.reward_status === 'pending')
          .length,
        total_earnings: referrals
          .filter(
            r => r.reward_status === 'earned' || r.reward_status === 'paid'
          )
          .reduce((sum, r) => sum + (r.reward_value || 0), 0),
      };

      return stats;
    } catch (error) {
      // Error handled: Failed to get user referral stats:
      throw error;
    }
  }

  /**
   * Calculate daily growth metrics for a tenant
   */
  static async calculateDailyGrowthMetrics(
    tenantId: string,
    date: string
  ): Promise<void> {
    try {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const periodStart = startOfDay.toISOString();
      const periodEnd = endOfDay.toISOString();

      // Get funnel events for the day
      const { data: funnelEvents, error: funnelError } = await supabase
        .from('funnel_events')
        .select('funnel_stage, user_id')
        .eq('tenant_id', tenantId)
        .gte('timestamp', periodStart)
        .lte('timestamp', periodEnd);

      if (funnelError) {
        _logger.error('Error fetching funnel events:', { funnelError });
        return;
      }

      const events = funnelEvents || [];
      const uniqueUsers = new Set(events.map(e => e.user_id).filter(Boolean));

      // Calculate conversion rate
      const signups = events.filter(e => e.funnel_stage === 'signup').length;
      const subscriptions = events.filter(
        e => e.funnel_stage === 'subscription'
      ).length;
      const conversionRate = signups > 0 ? subscriptions / signups : 0;

      // Calculate activation rate
      const activations = events.filter(
        e => e.funnel_stage === 'activation'
      ).length;
      const activationRate =
        subscriptions > 0 ? activations / subscriptions : 0;

      // Calculate engagement score (simplified)
      const totalEvents = events.length;
      const engagementScore =
        uniqueUsers.size > 0 ? totalEvents / uniqueUsers.size : 0;

      // Store metrics
      await Promise.all([
        this.storeGrowthMetric(
          tenantId,
          'conversion_rate',
          conversionRate,
          periodStart,
          periodEnd
        ),
        this.storeGrowthMetric(
          tenantId,
          'activation_rate',
          activationRate,
          periodStart,
          periodEnd
        ),
        this.storeGrowthMetric(
          tenantId,
          'engagement_score',
          engagementScore,
          periodStart,
          periodEnd
        ),
      ]);
    } catch (error) {
      // Error handled: Failed to calculate daily growth metrics:
      throw error;
    }
  }

  /**
   * Get growth trends for a tenant
   */
  static async getGrowthTrends(
    tenantId: string,
    days: number = 30
  ): Promise<{
    dates: string[];
    metrics: Record<string, number[]>;
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('growth_metrics')
        .select('metric_type, value, period_start')
        .eq('tenant_id', tenantId)
        .gte('period_start', startDate.toISOString())
        .lte('period_start', endDate.toISOString())
        .order('period_start', { ascending: true });

      if (error) {
        // Error handled: Error fetching growth trends:
        throw error;
      }

      const metrics = data || [];
      const dates = Array.from({ length: days }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        return date.toISOString().split('T')[0];
      });

      const metricTypes = [
        'mrr',
        'ltv',
        'cac',
        'churn_rate',
        'conversion_rate',
        'activation_rate',
        'engagement_score',
      ];
      const trends: Record<string, number[]> = {};

      metricTypes.forEach(type => {
        trends[type] = dates.map(date => {
          const metric = metrics.find(
            m => m.metric_type === type && m.period_start.startsWith(date)
          );
          return metric ? metric.value : 0;
        });
      });

      return { dates, metrics: trends };
    } catch (error) {
      // Error handled: Failed to get growth trends:
      throw error;
    }
  }
}
