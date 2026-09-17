/**
 * Badge Collection Component
 * Shows user's unlocked badges
 */

'use client';

import { useEffect, useState } from 'react';
import { Award, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { gamificationSystem, type Badge as BadgeType } from '@/lib/gamification/system';

interface BadgeCollectionProps {
  userId: string;
}

const rarityColors = {
  common: 'bg-gray-100 text-gray-800',
  rare: 'bg-blue-100 text-blue-800',
  epic: 'bg-purple-100 text-purple-800',
  legendary: 'bg-yellow-100 text-yellow-800',
};

export function BadgeCollection({ userId }: BadgeCollectionProps) {
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBadges = async () => {
      const userBadges = await gamificationSystem.getUserBadges(userId);
      setBadges(userBadges);
      setIsLoading(false);
    };

    if (userId) {
      loadBadges();
    }
  }, [userId]);

  if (isLoading) {
    return <div className="animate-pulse">Loading badges...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5" />
          Badge Collection ({badges.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {badges.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Lock className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No badges yet. Start generating recipes to earn your first badge!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className="flex flex-col items-center p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-2">{badge.icon}</div>
                <div className="text-sm font-semibold text-center mb-1">{badge.name}</div>
                <div className="text-xs text-muted-foreground text-center mb-2">
                  {badge.description}
                </div>
                <Badge className={rarityColors[badge.rarity]}>
                  {badge.rarity}
                </Badge>
                {badge.unlockedAt && (
                  <div className="text-xs text-muted-foreground mt-2">
                    {new Date(badge.unlockedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BadgeCollection;
