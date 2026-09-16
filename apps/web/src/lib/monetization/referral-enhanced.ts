/**
 * Enhanced Referral Program
 * 
 * Maximizes customer acquisition and retention through referral incentives
 */

import { createComponentLogger } from '@whats-for-dinner/utils';
import { supabase } from '../supabaseClient';
import { analytics } from '../analytics';

const _logger = createComponentLogger('referral-enhanced');

export interface ReferralReward {
  type: 'credits' | 'subscription_days' | 'discount' | 'cash';
  value: number;
  description: string;
  eligibility: 'referrer' | 'referee' | 'both';
}

export interface ReferralProgram {
  id: string;
  name: string;
  description: string;
  referrerReward: ReferralReward;
  refereeReward: ReferralReward;
  conversionBonus?: ReferralReward; // Bonus when referee converts to paid
  maxReferrals?: number;
  expiryDays?: number;
}

export interface ReferralStats {
  userId: string;
  referralCode: string;
  totalReferrals: number;
  activeReferrals: number;
  convertedReferrals: number;
  totalRewardsEarned: number;
  pendingRewards: number;
  referralLink: string;
}

export class EnhancedReferralProgram {
  /**
   * Default referral program
   */
  private readonly defaultProgram: ReferralProgram = {
    id: 'default',
    name: 'Refer a Friend',
    description: 'Get rewards for every friend you refer',
    referrerReward: {
      type: 'subscription_days',
      value: 30,
      description: '30 days free Pro',
      eligibility: 'referrer',
    },
    refereeReward: {
      type: 'subscription_days',
      value: 30,
      description: '30 days free Pro',
      eligibility: 'referee',
    },
    conversionBonus: {
      type: 'credits',
      value: 100,
      description: '100 bonus credits when friend subscribes',
      eligibility: 'referrer',
    },
    maxReferrals: 10,
    expiryDays: 365,
  };

  /**
   * Create or get referral code for user
   */
  async getOrCreateReferralCode(userId: string): Promise<{
    code: string;
    link: string;
    stats: ReferralStats;
  }> {
    try {
      // Check for existing referral code
      const { data: existing } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId)
        .limit(1)
        .single();

      if (existing) {
        const stats = await this.getReferralStats(userId, existing.referral_code);
        return {
          code: existing.referral_code,
          link: `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${existing.referral_code}`,
          stats,
        };
      }

      // Create new referral code
      const referralCode = this.generateReferralCode(userId);
      const { data: referral } = await supabase
        .from('referrals')
        .insert({
          referrer_id: userId,
          referral_code: referralCode,
          program_id: this.defaultProgram.id,
          reward_status: 'pending',
          expires_at: new Date(Date.now() + (this.defaultProgram.expiryDays || 365) * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      const stats = await this.getReferralStats(userId, referralCode);

      return {
        code: referralCode,
        link: `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${referralCode}`,
        stats,
      };
    } catch (error) {
      _logger.error('Error getting referral code', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Process referral signup
   */
  async processReferralSignup(
    refereeUserId: string,
    referralCode: string
  ): Promise<{ success: boolean; rewards: ReferralReward[] }> {
    try {
      // Find referral
      const { data: referral } = await supabase
        .from('referrals')
        .select('*')
        .eq('referral_code', referralCode)
        .single();

      if (!referral) {
        return { success: false, rewards: [] };
      }

      // Check if already used by this user
      const { data: existing } = await supabase
        .from('referral_signups')
        .select('*')
        .eq('referee_id', refereeUserId)
        .eq('referral_id', referral.id)
        .single();

      if (existing) {
        return { success: false, rewards: [] };
      }

      // Record signup
      await supabase.from('referral_signups').insert({
        referral_id: referral.id,
        referrer_id: referral.referrer_id,
        referee_id: refereeUserId,
        signed_up_at: new Date().toISOString(),
        status: 'pending',
      });

      // Award initial rewards
      const rewards: ReferralReward[] = [];

      // Referee reward
      if (this.defaultProgram.refereeReward.eligibility === 'referee' || 
          this.defaultProgram.refereeReward.eligibility === 'both') {
        await this.awardReward(
          refereeUserId,
          this.defaultProgram.refereeReward,
          referral.id
        );
        rewards.push(this.defaultProgram.refereeReward);
      }

      // Referrer reward (pending conversion)
      if (this.defaultProgram.referrerReward.eligibility === 'referrer' || 
          this.defaultProgram.referrerReward.eligibility === 'both') {
        await supabase.from('referral_rewards').insert({
          referral_id: referral.id,
          user_id: referral.referrer_id,
          reward_type: this.defaultProgram.referrerReward.type,
          reward_value: this.defaultProgram.referrerReward.value,
          status: 'pending_conversion',
          created_at: new Date().toISOString(),
        });
      }

      // Track event
      await analytics.trackEvent('referral_signup', {
        referrer_id: referral.referrer_id,
        referee_id: refereeUserId,
        referral_code: referralCode,
      });

      return { success: true, rewards };
    } catch (error) {
      _logger.error('Error processing referral signup', {
        referralCode,
        error: error instanceof Error ? error.message : String(error),
      });
      return { success: false, rewards: [] };
    }
  }

  /**
   * Process referral conversion (when referee becomes paid)
   */
  async processReferralConversion(
    refereeUserId: string,
    planValue: number
  ): Promise<void> {
    try {
      // Find referral signup
      const { data: signup } = await supabase
        .from('referral_signups')
        .select('referral_id, referrer_id')
        .eq('referee_id', refereeUserId)
        .eq('status', 'pending')
        .single();

      if (!signup) return;

      // Award conversion bonus to referrer
      if (this.defaultProgram.conversionBonus) {
        await this.awardReward(
          signup.referrer_id,
          this.defaultProgram.conversionBonus,
          signup.referral_id
        );
      }

      // Award pending referrer reward
      await supabase
        .from('referral_rewards')
        .update({ status: 'awarded' })
        .eq('referral_id', signup.referral_id)
        .eq('status', 'pending_conversion');

      // Update signup status
      await supabase
        .from('referral_signups')
        .update({ status: 'converted', converted_at: new Date().toISOString() })
        .eq('id', signup.id);

      // Track conversion
      await analytics.trackEvent('referral_conversion', {
        referrer_id: signup.referrer_id,
        referee_id: refereeUserId,
        conversion_value: planValue,
      });
    } catch (error) {
      _logger.error('Error processing referral conversion', {
        refereeUserId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get referral statistics
   */
  async getReferralStats(userId: string, referralCode: string): Promise<ReferralStats> {
    try {
      // Get referral record
      const { data: referral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referral_code', referralCode)
        .eq('referrer_id', userId)
        .single();

      if (!referral) {
        return {
          userId,
          referralCode,
          totalReferrals: 0,
          activeReferrals: 0,
          convertedReferrals: 0,
          totalRewardsEarned: 0,
          pendingRewards: 0,
          referralLink: `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${referralCode}`,
        };
      }

      // Get signups
      const { data: signups } = await supabase
        .from('referral_signups')
        .select('status')
        .eq('referral_id', referral.id);

      const totalReferrals = signups?.length || 0;
      const activeReferrals = signups?.filter(s => s.status === 'pending').length || 0;
      const convertedReferrals = signups?.filter(s => s.status === 'converted').length || 0;

      // Get rewards
      const { data: rewards } = await supabase
        .from('referral_rewards')
        .select('reward_value, status')
        .eq('user_id', userId)
        .eq('referral_id', referral.id);

      const totalRewardsEarned = rewards
        ?.filter(r => r.status === 'awarded')
        .reduce((sum, r) => sum + (r.reward_value || 0), 0) || 0;

      const pendingRewards = rewards
        ?.filter(r => r.status === 'pending_conversion')
        .reduce((sum, r) => sum + (r.reward_value || 0), 0) || 0;

      return {
        userId,
        referralCode,
        totalReferrals,
        activeReferrals,
        convertedReferrals,
        totalRewardsEarned,
        pendingRewards,
        referralLink: `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${referralCode}`,
      };
    } catch (error) {
      _logger.error('Error getting referral stats', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        userId,
        referralCode,
        totalReferrals: 0,
        activeReferrals: 0,
        convertedReferrals: 0,
        totalRewardsEarned: 0,
        pendingRewards: 0,
        referralLink: `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${referralCode}`,
      };
    }
  }

  /**
   * Award reward to user
   */
  private async awardReward(
    userId: string,
    reward: ReferralReward,
    referralId: string
  ): Promise<void> {
    try {
      if (reward.type === 'subscription_days') {
        // Extend subscription
        await supabase.rpc('extend_subscription', {
          user_id_param: userId,
          days_param: reward.value,
        });
      } else if (reward.type === 'credits') {
        // Add credits
        await supabase.from('usage_credits').insert({
          user_id: userId,
          credits: reward.value,
          source: 'referral',
          referral_id: referralId,
          created_at: new Date().toISOString(),
        });
      } else if (reward.type === 'discount') {
        // Store discount code
        await supabase.from('user_discounts').insert({
          user_id: userId,
          discount_percent: reward.value,
          referral_id: referralId,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      // Record reward
      await supabase.from('referral_rewards').insert({
        referral_id: referralId,
        user_id: userId,
        reward_type: reward.type,
        reward_value: reward.value,
        status: 'awarded',
        awarded_at: new Date().toISOString(),
      });
    } catch (error) {
      _logger.error('Error awarding reward', {
        userId,
        rewardType: reward.type,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Generate unique referral code
   */
  private generateReferralCode(userId: string): string {
    const userPart = userId.slice(0, 8).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `REF-${userPart}-${randomPart}`;
  }
}

export const enhancedReferral = new EnhancedReferralProgram();
