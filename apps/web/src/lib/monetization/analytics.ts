/**
 * Monetization Analytics Tracking
 * 
 * Centralized analytics tracking for all monetization events
 */

import { createComponentLogger } from '@whats-for-dinner/utils';
import { analytics } from '../analytics';

const _logger = createComponentLogger('monetization-analytics');

export class MonetizationAnalytics {
  /**
   * Track upsell opportunity shown
   */
  static async trackUpsellShown(opportunityId: string, userId: string, context: Record<string, unknown> = {}) {
    try {
      await analytics.trackEvent('upsell_opportunity_shown', {
        opportunity_id: opportunityId,
        user_id: userId,
        ...context,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      _logger.error('Failed to track upsell shown', { error });
    }
  }

  /**
   * Track upsell conversion
   */
  static async trackUpsellConversion(
    opportunityId: string,
    userId: string,
    value: number,
    plan: string
  ) {
    try {
      await analytics.trackEvent('upsell_conversion', {
        opportunity_id: opportunityId,
        user_id: userId,
        conversion_value: value,
        plan,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      _logger.error('Failed to track upsell conversion', { error });
    }
  }

  /**
   * Track paywall impression
   */
  static async trackPaywallImpression(
    strategyId: string,
    userId: string,
    triggerId: string,
    context: Record<string, unknown> = {}
  ) {
    try {
      await analytics.trackEvent('paywall_impression', {
        strategy_id: strategyId,
        user_id: userId,
        trigger_id: triggerId,
        ...context,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      _logger.error('Failed to track paywall impression', { error });
    }
  }

  /**
   * Track paywall conversion
   */
  static async trackPaywallConversion(
    strategyId: string,
    userId: string,
    triggerId: string,
    planSelected: string,
    value: number
  ) {
    try {
      await analytics.trackEvent('paywall_conversion', {
        strategy_id: strategyId,
        user_id: userId,
        trigger_id: triggerId,
        plan_selected: planSelected,
        conversion_value: value,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      _logger.error('Failed to track paywall conversion', { error });
    }
  }

  /**
   * Track premium feature usage
   */
  static async trackPremiumFeatureUsage(
    featureId: string,
    userId: string,
    creditsUsed: number
  ) {
    try {
      await analytics.trackEvent('premium_feature_used', {
        feature_id: featureId,
        user_id: userId,
        credits_used: creditsUsed,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      _logger.error('Failed to track premium feature usage', { error });
    }
  }

  /**
   * Track referral signup
   */
  static async trackReferralSignup(
    referrerId: string,
    refereeId: string,
    referralCode: string
  ) {
    try {
      await analytics.trackEvent('referral_signup', {
        referrer_id: referrerId,
        referee_id: refereeId,
        referral_code: referralCode,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      _logger.error('Failed to track referral signup', { error });
    }
  }

  /**
   * Track referral conversion
   */
  static async trackReferralConversion(
    referrerId: string,
    refereeId: string,
    conversionValue: number
  ) {
    try {
      await analytics.trackEvent('referral_conversion', {
        referrer_id: referrerId,
        referee_id: refereeId,
        conversion_value: conversionValue,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      _logger.error('Failed to track referral conversion', { error });
    }
  }

  /**
   * Track retention offer shown
   */
  static async trackRetentionOffer(
    offerId: string,
    userId: string,
    offerType: string,
    urgency: string
  ) {
    try {
      await analytics.trackEvent('retention_offer_shown', {
        offer_id: offerId,
        user_id: userId,
        offer_type: offerType,
        urgency,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      _logger.error('Failed to track retention offer', { error });
    }
  }

  /**
   * Track retention conversion
   */
  static async trackRetentionConversion(
    offerId: string,
    userId: string,
    offerType: string,
    value: number
  ) {
    try {
      await analytics.trackEvent('retention_conversion', {
        offer_id: offerId,
        user_id: userId,
        offer_type: offerType,
        conversion_value: value,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      _logger.error('Failed to track retention conversion', { error });
    }
  }

  /**
   * Track pricing offer shown
   */
  static async trackPricingOffer(
    userId: string,
    tierId: string,
    basePrice: number,
    offeredPrice: number,
    discount: number
  ) {
    try {
      await analytics.trackEvent('pricing_offer_shown', {
        user_id: userId,
        tier_id: tierId,
        base_price: basePrice,
        offered_price: offeredPrice,
        discount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      _logger.error('Failed to track pricing offer', { error });
    }
  }

  /**
   * Track pricing conversion
   */
  static async trackPricingConversion(
    userId: string,
    tierId: string,
    finalPrice: number,
    discount: number
  ) {
    try {
      await analytics.trackEvent('pricing_conversion', {
        user_id: userId,
        tier_id: tierId,
        final_price: finalPrice,
        discount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      _logger.error('Failed to track pricing conversion', { error });
    }
  }
}

export const monetizationAnalytics = MonetizationAnalytics;
