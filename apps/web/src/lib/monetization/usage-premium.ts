/**
 * Usage-Based Premium Features
 * 
 * Monetize through usage-based premium features that provide immediate value
 */

import { createComponentLogger } from '@whats-for-dinner/utils';
import { supabase } from '../supabaseClient';
import { StripeService } from '../stripe';
import { analytics } from '../analytics';

const _logger = createComponentLogger('usage-premium');

export interface UsagePremiumFeature {
  id: string;
  name: string;
  description: string;
  pricing: {
    type: 'per_use' | 'credit_pack' | 'subscription_addon';
    pricePerUse?: number;
    creditPackSize?: number;
    creditPackPrice?: number;
    monthlyAddonPrice?: number;
  };
  valueMultiplier: number; // How much value this provides vs free version
  targetUsage: number; // Recommended usage per month
}

export interface UsageCredits {
  userId: string;
  tenantId: string;
  credits: number;
  expiresAt?: string;
  source: 'purchase' | 'bonus' | 'referral' | 'trial';
}

export class UsagePremiumManager {
  /**
   * Premium features available for purchase
   */
  private readonly premiumFeatures: UsagePremiumFeature[] = [
    {
      id: 'ai_recipe_generation',
      name: 'AI Recipe Generation',
      description: 'Advanced AI-powered recipe generation with dietary customization',
      pricing: {
        type: 'credit_pack',
        pricePerUse: 0.25,
        creditPackSize: 100,
        creditPackPrice: 19.99, // 20% discount
      },
      valueMultiplier: 3.0,
      targetUsage: 50,
    },
    {
      id: 'nutrition_analysis',
      name: 'Detailed Nutrition Analysis',
      description: 'Comprehensive macro and micronutrient breakdown',
      pricing: {
        type: 'per_use',
        pricePerUse: 0.10,
      },
      valueMultiplier: 2.5,
      targetUsage: 30,
    },
    {
      id: 'meal_plan_optimization',
      name: 'AI Meal Plan Optimization',
      description: 'Optimize meal plans for nutrition, cost, and preferences',
      pricing: {
        type: 'per_use',
        pricePerUse: 0.50,
      },
      valueMultiplier: 4.0,
      targetUsage: 4,
    },
    {
      id: 'grocery_price_comparison',
      name: 'Grocery Price Comparison',
      description: 'Compare prices across multiple stores and find best deals',
      pricing: {
        type: 'subscription_addon',
        monthlyAddonPrice: 4.99,
      },
      valueMultiplier: 2.0,
      targetUsage: 20,
    },
    {
      id: 'recipe_image_generation',
      name: 'AI Recipe Image Generation',
      description: 'Generate beautiful recipe images with AI',
      pricing: {
        type: 'credit_pack',
        pricePerUse: 0.15,
        creditPackSize: 50,
        creditPackPrice: 6.99, // 7% discount
      },
      valueMultiplier: 2.0,
      targetUsage: 10,
    },
  ];

  /**
   * Get user's current credits
   */
  async getUserCredits(userId: string, tenantId: string): Promise<UsageCredits> {
    try {
      const { data: credits } = await supabase
        .from('usage_credits')
        .select('*')
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .order('expires_at', { ascending: true })
        .limit(1);

      const totalCredits = credits?.reduce((sum, c) => {
        if (!c.expires_at || new Date(c.expires_at) > new Date()) {
          return sum + (c.credits || 0);
        }
        return sum;
      }, 0) || 0;

      return {
        userId,
        tenantId,
        credits: totalCredits,
      };
    } catch (error) {
      _logger.error('Error getting user credits', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return { userId, tenantId, credits: 0 };
    }
  }

  /**
   * Purchase credits for a feature
   */
  async purchaseCredits(
    userId: string,
    tenantId: string,
    featureId: string,
    quantity: number = 1
  ): Promise<{ checkoutUrl: string; credits: number } | null> {
    try {
      const feature = this.premiumFeatures.find(f => f.id === featureId);
      if (!feature) {
        throw new Error(`Feature ${featureId} not found`);
      }

      let totalPrice = 0;
      let creditsToAdd = 0;

      if (feature.pricing.type === 'credit_pack') {
        // Purchase credit pack
        const packsNeeded = Math.ceil(quantity / (feature.pricing.creditPackSize || 1));
        totalPrice = packsNeeded * (feature.pricing.creditPackPrice || 0);
        creditsToAdd = packsNeeded * (feature.pricing.creditPackSize || 0);
      } else if (feature.pricing.type === 'per_use') {
        // Purchase individual uses
        totalPrice = quantity * (feature.pricing.pricePerUse || 0);
        creditsToAdd = quantity;
      } else {
        // Subscription addon - create subscription
        return await this.createSubscriptionAddon(userId, tenantId, featureId);
      }

      // Create Stripe checkout session
      const checkoutSession = await StripeService.createCheckoutSession({
        customerId: userId,
        price: totalPrice,
        currency: 'usd',
        metadata: {
          type: 'usage_credits',
          feature_id: featureId,
          credits: creditsToAdd,
          tenant_id: tenantId,
        },
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/credits?success=true`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/credits?canceled=true`,
      });

      // Track opportunity
      await analytics.trackEvent('usage_credits_purchase_initiated', {
        user_id: userId,
        feature_id: featureId,
        credits: creditsToAdd,
        price: totalPrice,
      });

      return {
        checkoutUrl: checkoutSession.url || '',
        credits: creditsToAdd,
      };
    } catch (error) {
      _logger.error('Error purchasing credits', {
        userId,
        featureId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Use credits for a feature
   */
  async useCredits(
    userId: string,
    tenantId: string,
    featureId: string,
    creditsRequired: number = 1
  ): Promise<{ success: boolean; creditsRemaining: number }> {
    try {
      const currentCredits = await this.getUserCredits(userId, tenantId);
      
      if (currentCredits.credits < creditsRequired) {
        // Not enough credits - offer purchase
        const purchaseOffer = await this.purchaseCredits(userId, tenantId, featureId, creditsRequired);
        
        return {
          success: false,
          creditsRemaining: currentCredits.credits,
        };
      }

      // Deduct credits
      await supabase.from('usage_credits').insert({
        user_id: userId,
        tenant_id: tenantId,
        credits: -creditsRequired,
        source: 'usage',
        feature_id: featureId,
        created_at: new Date().toISOString(),
      });

      // Track usage
      await analytics.trackEvent('premium_feature_used', {
        user_id: userId,
        feature_id: featureId,
        credits_used: creditsRequired,
      });

      return {
        success: true,
        creditsRemaining: currentCredits.credits - creditsRequired,
      };
    } catch (error) {
      _logger.error('Error using credits', {
        userId,
        featureId,
        error: error instanceof Error ? error.message : String(error),
      });
      return { success: false, creditsRemaining: 0 };
    }
  }

  /**
   * Create subscription addon
   */
  private async createSubscriptionAddon(
    userId: string,
    tenantId: string,
    featureId: string
  ): Promise<{ checkoutUrl: string; credits: number } | null> {
    const feature = this.premiumFeatures.find(f => f.id === featureId);
    if (!feature || feature.pricing.type !== 'subscription_addon') {
      return null;
    }

    const checkoutSession = await StripeService.createCheckoutSession({
      customerId: userId,
      price: feature.pricing.monthlyAddonPrice || 0,
      currency: 'usd',
      billingPeriod: 'month',
      metadata: {
        type: 'subscription_addon',
        feature_id: featureId,
        tenant_id: tenantId,
      },
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscriptions?success=true`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscriptions`,
    });

    return {
      checkoutUrl: checkoutSession.url || '',
      credits: Infinity, // Unlimited for subscription
    };
  }

  /**
   * Get available premium features
   */
  getAvailableFeatures(): UsagePremiumFeature[] {
    return this.premiumFeatures;
  }

  /**
   * Recommend features based on usage
   */
  async recommendFeatures(userId: string, tenantId: string): Promise<UsagePremiumFeature[]> {
    try {
      // Get user's usage patterns
      const { data: usage } = await supabase
        .from('tenant_usage')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      const recommendations: UsagePremiumFeature[] = [];

      // If user generates many recipes, recommend AI recipe generation
      if (usage && usage.total_meals_today > 10) {
        const feature = this.premiumFeatures.find(f => f.id === 'ai_recipe_generation');
        if (feature) recommendations.push(feature);
      }

      // If user has meal plans, recommend optimization
      if (usage && usage.meal_plans_count > 0) {
        const feature = this.premiumFeatures.find(f => f.id === 'meal_plan_optimization');
        if (feature) recommendations.push(feature);
      }

      // If user uses grocery features, recommend price comparison
      if (usage && usage.shopping_lists_count > 5) {
        const feature = this.premiumFeatures.find(f => f.id === 'grocery_price_comparison');
        if (feature) recommendations.push(feature);
      }

      return recommendations;
    } catch (error) {
      _logger.error('Error recommending features', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }
}

export const usagePremium = new UsagePremiumManager();
