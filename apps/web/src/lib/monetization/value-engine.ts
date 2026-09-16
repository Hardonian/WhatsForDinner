/**
 * Customer Value Engine
 * 
 * Comprehensive system to maximize customer lifetime value (LTV) through:
 * - Smart upsells and cross-sells
 * - Usage-based premium features
 * - Behavioral trigger-based offers
 * - Value-based pricing optimization
 */

import { createComponentLogger } from '@whats-for-dinner/utils';
import { supabase } from '../supabaseClient';
import { analytics } from '../analytics';

const _logger = createComponentLogger('value-engine');

export interface CustomerValueProfile {
  userId: string;
  tenantId: string;
  currentPlan: string;
  currentMRR: number;
  lifetimeValue: number;
  engagementScore: number;
  usagePatterns: {
    recipesGenerated: number;
    featuresUsed: string[];
    sessionFrequency: number;
    averageSessionDuration: number;
    retentionDays: number;
  };
  monetizationPotential: {
    upsellProbability: number;
    crossSellOpportunities: string[];
    churnRisk: number;
    expansionPotential: number;
  };
}

export interface UpsellOpportunity {
  id: string;
  type: 'plan_upgrade' | 'addon' | 'annual' | 'feature_unlock' | 'usage_boost';
  targetPlan?: string;
  productId?: string;
  featureId?: string;
  trigger: 'usage_limit' | 'engagement_high' | 'feature_request' | 'retention_milestone' | 'seasonal';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  estimatedValue: number;
  conversionProbability: number;
  personalizedMessage: string;
  offerDetails: {
    discount?: number;
    bonusCredits?: number;
    freeTrialDays?: number;
    specialPricing?: number;
  };
  context: Record<string, unknown>;
}

export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'personalization' | 'advanced' | 'convenience';
  pricing: {
    type: 'one_time' | 'subscription' | 'usage_based';
    price: number;
    currency: string;
  };
  valueProposition: string;
  targetAudience: 'free' | 'pro' | 'premium' | 'all';
  conversionImpact: number; // Expected % increase in conversion
}

export class CustomerValueEngine {
  /**
   * Analyze customer value profile
   */
  async analyzeCustomerValue(userId: string, tenantId: string): Promise<CustomerValueProfile> {
    try {
      // Fetch comprehensive user data in parallel
      const [tenantData, usageData, engagementData, subscriptionData] = await Promise.all([
        supabase.from('tenants').select('plan').eq('id', tenantId).single(),
        supabase.from('tenant_usage').select('*').eq('tenant_id', tenantId).single(),
        supabase.from('user_engagement').select('*').eq('user_id', userId).single(),
        supabase.from('subscriptions').select('*').eq('user_id', userId).eq('status', 'active').single(),
      ]);

      const currentPlan = tenantData.data?.plan || 'free';
      const usage = usageData.data;
      const engagement = engagementData.data;
      const subscription = subscriptionData.data;

      // Calculate current MRR
      const planPricing: Record<string, number> = {
        free: 0,
        pro: 9.99,
        premium: 19.99,
        enterprise: 99.99,
      };
      const currentMRR = planPricing[currentPlan] || 0;

      // Calculate engagement score (0-100)
      const engagementScore = this.calculateEngagementScore(engagement, usage);

      // Calculate lifetime value
      const accountAge = subscription?.created_at 
        ? Math.floor((Date.now() - new Date(subscription.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const lifetimeValue = currentMRR * (accountAge / 30); // Simplified LTV calculation

      // Analyze usage patterns
      const usagePatterns = {
        recipesGenerated: usage?.total_meals_today || 0,
        featuresUsed: this.extractFeaturesUsed(usage),
        sessionFrequency: engagement?.login_frequency || 0,
        averageSessionDuration: engagement?.avg_session_duration || 0,
        retentionDays: accountAge,
      };

      // Calculate monetization potential
      const monetizationPotential = await this.calculateMonetizationPotential(
        userId,
        tenantId,
        currentPlan,
        engagementScore,
        usagePatterns
      );

      return {
        userId,
        tenantId,
        currentPlan,
        currentMRR,
        lifetimeValue,
        engagementScore,
        usagePatterns,
        monetizationPotential,
      };
    } catch (error) {
      _logger.error('Error analyzing customer value', {
        userId,
        tenantId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Identify smart upsell opportunities based on behavior
   */
  async identifyUpsellOpportunities(
    userId: string,
    tenantId: string
  ): Promise<UpsellOpportunity[]> {
    const profile = await this.analyzeCustomerValue(userId, tenantId);
    const opportunities: UpsellOpportunity[] = [];

    // Opportunity 1: Usage limit reached
    if (profile.currentPlan === 'free' && profile.usagePatterns.recipesGenerated >= 5) {
      opportunities.push({
        id: `upsell-usage-${Date.now()}`,
        type: 'plan_upgrade',
        targetPlan: 'pro',
        trigger: 'usage_limit',
        urgency: 'high',
        estimatedValue: 9.99,
        conversionProbability: 0.35,
        personalizedMessage: `You've generated ${profile.usagePatterns.recipesGenerated} recipes today! Upgrade to Pro for unlimited recipes and advanced features.`,
        offerDetails: {
          freeTrialDays: 7,
          bonusCredits: 50,
        },
        context: {
          usage: profile.usagePatterns.recipesGenerated,
          limit: 5,
        },
      });
    }

    // Opportunity 2: High engagement but still free
    if (profile.currentPlan === 'free' && profile.engagementScore > 70) {
      opportunities.push({
        id: `upsell-engagement-${Date.now()}`,
        type: 'plan_upgrade',
        targetPlan: 'pro',
        trigger: 'engagement_high',
        urgency: 'medium',
        estimatedValue: 9.99,
        conversionProbability: 0.45,
        personalizedMessage: `You're a power user! Upgrade to Pro to unlock advanced features like meal planning, nutrition tracking, and pantry intelligence.`,
        offerDetails: {
          discount: 20, // 20% off first month
          freeTrialDays: 14,
        },
        context: {
          engagementScore: profile.engagementScore,
        },
      });
    }

    // Opportunity 3: Annual subscription discount (for existing subscribers)
    if (['pro', 'premium'].includes(profile.currentPlan) && profile.retentionDays > 30) {
      const annualSavings = profile.currentMRR * 12 - (profile.currentMRR * 10); // 2 months free
      opportunities.push({
        id: `upsell-annual-${Date.now()}`,
        type: 'annual',
        trigger: 'retention_milestone',
        urgency: 'low',
        estimatedValue: profile.currentMRR * 10,
        conversionProbability: 0.25,
        personalizedMessage: `Save $${annualSavings.toFixed(2)} per year! Switch to annual billing and get 2 months free.`,
        offerDetails: {
          discount: Math.round((annualSavings / (profile.currentMRR * 12)) * 100),
          specialPricing: profile.currentMRR * 10,
        },
        context: {
          currentMRR: profile.currentMRR,
          savings: annualSavings,
        },
      });
    }

    // Opportunity 4: Premium upgrade (for Pro users)
    if (profile.currentPlan === 'pro' && profile.engagementScore > 80) {
      opportunities.push({
        id: `upsell-premium-${Date.now()}`,
        type: 'plan_upgrade',
        targetPlan: 'premium',
        trigger: 'engagement_high',
        urgency: 'medium',
        estimatedValue: 19.99,
        conversionProbability: 0.20,
        personalizedMessage: `Unlock Premium features: AI meal planning, advanced nutrition analysis, and priority support.`,
        offerDetails: {
          discount: 15, // 15% off first 3 months
          bonusCredits: 100,
        },
        context: {
          engagementScore: profile.engagementScore,
        },
      });
    }

    // Opportunity 5: Feature-specific upsells
    const featureOpportunities = await this.identifyFeatureUpsells(userId, profile);
    opportunities.push(...featureOpportunities);

    // Sort by conversion probability * estimated value
    return opportunities.sort((a, b) => 
      (b.conversionProbability * b.estimatedValue) - (a.conversionProbability * a.estimatedValue)
    );
  }

  /**
   * Calculate engagement score (0-100)
   */
  private calculateEngagementScore(engagement: any, usage: any): number {
    if (!engagement && !usage) return 0;

    let score = 0;

    // Login frequency (0-30 points)
    const loginFreq = engagement?.login_frequency || 0;
    score += Math.min(30, loginFreq * 5);

    // Session duration (0-20 points)
    const avgDuration = engagement?.avg_session_duration || 0;
    score += Math.min(20, (avgDuration / 60) * 2); // 1 point per 30 seconds

    // Feature usage (0-25 points)
    const featuresUsed = this.extractFeaturesUsed(usage).length;
    score += Math.min(25, featuresUsed * 5);

    // Content consumption (0-15 points)
    const contentViews = engagement?.content_views || 0;
    score += Math.min(15, contentViews * 0.5);

    // Retention (0-10 points)
    const retentionDays = engagement?.days_active || 0;
    score += Math.min(10, retentionDays * 0.1);

    return Math.min(100, Math.round(score));
  }

  /**
   * Extract features used from usage data
   */
  private extractFeaturesUsed(usage: any): string[] {
    if (!usage) return [];
    const features: string[] = [];
    
    if (usage.total_meals_today > 0) features.push('meal_generation');
    if (usage.pantry_items_count > 0) features.push('pantry_management');
    if (usage.meal_plans_count > 0) features.push('meal_planning');
    if (usage.shopping_lists_count > 0) features.push('shopping_lists');
    
    return features;
  }

  /**
   * Calculate monetization potential
   */
  private async calculateMonetizationPotential(
    userId: string,
    tenantId: string,
    currentPlan: string,
    engagementScore: number,
    usagePatterns: CustomerValueProfile['usagePatterns']
  ): Promise<CustomerValueProfile['monetizationPotential']> {
    // Upsell probability based on engagement and usage
    let upsellProbability = 0;
    if (currentPlan === 'free') {
      if (engagementScore > 70) upsellProbability = 0.45;
      else if (engagementScore > 50) upsellProbability = 0.30;
      else if (usagePatterns.recipesGenerated >= 5) upsellProbability = 0.35;
      else upsellProbability = 0.15;
    } else if (currentPlan === 'pro') {
      if (engagementScore > 80) upsellProbability = 0.25;
      else upsellProbability = 0.10;
    }

    // Cross-sell opportunities
    const crossSellOpportunities: string[] = [];
    if (usagePatterns.recipesGenerated > 10) {
      crossSellOpportunities.push('premium_recipe_packs');
    }
    if (usagePatterns.sessionFrequency > 5) {
      crossSellOpportunities.push('meal_planning_pro');
    }
    if (usagePatterns.retentionDays > 30) {
      crossSellOpportunities.push('annual_subscription');
    }

    // Churn risk (inverse of engagement)
    const churnRisk = Math.max(0, Math.min(1, (100 - engagementScore) / 100));

    // Expansion potential
    const expansionPotential = Math.min(1, engagementScore / 100);

    return {
      upsellProbability,
      crossSellOpportunities,
      churnRisk,
      expansionPotential,
    };
  }

  /**
   * Identify feature-specific upsells
   */
  private async identifyFeatureUpsells(
    userId: string,
    profile: CustomerValueProfile
  ): Promise<UpsellOpportunity[]> {
    const opportunities: UpsellOpportunity[] = [];

    // Check if user tried to access premium features
    const { data: featureAttempts } = await supabase
      .from('feature_access_attempts')
      .select('feature_id, attempted_at')
      .eq('user_id', userId)
      .eq('blocked', true)
      .order('attempted_at', { ascending: false })
      .limit(5);

    if (featureAttempts && featureAttempts.length > 0) {
      const blockedFeatures = featureAttempts.map((f: any) => f.feature_id);
      
      for (const featureId of blockedFeatures) {
        const feature = await this.getPremiumFeature(featureId);
        if (feature) {
          opportunities.push({
            id: `upsell-feature-${featureId}-${Date.now()}`,
            type: 'feature_unlock',
            featureId,
            trigger: 'feature_request',
            urgency: 'medium',
            estimatedValue: feature.pricing.price,
            conversionProbability: 0.30,
            personalizedMessage: `Unlock ${feature.name}: ${feature.valueProposition}`,
            offerDetails: {
              discount: 10, // 10% off first purchase
            },
            context: {
              featureId,
              featureName: feature.name,
            },
          });
        }
      }
    }

    return opportunities;
  }

  /**
   * Get premium feature details
   */
  private async getPremiumFeature(featureId: string): Promise<PremiumFeature | null> {
    const features: Record<string, PremiumFeature> = {
      'advanced_nutrition': {
        id: 'advanced_nutrition',
        name: 'Advanced Nutrition Analysis',
        description: 'Detailed macro and micronutrient tracking',
        category: 'personalization',
        pricing: {
          type: 'subscription',
          price: 4.99,
          currency: 'USD',
        },
        valueProposition: 'Track every nutrient and optimize your health goals',
        targetAudience: 'pro',
        conversionImpact: 15,
      },
      'meal_planning_pro': {
        id: 'meal_planning_pro',
        name: 'AI Meal Planning Pro',
        description: 'AI-powered weekly meal planning with grocery lists',
        category: 'productivity',
        pricing: {
          type: 'subscription',
          price: 7.99,
          currency: 'USD',
        },
        valueProposition: 'Save hours each week with AI meal planning',
        targetAudience: 'all',
        conversionImpact: 25,
      },
      'pantry_intelligence': {
        id: 'pantry_intelligence',
        name: 'Pantry Intelligence',
        description: 'Smart expiration tracking and waste reduction',
        category: 'convenience',
        pricing: {
          type: 'subscription',
          price: 3.99,
          currency: 'USD',
        },
        valueProposition: 'Reduce food waste and save money',
        targetAudience: 'all',
        conversionImpact: 20,
      },
    };

    return features[featureId] || null;
  }

  /**
   * Track upsell opportunity shown
   */
  async trackUpsellShown(opportunityId: string, userId: string): Promise<void> {
    await analytics.trackEvent('upsell_opportunity_shown', {
      opportunityId,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track upsell conversion
   */
  async trackUpsellConversion(
    opportunityId: string,
    userId: string,
    value: number
  ): Promise<void> {
    await analytics.trackEvent('upsell_conversion', {
      opportunityId,
      userId,
      value,
      timestamp: new Date().toISOString(),
    });

    // Update customer value profile
    await supabase
      .from('customer_value_profiles')
      .upsert({
        user_id: userId,
        total_revenue: value,
        last_upsell_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
  }
}

export const valueEngine = new CustomerValueEngine();
