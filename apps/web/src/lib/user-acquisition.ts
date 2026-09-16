import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('user-acquisition');

/**
 * User Acquisition Improvements
 * Enhanced conversion funnel and referral system
 */

import { supabase } from './supabaseClient';

export interface AcquisitionChannel {
  id: string;
  name: string;
  type: 'organic' | 'paid' | 'referral' | 'social' | 'direct';
  conversionRate: number;
  costPerAcquisition?: number;
  monthlyUsers: number;
}

export interface ReferralProgram {
  enabled: boolean;
  rewardType: 'credit' | 'discount' | 'feature';
  referrerReward: string;
  refereeReward: string;
  minReferrals: number;
}

export interface ConversionFunnel {
  stage: string;
  users: number;
  conversionRate: number;
  dropoffRate: number;
}

/**
 * Track user acquisition
 */
export async function trackAcquisition(
  userId: string,
  channel: string,
  source?: string,
  campaign?: string
): Promise<boolean> {
  try {
    await supabase.from('user_acquisition').insert({
      user_id: userId,
      channel,
      source: source || 'direct',
      campaign: campaign || null,
      acquired_at: new Date().toISOString(),
    });

    // Track conversion event
    await trackConversionEvent(userId, 'user_acquired', {
      channel,
      source,
      campaign,
    });

    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      _logger.error('Error tracking acquisition:', { error: error instanceof Error ? error.message : String(error) });
    }
    return false;
  }
}

/**
 * Get acquisition channels performance
 */
export async function getAcquisitionChannels(): Promise<AcquisitionChannel[]> {
  try {
    const { data, error } = await supabase
      .from('user_acquisition')
      .select('channel, source')
      .gte('acquired_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    // Aggregate by channel
    const channelMap = new Map<string, { count: number; sources: Set<string> }>();

    data?.forEach((acq: any) => {
      const existing = channelMap.get(acq.channel) || { count: 0, sources: new Set() };
      existing.count++;
      if (acq.source) existing.sources.add(acq.source);
      channelMap.set(acq.channel, existing);
    });

    // Get conversion rates
    const channels: AcquisitionChannel[] = [];
    for (const [channel, stats] of channelMap.entries()) {
      const conversionRate = await getChannelConversionRate(channel);
      channels.push({
        id: channel,
        name: formatChannelName(channel),
        type: getChannelType(channel),
        conversionRate,
        monthlyUsers: stats.count,
      });
    }

    return channels.sort((a, b) => b.monthlyUsers - a.monthlyUsers);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      _logger.error('Error fetching acquisition channels:', { error: error instanceof Error ? error.message : String(error) });
    }
    return [];
  }
}

/**
 * Get conversion funnel
 */
export async function getConversionFunnel(): Promise<ConversionFunnel[]> {
  try {
    const stages = [
      { id: 'landing', name: 'Landing Page' },
      { id: 'signup', name: 'Sign Up' },
      { id: 'onboarding', name: 'Onboarding' },
      { id: 'first_recipe', name: 'First Recipe' },
      { id: 'active', name: 'Active User' },
    ];

    const funnel: ConversionFunnel[] = [];

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const users = await getStageUsers(stage.id);
      const previousUsers = i > 0 ? funnel[i - 1].users : users;
      const conversionRate = previousUsers > 0 
        ? Math.round((users / previousUsers) * 100) 
        : 0;
      const dropoffRate = 100 - conversionRate;

      funnel.push({
        stage: stage.name,
        users,
        conversionRate,
        dropoffRate,
      });
    }

    return funnel;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      _logger.error('Error calculating conversion funnel:', { error: error instanceof Error ? error.message : String(error) });
    }
    return [];
  }
}

/**
 * Create referral code
 */
export async function createReferralCode(userId: string): Promise<string | null> {
  try {
    const code = generateReferralCode(userId);

    const { error } = await supabase.from('referral_codes').insert({
      user_id: userId,
      code,
      created_at: new Date().toISOString(),
      usage_count: 0,
    });

    if (error) throw error;

    return code;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      _logger.error('Error creating referral code:', { error: error instanceof Error ? error.message : String(error) });
    }
    return null;
  }
}

/**
 * Process referral
 */
export async function processReferral(
  referralCode: string,
  newUserId: string
): Promise<boolean> {
  try {
    // Get referrer
    const { data: referral, error: refError } = await supabase
      .from('referral_codes')
      .select('user_id')
      .eq('code', referralCode)
      .single();

    if (refError || !referral) return false;

    // Record referral
    const { error: insertError } = await supabase.from('referrals').insert({
      referrer_id: referral.user_id,
      referee_id: newUserId,
      referral_code: referralCode,
      created_at: new Date().toISOString(),
      status: 'pending',
    });

    if (insertError) throw insertError;

    // Update referral code usage
    await supabase
      .from('referral_codes')
      .update({ usage_count: supabase.rpc('increment', { row_id: referralCode }) })
      .eq('code', referralCode);

    // Apply rewards
    await applyReferralRewards(referral.user_id, newUserId);

    // Track event
    await trackConversionEvent(newUserId, 'referral_used', {
      referralCode,
      referrerId: referral.user_id,
    });

    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      _logger.error('Error processing referral:', { error: error instanceof Error ? error.message : String(error) });
    }
    return false;
  }
}

/**
 * Get referral program status
 */
export async function getReferralProgram(): Promise<ReferralProgram> {
  // Default referral program
  return {
    enabled: true,
    rewardType: 'credit',
    referrerReward: '1 month free',
    refereeReward: '1 week free',
    minReferrals: 1,
  };
}

/**
 * Optimize conversion funnel
 */
export async function optimizeConversionFunnel(): Promise<{
  recommendations: string[];
  impact: 'high' | 'medium' | 'low';
}> {
  const funnel = await getConversionFunnel();
  const recommendations: string[] = [];
  let impact: 'high' | 'medium' | 'low' = 'low';

  // Analyze dropoff points
  funnel.forEach((stage, index) => {
    if (stage.dropoffRate > 50 && index < funnel.length - 1) {
      recommendations.push(
        `High dropoff at ${stage.stage} (${stage.dropoffRate}%). Consider A/B testing improvements.`
      );
      if (stage.dropoffRate > 70) impact = 'high';
    }
  });

  // Check overall conversion
  const overallConversion = funnel[funnel.length - 1]?.conversionRate || 0;
  if (overallConversion < 20) {
    recommendations.push(
      `Overall conversion rate is ${overallConversion}%. Focus on improving onboarding experience.`
    );
    impact = 'high';
  }

  return { recommendations, impact };
}

// Helper functions

async function getChannelConversionRate(channel: string): Promise<number> {
  // Simplified - in production, calculate actual conversion rates
  const baseRates: Record<string, number> = {
    organic: 25,
    paid: 20,
    referral: 35,
    social: 15,
    direct: 30,
  };
  return baseRates[channel] || 15;
}

function formatChannelName(channel: string): string {
  return channel
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getChannelType(channel: string): AcquisitionChannel['type'] {
  if (channel.includes('referral')) return 'referral';
  if (channel.includes('social')) return 'social';
  if (channel.includes('paid') || channel.includes('ad')) return 'paid';
  if (channel.includes('search') || channel.includes('organic')) return 'organic';
  return 'direct';
}

async function getStageUsers(stageId: string): Promise<number> {
  try {
    // Simplified - in production, query actual user counts
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    // Apply stage filters
    const multipliers: Record<string, number> = {
      landing: 1.0,
      signup: 0.8,
      onboarding: 0.6,
      first_recipe: 0.4,
      active: 0.25,
    };

    return Math.round((count || 0) * (multipliers[stageId] || 0.5));
  } catch {
    return 0;
  }
}

function generateReferralCode(userId: string): string {
  const prefix = userId.substring(0, 4).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${random}`;
}

async function applyReferralRewards(referrerId: string, refereeId: string): Promise<void> {
  try {
    // Apply rewards to both users
    await supabase.from('user_rewards').insert([
      {
        user_id: referrerId,
        reward_type: 'referral',
        reward_value: '1 month free',
        status: 'pending',
        created_at: new Date().toISOString(),
      },
      {
        user_id: refereeId,
        reward_type: 'referral',
        reward_value: '1 week free',
        status: 'pending',
        created_at: new Date().toISOString(),
      },
    ]);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      _logger.error('Error applying referral rewards:', { error: error instanceof Error ? error.message : String(error) });
    }
  }
}

async function trackConversionEvent(
  userId: string,
  event: string,
  properties?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from('analytics_events').insert({
      user_id: userId,
      event_name: event,
      event_properties: properties || {},
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    // Analytics tracking should not block user flow
    if (process.env.NODE_ENV === 'development') {
      _logger.error('Error tracking conversion event:', { error: error instanceof Error ? error.message : String(error) });
    }
  }
}
