import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('gamification');

/**
 * Grocery Gamification System
 * Points, rewards, and achievements for grocery activities
 */

import { gamificationSystem } from '../gamification/system';

export interface GroceryPoints {
  points: number;
  level: number;
  nextLevelPoints: number;
  totalEarned: number;
}

export interface GroceryReward {
  id: string;
  name: string;
  description: string;
  icon: string;
  pointsRequired: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface GroceryAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  reward: number; // Points reward
  unlocked: boolean;
}

export class GroceryGamification {
  private readonly POINTS_PER_ACTION = {
    SEARCH: 1,
    ADD_TO_CART: 5,
    COMPLETE_QUIZ: 10,
    SHARE_LIST: 3,
    COLLABORATE: 5,
    COMPLETE_PURCHASE: 20,
    CATEGORY_EXPLORE: 2,
  };

  private readonly LEVEL_THRESHOLDS = [
    0, 50, 150, 300, 500, 750, 1000, 1500, 2000, 3000, 5000,
  ];

  async awardPoints(userId: string, action: keyof typeof this.POINTS_PER_ACTION): Promise<GroceryPoints> {
    const points = this.POINTS_PER_ACTION[action];
    
    try {
      await gamificationSystem.awardPoints(userId, points, {
        source: 'grocery',
        action,
      });
    } catch (error) {
      _logger.warn('Failed to award points:', { error });
    }

    return this.getUserPoints(userId);
  }

  async getUserPoints(userId: string): Promise<GroceryPoints> {
    let totalEarned = 0;
    try {
      totalEarned = await gamificationSystem.getUserPoints(userId);
    } catch (error) {
      _logger.warn('Failed to get user points:', { error });
    }
    const level = this.calculateLevel(totalEarned);
    const nextLevelPoints = this.LEVEL_THRESHOLDS[level + 1] || Infinity;

    return {
      points: totalEarned % 100, // Current points in level
      level,
      nextLevelPoints,
      totalEarned,
    };
  }

  private calculateLevel(totalPoints: number): number {
    for (let i = this.LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (totalPoints >= this.LEVEL_THRESHOLDS[i]) {
        return i;
      }
    }
    return 0;
  }

  async getRewards(userId: string): Promise<GroceryReward[]> {
    const userPoints = await this.getUserPoints(userId);
    
    const rewards: GroceryReward[] = [
      {
        id: 'first-cart',
        name: 'First Cart',
        description: 'Add your first item to cart',
        icon: '🛒',
        pointsRequired: 5,
        unlocked: userPoints.totalEarned >= 5,
      },
      {
        id: 'cart-master',
        name: 'Cart Master',
        description: 'Add 10 items to cart',
        icon: '👑',
        pointsRequired: 50,
        unlocked: userPoints.totalEarned >= 50,
      },
      {
        id: 'quiz-champion',
        name: 'Quiz Champion',
        description: 'Complete 5 quizzes',
        icon: '🧠',
        pointsRequired: 50,
        unlocked: userPoints.totalEarned >= 50,
      },
      {
        id: 'social-butterfly',
        name: 'Social Butterfly',
        description: 'Share 5 grocery lists',
        icon: '🦋',
        pointsRequired: 15,
        unlocked: userPoints.totalEarned >= 15,
      },
      {
        id: 'collaborator',
        name: 'Collaborator',
        description: 'Collaborate on 3 lists',
        icon: '👥',
        pointsRequired: 15,
        unlocked: userPoints.totalEarned >= 15,
      },
      {
        id: 'purchaser',
        name: 'Smart Purchaser',
        description: 'Complete a purchase',
        icon: '💳',
        pointsRequired: 20,
        unlocked: userPoints.totalEarned >= 20,
      },
    ];

    return rewards;
  }

  async getAchievements(userId: string): Promise<GroceryAchievement[]> {
    // TODO: Fetch from database
    return [
      {
        id: 'explore-all-categories',
        name: 'Category Explorer',
        description: 'Explore all grocery categories',
        icon: '🗺️',
        progress: 0,
        target: 8,
        reward: 50,
        unlocked: false,
      },
      {
        id: 'price-comparison-pro',
        name: 'Price Comparison Pro',
        description: 'Compare prices 10 times',
        icon: '💰',
        progress: 0,
        target: 10,
        reward: 30,
        unlocked: false,
      },
    ];
  }
}

export const groceryGamification = new GroceryGamification();
