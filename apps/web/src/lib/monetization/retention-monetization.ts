/**
 * Retention-Focused Monetization
 * 
 * Monetizes through retention strategies that increase LTV:
 * - Win-back campaigns
 * - Retention offers
 * - Churn prevention
 * - Loyalty rewards
 */

import { createComponentLogger } from '@whats-for-dinner/utils';
import { supabase } from '../supabaseClient';
import { analytics } from '../analytics';
import { valueEngine } from './value-engine';

const _logger = createComponentLogger('retention-monetization');

export interface RetentionOffer {
  id: string;
  userId: string;
  type: 'win_back' | 'churn_prevention' | 'loyalty_reward' | 're_engagement';
  offer: {
    discount?: number;
    bonusCredits?: number;
    freeMonths?: number;
    upgrade?: string;
  };
  urgency: 'low' | 'medium' | 'high';
  expiryDate: string;
  estimatedValue: number;
  conversionProbability: number;
}

export interface ChurnRiskProfile {
  userId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  factors: string[];
  lastActiveDate: string;
  daysSinceLastActive: number;
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
}

export class RetentionMonetization {
  /**
   * Identify users at risk of churning
   */
  async identifyChurnRisk(userId: string, tenantId: string): Promise<ChurnRiskProfile> {
    try {
      const profile = await valueEngine.analyzeCustomerValue(userId, tenantId);
      
      // Get last activity
      const { data: engagement } = await supabase
        .from('user_engagement')
        .select('last_activity')
        .eq('user_id', userId)
        .single();

      const lastActiveDate = engagement?.last_activity || new Date().toISOString();
      const daysSinceLastActive = Math.floor(
        (Date.now() - new Date(lastActiveDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calculate risk score
      let riskScore = 0;
      const factors: string[] = [];

      // Inactivity risk
      if (daysSinceLastActive > 30) {
        riskScore += 40;
        factors.push('Inactive for 30+ days');
      } else if (daysSinceLastActive > 14) {
        riskScore += 25;
        factors.push('Inactive for 14+ days');
      } else if (daysSinceLastActive > 7) {
        riskScore += 15;
        factors.push('Inactive for 7+ days');
      }

      // Engagement decline
      if (profile.engagementScore < 30) {
        riskScore += 30;
        factors.push('Low engagement score');
      } else if (profile.engagementScore < 50) {
        riskScore += 15;
        factors.push('Moderate engagement');
      }

      // Usage decline
      if (profile.usagePatterns.recipesGenerated === 0) {
        riskScore += 20;
        factors.push('No recent usage');
      }

      // Churn risk level
      let riskLevel: ChurnRiskProfile['riskLevel'] = 'low';
      if (riskScore >= 70) riskLevel = 'critical';
      else if (riskScore >= 50) riskLevel = 'high';
      else if (riskScore >= 30) riskLevel = 'medium';

      // Engagement trend
      const engagementTrend = profile.engagementScore > 60 ? 'increasing' :
                              profile.engagementScore > 40 ? 'stable' : 'decreasing';

      return {
        userId,
        riskLevel,
        riskScore: Math.min(100, riskScore),
        factors,
        lastActiveDate,
        daysSinceLastActive,
        engagementTrend,
      };
    } catch (error) {
      _logger.error('Error identifying churn risk', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        userId,
        riskLevel: 'low',
        riskScore: 0,
        factors: [],
        lastActiveDate: new Date().toISOString(),
        daysSinceLastActive: 0,
        engagementTrend: 'stable',
      };
    }
  }

  /**
   * Generate retention offer
   */
  async generateRetentionOffer(
    userId: string,
    tenantId: string
  ): Promise<RetentionOffer | null> {
    try {
      const churnRisk = await this.identifyChurnRisk(userId, tenantId);
      const profile = await valueEngine.analyzeCustomerValue(userId, tenantId);

      // No offer if low risk
      if (churnRisk.riskLevel === 'low') {
        return null;
      }

      let offerType: RetentionOffer['type'] = 'churn_prevention';
      let offer: RetentionOffer['offer'] = {};
      let urgency: RetentionOffer['urgency'] = 'medium';
      let estimatedValue = profile.currentMRR;

      // Critical risk - aggressive win-back
      if (churnRisk.riskLevel === 'critical') {
        offerType = 'win_back';
        urgency = 'high';
        offer = {
          discount: 50, // 50% off for 3 months
          bonusCredits: 200,
          freeMonths: 1,
        };
        estimatedValue = profile.currentMRR * 0.5 * 3; // 3 months at 50% off
      }
      // High risk - churn prevention
      else if (churnRisk.riskLevel === 'high') {
        offerType = 'churn_prevention';
        urgency = 'high';
        offer = {
          discount: 30, // 30% off for 2 months
          bonusCredits: 100,
        };
        estimatedValue = profile.currentMRR * 0.7 * 2; // 2 months at 30% off
      }
      // Medium risk - retention offer
      else {
        offerType = 're_engagement';
        urgency = 'medium';
        offer = {
          discount: 20, // 20% off for 1 month
          bonusCredits: 50,
        };
        estimatedValue = profile.currentMRR * 0.8; // 1 month at 20% off
      }

      // Calculate conversion probability
      const conversionProbability = this.calculateRetentionConversionProbability(churnRisk, profile);

      return {
        id: `retention-${userId}-${Date.now()}`,
        userId,
        type: offerType,
        offer,
        urgency,
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        estimatedValue,
        conversionProbability,
      };
    } catch (error) {
      _logger.error('Error generating retention offer', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Calculate retention conversion probability
   */
  private calculateRetentionConversionProbability(
    churnRisk: ChurnRiskProfile,
    profile: any
  ): number {
    let probability = 0.30; // Base 30%

    // Risk level boost
    if (churnRisk.riskLevel === 'critical') {
      probability += 0.25; // Aggressive offer = higher conversion
    } else if (churnRisk.riskLevel === 'high') {
      probability += 0.15;
    }

    // Historical value boost
    if (profile.lifetimeValue > 50) {
      probability += 0.15; // High LTV users more likely to convert
    }

    // Engagement boost
    if (profile.engagementScore > 50) {
      probability += 0.10; // Still engaged = easier to retain
    }

    return Math.min(1, probability);
  }

  /**
   * Track retention offer shown
   */
  async trackRetentionOffer(offer: RetentionOffer): Promise<void> {
    await analytics.trackEvent('retention_offer_shown', {
      user_id: offer.userId,
      offer_type: offer.type,
      urgency: offer.urgency,
      estimated_value: offer.estimatedValue,
      conversion_probability: offer.conversionProbability,
    });
  }

  /**
   * Track retention conversion
   */
  async trackRetentionConversion(offer: RetentionOffer): Promise<void> {
    await analytics.trackEvent('retention_conversion', {
      user_id: offer.userId,
      offer_type: offer.type,
      final_value: offer.estimatedValue,
    });

    // Update retention metrics
    await supabase.from('retention_metrics').upsert({
      user_id: offer.userId,
      offer_id: offer.id,
      converted: true,
      conversion_value: offer.estimatedValue,
      converted_at: new Date().toISOString(),
    });
  }

  /**
   * Generate loyalty rewards for long-term users
   */
  async generateLoyaltyRewards(userId: string, tenantId: string): Promise<RetentionOffer | null> {
    try {
      const profile = await valueEngine.analyzeCustomerValue(userId, tenantId);

      // Only for paid users with 6+ months retention
      if (profile.currentPlan === 'free' || profile.usagePatterns.retentionDays < 180) {
        return null;
      }

      // Calculate loyalty tier
      const loyaltyMonths = Math.floor(profile.usagePatterns.retentionDays / 30);
      
      let reward: RetentionOffer['offer'] = {};
      let estimatedValue = profile.currentMRR;

      // 6 months - Small reward
      if (loyaltyMonths >= 6 && loyaltyMonths < 12) {
        reward = {
          bonusCredits: 50,
          discount: 10, // 10% off next month
        };
        estimatedValue = profile.currentMRR * 0.9;
      }
      // 12 months - Medium reward
      else if (loyaltyMonths >= 12 && loyaltyMonths < 24) {
        reward = {
          bonusCredits: 100,
          discount: 15, // 15% off next 3 months
          freeMonths: 0.5, // Half month free
        };
        estimatedValue = profile.currentMRR * 0.85 * 3;
      }
      // 24+ months - Large reward
      else if (loyaltyMonths >= 24) {
        reward = {
          bonusCredits: 200,
          discount: 20, // 20% off next 6 months
          freeMonths: 1, // 1 month free
        };
        estimatedValue = profile.currentMRR * 0.8 * 6;
      } else {
        return null;
      }

      return {
        id: `loyalty-${userId}-${Date.now()}`,
        userId,
        type: 'loyalty_reward',
        offer: reward,
        urgency: 'low',
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        estimatedValue,
        conversionProbability: 0.80, // High conversion for loyalty rewards
      };
    } catch (error) {
      _logger.error('Error generating loyalty rewards', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }
}

export const retentionMonetization = new RetentionMonetization();
