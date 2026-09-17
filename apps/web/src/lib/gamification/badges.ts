/**
 * Badge System
 * Awards badges for achievements
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

export const BADGES: Record<string, Badge> = {
  'first_recipe': {
    id: 'first_recipe',
    name: 'First Recipe',
    description: 'Generated your first recipe',
    icon: '🎯',
    rarity: 'common',
  },
  'pantry_master': {
    id: 'pantry_master',
    name: 'Pantry Master',
    description: 'Added 50+ ingredients to pantry',
    icon: '🥫',
    rarity: 'rare',
  },
  'recipe_explorer': {
    id: 'recipe_explorer',
    name: 'Recipe Explorer',
    description: 'Generated 100+ recipes',
    icon: '🗺️',
    rarity: 'rare',
  },
  'streak_7': {
    id: 'streak_7',
    name: 'Week Warrior',
    description: '7-day meal planning streak',
    icon: '🔥',
    rarity: 'epic',
  },
  'streak_30': {
    id: 'streak_30',
    name: 'Monthly Master',
    description: '30-day meal planning streak',
    icon: '👑',
    rarity: 'legendary',
  },
  'health_hero': {
    id: 'health_hero',
    name: 'Health Hero',
    description: 'Tracked nutrition for 30 days',
    icon: '💪',
    rarity: 'epic',
  },
  'sharing_champion': {
    id: 'sharing_champion',
    name: 'Sharing Champion',
    description: 'Shared 10+ recipes',
    icon: '📤',
    rarity: 'rare',
  },
};

export async function checkAndAwardBadges(userId: string, action: string, metadata?: Record<string, unknown>): Promise<Badge[]> {
  const { data: userBadges } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const unlockedBadgeIds = new Set(userBadges?.map(b => b.badge_id) || []);
  const newlyUnlocked: Badge[] = [];

  // Check badge conditions
  if (action === 'recipe_generated') {
    const recipeCount = (metadata?.totalRecipes as number) || 0;
    
    if (recipeCount === 1 && !unlockedBadgeIds.has('first_recipe')) {
      await awardBadge(userId, 'first_recipe');
      newlyUnlocked.push(BADGES.first_recipe);
    }
    
    if (recipeCount >= 100 && !unlockedBadgeIds.has('recipe_explorer')) {
      await awardBadge(userId, 'recipe_explorer');
      newlyUnlocked.push(BADGES.recipe_explorer);
    }
  }

  if (action === 'pantry_updated') {
    const pantryCount = (metadata?.totalItems as number) || 0;
    if (pantryCount >= 50 && !unlockedBadgeIds.has('pantry_master')) {
      await awardBadge(userId, 'pantry_master');
      newlyUnlocked.push(BADGES.pantry_master);
    }
  }

  if (action === 'streak_updated') {
    const streak = (metadata?.streak as number) || 0;
    if (streak === 7 && !unlockedBadgeIds.has('streak_7')) {
      await awardBadge(userId, 'streak_7');
      newlyUnlocked.push(BADGES.streak_7);
    }
    if (streak === 30 && !unlockedBadgeIds.has('streak_30')) {
      await awardBadge(userId, 'streak_30');
      newlyUnlocked.push(BADGES.streak_30);
    }
  }

  if (action === 'recipe_shared') {
    const shareCount = (metadata?.totalShares as number) || 0;
    if (shareCount >= 10 && !unlockedBadgeIds.has('sharing_champion')) {
      await awardBadge(userId, 'sharing_champion');
      newlyUnlocked.push(BADGES.sharing_champion);
    }
  }

  return newlyUnlocked;
}

async function awardBadge(userId: string, badgeId: string): Promise<void> {
  await supabase.from('user_badges').insert({
    user_id: userId,
    badge_id: badgeId,
    unlocked_at: new Date().toISOString(),
  });
}

export async function getUserBadges(userId: string): Promise<Badge[]> {
  const { data } = await supabase
    .from('user_badges')
    .select('badge_id, unlocked_at')
    .eq('user_id', userId);

  return (data || []).map(b => ({
    ...BADGES[b.badge_id],
    unlockedAt: b.unlocked_at,
  }));
}
