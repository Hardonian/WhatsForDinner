/**
 * Streak System
 * Tracks user meal planning streaks
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  streakBonus: number; // Multiplier for rewards
}

export async function getStreak(userId: string): Promise<StreakData> {
  const { data } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!data) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      streakBonus: 1,
    };
  }

  const lastActivity = data.last_activity_date ? new Date(data.last_activity_date) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let currentStreak = data.current_streak || 0;
  
  if (lastActivity) {
    const lastDate = new Date(lastActivity);
    lastDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Continue streak
      currentStreak += 1;
    } else if (daysDiff > 1) {
      // Streak broken
      currentStreak = 1;
    }
    // daysDiff === 0 means already counted today
  } else {
    currentStreak = 1;
  }

  const streakBonus = Math.min(1 + (currentStreak * 0.1), 2); // Max 2x bonus

  return {
    currentStreak,
    longestStreak: Math.max(data.longest_streak || 0, currentStreak),
    lastActivityDate: lastActivity?.toISOString() || null,
    streakBonus,
  };
}

export async function updateStreak(userId: string): Promise<StreakData> {
  const streak = await getStreak(userId);
  const today = new Date().toISOString().split('T')[0];

  await supabase.from('user_streaks').upsert({
    user_id: userId,
    current_streak: streak.currentStreak,
    longest_streak: streak.longestStreak,
    last_activity_date: today,
    updated_at: new Date().toISOString(),
  });

  return streak;
}
