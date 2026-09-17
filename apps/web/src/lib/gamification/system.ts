/**
 * Gamification System
 * Streaks, badges, challenges, leaderboards
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
}

export interface Streak {
  current: number;
  longest: number;
  lastActivity: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  progress: number;
  target: number;
  reward: {
    type: 'badge' | 'credits' | 'feature';
    value: string | number;
  };
  expiresAt?: string;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  score: number;
  rank: number;
  badges: number;
  streak: number;
}

export class GamificationSystem {
  /**
   * Get user streak
   */
  async getUserStreak(userId: string): Promise<Streak> {
    const { data } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!data) {
      return { current: 0, longest: 0, lastActivity: new Date().toISOString() };
    }

    // Check if streak is still active (within 24 hours)
    const lastActivity = new Date(data.last_activity);
    const now = new Date();
    const hoursSinceLastActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastActivity > 24) {
      // Streak broken, reset
      await supabase
        .from('user_streaks')
        .update({
          current_streak: 0,
          last_activity: now.toISOString(),
        })
        .eq('user_id', userId);

      return { current: 0, longest: data.longest_streak, lastActivity: now.toISOString() };
    }

    return {
      current: data.current_streak,
      longest: data.longest_streak,
      lastActivity: data.last_activity,
    };
  }

  /**
   * Update streak (call when user generates/saves recipe)
   */
  async updateStreak(userId: string): Promise<Streak> {
    const currentStreak = await this.getUserStreak(userId);
    const now = new Date();
    const lastActivity = new Date(currentStreak.lastActivity);
    const hoursSinceLastActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

    let newStreak = currentStreak.current;

    if (hoursSinceLastActivity < 24) {
      // Continue streak
      newStreak = currentStreak.current + 1;
    } else if (hoursSinceLastActivity < 48) {
      // Still within grace period, continue
      newStreak = currentStreak.current + 1;
    } else {
      // Streak broken, start over
      newStreak = 1;
    }

    const longestStreak = Math.max(newStreak, currentStreak.longest);

    await supabase.from('user_streaks').upsert({
      user_id: userId,
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_activity: now.toISOString(),
    });

    // Award badges for milestones
    await this.checkStreakBadges(userId, newStreak);

    return {
      current: newStreak,
      longest: longestStreak,
      lastActivity: now.toISOString(),
    };
  }

  /**
   * Get user badges
   */
  async getUserBadges(userId: string): Promise<Badge[]> {
    const { data } = await supabase
      .from('user_badges')
      .select('badge_id, unlocked_at, badges(*)')
      .eq('user_id', userId);

    return (data || []).map((ub: any) => ({
      id: ub.badges.id,
      name: ub.badges.name,
      description: ub.badges.description,
      icon: ub.badges.icon,
      rarity: ub.badges.rarity,
      unlockedAt: ub.unlocked_at,
    }));
  }

  /**
   * Award badge
   */
  async awardBadge(userId: string, badgeId: string): Promise<void> {
    // Check if already has badge
    const { data: existing } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_id', badgeId)
      .single();

    if (existing) return;

    await supabase.from('user_badges').insert({
      user_id: userId,
      badge_id: badgeId,
      unlocked_at: new Date().toISOString(),
    });
  }

  /**
   * Check and award streak badges
   */
  private async checkStreakBadges(userId: string, streak: number): Promise<void> {
    const milestones = [3, 7, 14, 30, 60, 100];
    
    if (milestones.includes(streak)) {
      const badgeId = `streak_${streak}`;
      await this.awardBadge(userId, badgeId);
    }
  }

  /**
   * Get active challenges
   */
  async getActiveChallenges(userId: string): Promise<Challenge[]> {
    const { data } = await supabase
      .from('challenges')
      .select('*')
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    // Optimize: Get user progress for all challenges in one query (batch)
    const challengeIds = (data || []).map((c: any) => c.id);
    const { data: allProgress } = challengeIds.length > 0 ? await supabase
      .from('challenge_progress')
      .select('challenge_id, progress')
      .eq('user_id', userId)
      .in('challenge_id', challengeIds) : { data: [] };
    
    const progressMap = new Map((allProgress || []).map((p: any) => [p.challenge_id, p.progress]));
    
    // Map challenges with progress
    const challenges = (data || []).map((challenge: any) => {
      const progress = progressMap.get(challenge.id);

      return {
        id: challenge.id,
        name: challenge.name,
        description: challenge.description,
        type: challenge.type,
        progress: progress || 0,
        target: challenge.target,
        reward: challenge.reward,
        expiresAt: challenge.expires_at,
      };
    });

    return challenges;
  }

  /**
   * Update challenge progress
   */
  async updateChallengeProgress(userId: string, challengeId: string, increment: number = 1): Promise<void> {
    const { data: current } = await supabase
      .from('challenge_progress')
      .select('progress')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .single();

    const newProgress = (current?.progress || 0) + increment;

    await supabase.from('challenge_progress').upsert({
      user_id: userId,
      challenge_id: challengeId,
      progress: newProgress,
      updated_at: new Date().toISOString(),
    });

    // Check if completed
    const { data: challenge } = await supabase
      .from('challenges')
      .select('target, reward')
      .eq('id', challengeId)
      .single();

    if (challenge && newProgress >= challenge.target) {
      await this.completeChallenge(userId, challengeId, challenge.reward);
    }
  }

  /**
   * Complete challenge and award reward
   */
  private async completeChallenge(userId: string, challengeId: string, reward: any): Promise<void> {
    // Mark as completed
    await supabase.from('challenge_completions').insert({
      user_id: userId,
      challenge_id: challengeId,
      completed_at: new Date().toISOString(),
    });

    // Award reward
    if (reward.type === 'badge') {
      await this.awardBadge(userId, reward.value as string);
    } else if (reward.type === 'credits') {
      await supabase.rpc('increment_user_credits', {
        user_id_param: userId,
        credits_param: reward.value as number,
      });
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    const { data } = await supabase
      .from('leaderboard')
      .select('user_id, user_name, total_score, badge_count, current_streak, rank')
      .order('total_score', { ascending: false })
      .limit(limit);

    return (data || []).map((entry: any) => ({
      userId: entry.user_id,
      userName: entry.user_name,
      score: entry.total_score,
      rank: entry.rank,
      badges: entry.badge_count,
      streak: entry.current_streak,
    }));
  }

  /**
   * Calculate user score
   */
  async calculateUserScore(userId: string): Promise<number> {
    // Optimize: Fetch streak, badges, and recipe count in parallel
    const [streak, badges, recipeCountResult] = await Promise.all([
      this.getUserStreak(userId),
      this.getUserBadges(userId),
      supabase
        .from('recipes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
    ]);
    
    const recipeCount = recipeCountResult.count || 0;

    // Score calculation
    const streakScore = streak.current * 10;
    const badgeScore = badges.length * 50;
    const recipeScore = (recipeCount || 0) * 5;

    return streakScore + badgeScore + recipeScore;
  }
}

export const gamificationSystem = new GamificationSystem();
