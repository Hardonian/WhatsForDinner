/**
 * Freemium Conversion Optimizer
 * 
 * Maximizes free-to-paid conversion through:
 * - Strategic paywall placement
 * - Value demonstration
 * - Friction reduction
 * - Social proof
 */

import { createComponentLogger } from '@whats-for-dinner/utils';
import { supabase } from '../supabaseClient';
import { analytics } from '../analytics';
import { valueEngine } from './value-engine';

const _logger = createComponentLogger('freemium-converter');

export interface ConversionTrigger {
  id: string;
  type: 'usage_limit' | 'feature_gate' | 'value_demo' | 'social_proof' | 'time_based';
  condition: () => Promise<boolean>;
  action: 'show_paywall' | 'offer_trial' | 'show_benefits' | 'offer_discount';
  priority: number;
  conversionRate: number; // Historical conversion rate
}

export interface PaywallStrategy {
  id: string;
  name: string;
  placement: 'modal' | 'inline' | 'banner' | 'interstitial';
  timing: 'immediate' | 'after_action' | 'after_value' | 'delayed';
  trigger: string;
  design: 'minimal' | 'feature_rich' | 'social_proof' | 'urgency';
  conversionRate: number;
}

export class FreemiumConverter {
  /**
   * Determine if paywall should be shown
   */
  async shouldShowPaywall(
    userId: string,
    tenantId: string,
    context: {
      page: string;
      action?: string;
      featureAttempted?: string;
    }
  ): Promise<{ show: boolean; strategy: PaywallStrategy | null; reason: string }> {
    try {
      // Get user's current plan
      const { data: tenant } = await supabase
        .from('tenants')
        .select('plan')
        .eq('id', tenantId)
        .single();

      if (tenant?.plan !== 'free') {
        return { show: false, strategy: null, reason: 'User already has paid plan' };
      }

      // Get user's value profile
      const profile = await valueEngine.analyzeCustomerValue(userId, tenantId);

      // Check conversion triggers
      const triggers = await this.getConversionTriggers(userId, tenantId, context);
      const activeTrigger = triggers.find(t => t.condition());

      if (!activeTrigger) {
        return { show: false, strategy: null, reason: 'No active conversion trigger' };
      }

      // Select best paywall strategy
      const strategy = await this.selectPaywallStrategy(profile, activeTrigger, context);

      return {
        show: true,
        strategy,
        reason: `Trigger: ${activeTrigger.type}, Strategy: ${strategy.name}`,
      };
    } catch (error) {
      _logger.error('Error determining paywall display', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return { show: false, strategy: null, reason: 'Error occurred' };
    }
  }

  /**
   * Get conversion triggers for user
   */
  private async getConversionTriggers(
    userId: string,
    tenantId: string,
    context: { page: string; action?: string; featureAttempted?: string }
  ): Promise<ConversionTrigger[]> {
    const triggers: ConversionTrigger[] = [];

    // Trigger 1: Usage limit reached
    triggers.push({
      id: 'usage-limit',
      type: 'usage_limit',
      condition: async () => {
        const { data: usage } = await supabase
          .from('tenant_usage')
          .select('total_meals_today, plan_quota')
          .eq('tenant_id', tenantId)
          .single();
        return (usage?.total_meals_today || 0) >= (usage?.plan_quota || 5);
      },
      action: 'show_paywall',
      priority: 10,
      conversionRate: 0.35,
    });

    // Trigger 2: Premium feature attempted
    if (context.featureAttempted) {
      triggers.push({
        id: 'feature-gate',
        type: 'feature_gate',
        condition: async () => true,
        action: 'show_paywall',
        priority: 9,
        conversionRate: 0.30,
      });
    }

    // Trigger 3: High engagement (value demo)
    triggers.push({
      id: 'value-demo',
      type: 'value_demo',
      condition: async () => {
        const profile = await valueEngine.analyzeCustomerValue(userId, tenantId);
        return profile.engagementScore > 60 && profile.usagePatterns.retentionDays > 3;
      },
      action: 'offer_trial',
      priority: 7,
      conversionRate: 0.25,
    });

    // Trigger 4: Time-based (after 7 days)
    triggers.push({
      id: 'time-based',
      type: 'time_based',
      condition: async () => {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('created_at')
          .eq('user_id', userId)
          .single();
        
        if (!subscription?.created_at) return false;
        
        const daysSinceSignup = Math.floor(
          (Date.now() - new Date(subscription.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceSignup >= 7;
      },
      action: 'show_benefits',
      priority: 5,
      conversionRate: 0.15,
    });

    return triggers.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Select best paywall strategy
   */
  private async selectPaywallStrategy(
    profile: any,
    trigger: ConversionTrigger,
    context: { page: string; action?: string }
  ): Promise<PaywallStrategy> {
    const strategies: PaywallStrategy[] = [
      {
        id: 'urgency-modal',
        name: 'Urgency Modal',
        placement: 'modal',
        timing: 'immediate',
        trigger: trigger.id,
        design: 'urgency',
        conversionRate: 0.35,
      },
      {
        id: 'value-inline',
        name: 'Value Inline',
        placement: 'inline',
        timing: 'after_value',
        trigger: trigger.id,
        design: 'feature_rich',
        conversionRate: 0.28,
      },
      {
        id: 'trial-offer',
        name: 'Trial Offer',
        placement: 'modal',
        timing: 'after_action',
        trigger: trigger.id,
        design: 'minimal',
        conversionRate: 0.40,
      },
      {
        id: 'social-proof',
        name: 'Social Proof',
        placement: 'banner',
        timing: 'delayed',
        trigger: trigger.id,
        design: 'social_proof',
        conversionRate: 0.22,
      },
    ];

    // Select strategy based on trigger and profile
    if (trigger.type === 'usage_limit') {
      return strategies.find(s => s.id === 'urgency-modal') || strategies[0];
    } else if (trigger.type === 'value_demo') {
      return strategies.find(s => s.id === 'trial-offer') || strategies[2];
    } else if (profile.engagementScore > 70) {
      return strategies.find(s => s.id === 'value-inline') || strategies[1];
    }

    return strategies[0];
  }

  /**
   * Track paywall impression
   */
  async trackPaywallImpression(
    userId: string,
    strategyId: string,
    triggerId: string
  ): Promise<void> {
    await analytics.trackEvent('paywall_impression', {
      user_id: userId,
      strategy_id: strategyId,
      trigger_id: triggerId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track paywall conversion
   */
  async trackPaywallConversion(
    userId: string,
    strategyId: string,
    triggerId: string,
    planSelected: string,
    value: number
  ): Promise<void> {
    await analytics.trackEvent('paywall_conversion', {
      user_id: userId,
      strategy_id: strategyId,
      trigger_id: triggerId,
      plan_selected: planSelected,
      value,
      timestamp: new Date().toISOString(),
    });

    // Update conversion metrics
    await supabase.from('conversion_metrics').upsert({
      user_id: userId,
      strategy_id: strategyId,
      trigger_id: triggerId,
      converted: true,
      conversion_value: value,
      converted_at: new Date().toISOString(),
    });
  }

  /**
   * Get conversion optimization insights
   */
  async getConversionInsights(): Promise<{
    overallConversionRate: number;
    bestStrategy: PaywallStrategy;
    bestTrigger: string;
    recommendations: string[];
  }> {
    try {
      // Get conversion data
      const { data: conversions } = await supabase
        .from('conversion_metrics')
        .select('*')
        .eq('converted', true);

      const totalImpressions = conversions?.length || 0;
      const totalConversions = conversions?.filter(c => c.converted).length || 0;
      const overallConversionRate = totalImpressions > 0 
        ? totalConversions / totalImpressions 
        : 0;

      // Find best performing strategy
      const strategyPerformance = new Map<string, number>();
      conversions?.forEach(c => {
        const current = strategyPerformance.get(c.strategy_id) || 0;
        strategyPerformance.set(c.strategy_id, current + 1);
      });

      const bestStrategyId = Array.from(strategyPerformance.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0];

      const recommendations: string[] = [];
      if (overallConversionRate < 0.20) {
        recommendations.push('Consider offering free trial to increase conversion');
      }
      if (overallConversionRate < 0.15) {
        recommendations.push('Review paywall messaging and value proposition');
      }

      return {
        overallConversionRate,
        bestStrategy: {
          id: bestStrategyId || 'unknown',
          name: 'Best Performing',
          placement: 'modal',
          timing: 'immediate',
          trigger: 'usage-limit',
          design: 'urgency',
          conversionRate: overallConversionRate,
        },
        bestTrigger: 'usage-limit',
        recommendations,
      };
    } catch (error) {
      _logger.error('Error getting conversion insights', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        overallConversionRate: 0,
        bestStrategy: {
          id: 'unknown',
          name: 'Unknown',
          placement: 'modal',
          timing: 'immediate',
          trigger: 'unknown',
          design: 'minimal',
          conversionRate: 0,
        },
        bestTrigger: 'unknown',
        recommendations: [],
      };
    }
  }
}

export const freemiumConverter = new FreemiumConverter();
