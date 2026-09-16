/**
 * Dynamic Pricing Engine
 * 
 * Optimizes pricing based on:
 * - Customer value profile
 * - Market conditions
 * - Conversion probability
 * - Competitive analysis
 */

import { createComponentLogger } from '@whats-for-dinner/utils';
import { supabase } from '../supabaseClient';
import { analytics } from '../analytics';
import { valueEngine } from './value-engine';

const _logger = createComponentLogger('dynamic-pricing');

export interface PricingTier {
  id: string;
  name: string;
  basePrice: number;
  features: string[];
  limits: Record<string, number>;
  targetAudience: 'individual' | 'family' | 'professional' | 'enterprise';
}

export interface DynamicPricingOffer {
  userId: string;
  tierId: string;
  basePrice: number;
  offeredPrice: number;
  discount: number;
  discountReason: string;
  expiryDate: string;
  conversionProbability: number;
  estimatedLTV: number;
}

export class DynamicPricingEngine {
  /**
   * Base pricing tiers
   */
  private readonly baseTiers: PricingTier[] = [
    {
      id: 'free',
      name: 'Free',
      basePrice: 0,
      features: ['basic_recipes', 'limited_pantry'],
      limits: { recipes_per_day: 5, pantry_items: 20 },
      targetAudience: 'individual',
    },
    {
      id: 'pro',
      name: 'Pro',
      basePrice: 9.99,
      features: ['unlimited_recipes', 'advanced_pantry', 'meal_planning', 'nutrition_tracking'],
      limits: { recipes_per_day: -1, pantry_items: -1 },
      targetAudience: 'individual',
    },
    {
      id: 'premium',
      name: 'Premium',
      basePrice: 19.99,
      features: [
        'unlimited_recipes',
        'advanced_pantry',
        'meal_planning',
        'nutrition_tracking',
        'ai_meal_planning',
        'grocery_integration',
        'priority_support',
      ],
      limits: { recipes_per_day: -1, pantry_items: -1 },
      targetAudience: 'individual',
    },
    {
      id: 'family',
      name: 'Family',
      basePrice: 29.99,
      features: [
        'unlimited_recipes',
        'advanced_pantry',
        'meal_planning',
        'nutrition_tracking',
        'family_sharing',
        'multiple_profiles',
        'kids_mode',
      ],
      limits: { recipes_per_day: -1, pantry_items: -1, profiles: 6 },
      targetAudience: 'family',
    },
  ];

  /**
   * Generate personalized pricing offer
   */
  async generatePricingOffer(
    userId: string,
    tenantId: string,
    targetTier: string
  ): Promise<DynamicPricingOffer | null> {
    try {
      const profile = await valueEngine.analyzeCustomerValue(userId, tenantId);
      const tier = this.baseTiers.find(t => t.id === targetTier);
      
      if (!tier) {
        return null;
      }

      // Calculate discount based on conversion probability
      let discount = 0;
      let discountReason = '';

      // High engagement = lower discount needed
      if (profile.engagementScore > 80) {
        discount = 0; // No discount needed
        discountReason = 'High engagement - full price offer';
      } else if (profile.engagementScore > 60) {
        discount = 10; // 10% off
        discountReason = 'Good engagement - introductory discount';
      } else if (profile.engagementScore > 40) {
        discount = 20; // 20% off
        discountReason = 'Moderate engagement - conversion discount';
      } else {
        discount = 30; // 30% off
        discountReason = 'Low engagement - aggressive conversion discount';
      }

      // Additional discount for annual commitment
      const isAnnual = targetTier.includes('annual');
      if (isAnnual) {
        discount += 10; // Additional 10% for annual
        discountReason += ' + annual commitment bonus';
      }

      // Calculate offered price
      const basePrice = tier.basePrice * (isAnnual ? 12 : 1);
      const discountAmount = (basePrice * discount) / 100;
      const offeredPrice = basePrice - discountAmount;

      // Calculate conversion probability
      const conversionProbability = this.calculateConversionProbability(profile, discount);

      // Estimate LTV
      const estimatedLTV = this.estimateLTV(offeredPrice, profile, isAnnual);

      return {
        userId,
        tierId: targetTier,
        basePrice,
        offeredPrice,
        discount,
        discountReason,
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        conversionProbability,
        estimatedLTV,
      };
    } catch (error) {
      _logger.error('Error generating pricing offer', {
        userId,
        targetTier,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Calculate conversion probability
   */
  private calculateConversionProbability(
    profile: any,
    discount: number
  ): number {
    let probability = 0.20; // Base 20%

    // Engagement boost
    probability += (profile.engagementScore / 100) * 0.30;

    // Discount boost
    probability += (discount / 100) * 0.20;

    // Usage boost
    if (profile.usagePatterns.recipesGenerated > 10) {
      probability += 0.15;
    }

    // Retention boost
    if (profile.usagePatterns.retentionDays > 7) {
      probability += 0.15;
    }

    return Math.min(1, probability);
  }

  /**
   * Estimate lifetime value
   */
  private estimateLTV(
    price: number,
    profile: any,
    isAnnual: boolean
  ): number {
    // Base LTV calculation
    const monthlyPrice = isAnnual ? price / 12 : price;
    
    // Estimate retention based on engagement
    const retentionMonths = Math.max(3, Math.min(24, profile.engagementScore / 5));
    
    // Calculate LTV
    const ltv = monthlyPrice * retentionMonths;
    
    // Add expansion potential
    const expansionValue = ltv * profile.monetizationPotential.expansionPotential * 0.3;
    
    return ltv + expansionValue;
  }

  /**
   * Get optimal pricing for user
   */
  async getOptimalPricing(
    userId: string,
    tenantId: string
  ): Promise<{
    recommendedTier: string;
    offers: DynamicPricingOffer[];
    rationale: string;
  }> {
    try {
      const profile = await valueEngine.analyzeCustomerValue(userId, tenantId);
      
      // Determine recommended tier
      let recommendedTier = 'pro';
      let rationale = '';

      if (profile.currentPlan === 'free') {
        if (profile.engagementScore > 70) {
          recommendedTier = 'premium';
          rationale = 'High engagement - Premium tier recommended';
        } else if (profile.usagePatterns.recipesGenerated > 5) {
          recommendedTier = 'pro';
          rationale = 'Active usage - Pro tier recommended';
        } else {
          recommendedTier = 'pro';
          rationale = 'Standard upgrade path - Pro tier';
        }
      } else if (profile.currentPlan === 'pro') {
        if (profile.engagementScore > 80) {
          recommendedTier = 'premium';
          rationale = 'Power user - Premium tier upgrade';
        } else {
          recommendedTier = 'premium';
          rationale = 'Natural upgrade path - Premium tier';
        }
      }

      // Generate offers for recommended tier and next tier
      const offers: DynamicPricingOffer[] = [];
      
      const recommendedOffer = await this.generatePricingOffer(userId, tenantId, recommendedTier);
      if (recommendedOffer) {
        offers.push(recommendedOffer);
      }

      // Also offer annual if monthly
      if (!recommendedTier.includes('annual')) {
        const annualOffer = await this.generatePricingOffer(userId, tenantId, `${recommendedTier}_annual`);
        if (annualOffer) {
          offers.push(annualOffer);
        }
      }

      return {
        recommendedTier,
        offers,
        rationale,
      };
    } catch (error) {
      _logger.error('Error getting optimal pricing', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        recommendedTier: 'pro',
        offers: [],
        rationale: 'Error occurred',
      };
    }
  }

  /**
   * Track pricing offer shown
   */
  async trackPricingOffer(offer: DynamicPricingOffer): Promise<void> {
    await analytics.trackEvent('pricing_offer_shown', {
      user_id: offer.userId,
      tier_id: offer.tierId,
      base_price: offer.basePrice,
      offered_price: offer.offeredPrice,
      discount: offer.discount,
      conversion_probability: offer.conversionProbability,
    });
  }

  /**
   * Track pricing conversion
   */
  async trackPricingConversion(offer: DynamicPricingOffer): Promise<void> {
    await analytics.trackEvent('pricing_conversion', {
      user_id: offer.userId,
      tier_id: offer.tierId,
      final_price: offer.offeredPrice,
      discount: offer.discount,
      estimated_ltv: offer.estimatedLTV,
    });
  }
}

export const dynamicPricing = new DynamicPricingEngine();
