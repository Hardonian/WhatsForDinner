'use client';

import { Award, Flame, Target, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Streak {
  id: string;
  label: string;
  current: number;
  target: number;
  icon: typeof Flame;
  color: string;
}

interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export function StreaksBadgesCard() {
  const streaks: Streak[] = [
    {
      id: 'meal-planning',
      label: 'Meal Planning',
      current: 12,
      target: 30,
      icon: Flame,
      color: 'text-orange-600',
    },
    {
      id: 'health-tracking',
      label: 'Health Tracking',
      current: 8,
      target: 21,
      icon: Target,
      color: 'text-blue-600',
    },
  ];

  const recentBadges: BadgeItem[] = [
    {
      id: '1',
      name: 'Week Warrior',
      description: '7 days of meal planning',
      icon: '??',
      earned: true,
      rarity: 'common',
    },
    {
      id: '2',
      name: 'Nutrition Master',
      description: 'Logged 50 meals',
      icon: '?',
      earned: true,
      rarity: 'rare',
    },
    {
      id: '3',
      name: 'Family Champion',
      description: 'Coordinated 10 family meals',
      icon: '??',
      earned: false,
      rarity: 'epic',
    },
  ];

  const getRarityColor = (rarity: BadgeItem['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'border-gray-300 bg-gray-50 dark:bg-gray-800';
      case 'rare':
        return 'border-blue-300 bg-blue-50 dark:bg-blue-900';
      case 'epic':
        return 'border-purple-300 bg-purple-50 dark:bg-purple-900';
      case 'legendary':
        return 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900';
    }
  };

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-600" />
        <h3 className="font-semibold text-lg">Streaks & Badges</h3>
      </div>

      {/* Streaks */}
      <div className="space-y-3 mb-6">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Active Streaks
        </h4>
        {streaks.map((streak) => {
          const Icon = streak.icon;
          const progress = (streak.current / streak.target) * 100;

          return (
            <div key={streak.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${streak.color}`} />
                  <span className="text-sm font-medium">{streak.label}</span>
                </div>
                <span className="text-sm font-semibold">
                  {streak.current} / {streak.target} days
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${streak.color.replace('text-', 'bg-')}`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Badges */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Recent Badges
        </h4>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          {recentBadges.map((badge) => (
            <div
              key={badge.id}
              className={`flex-shrink-0 w-20 p-3 rounded-lg border-2 text-center ${
                badge.earned
                  ? getRarityColor(badge.rarity)
                  : 'border-dashed border-muted-foreground/30 opacity-50'
              }`}
            >
              <div className="text-3xl mb-1">{badge.earned ? badge.icon : '??'}</div>
              <p className="text-xs font-semibold leading-tight">{badge.name}</p>
              {badge.earned && (
                <Badge
                  variant="secondary"
                  className="mt-1 text-xs"
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                  }}
                >
                  {badge.rarity}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      <Button variant="outline" className="w-full mt-4">
        <Award className="w-4 h-4 mr-2" />
        View All Achievements
      </Button>
    </Card>
  );
}

export default StreaksBadgesCard;
