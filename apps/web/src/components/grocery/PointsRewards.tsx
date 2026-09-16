/**
 * Points and Rewards Display Component
 * Shows user points, level, rewards, and achievements
 */

'use client';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('pointsrewards');



import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GroceryPoints, GroceryReward, GroceryAchievement } from '@/lib/grocery/gamification';
import { groceryGamification } from '@/lib/grocery/gamification';
import { Trophy, Gift, Star, Sparkles, Lock } from 'lucide-react';

interface PointsRewardsProps {
  userId: string;
}

export function PointsRewards({ userId }: PointsRewardsProps) {
  const [points, setPoints] = useState<GroceryPoints | null>(null);
  const [rewards, setRewards] = useState<GroceryReward[]>([]);
  const [achievements, setAchievements] = useState<GroceryAchievement[]>([]);
  const [selectedTab, setSelectedTab] = useState<'rewards' | 'achievements'>('rewards');

  useEffect(() => {
    loadData();
  }, [userId]);

  async function loadData() {
    try {
      const userPoints = await groceryGamification.getUserPoints(userId);
      const userRewards = await groceryGamification.getRewards(userId);
      const userAchievements = await groceryGamification.getAchievements(userId);

      setPoints(userPoints);
      setRewards(userRewards);
      setAchievements(userAchievements);
    } catch (error) {
      _logger.error('Failed to load points/rewards:', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  if (!points) {
    return <div>Loading...</div>;
  }

  const progressToNextLevel = points.nextLevelPoints > 0
    ? ((points.points / points.nextLevelPoints) * 100)
    : 100;

  return (
    <div className="space-y-4">
      {/* Points Summary Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Your Points
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{points.points}</span>
            <span className="text-muted-foreground">/ {points.nextLevelPoints}</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Level {points.level}</span>
              <span>Level {points.level + 1}</span>
            </div>
            <Progress value={progressToNextLevel} className="h-3" />
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-muted-foreground">Total Earned:</span>
              <span className="font-semibold">{points.totalEarned}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setSelectedTab('rewards')}
          className={`
            px-4 py-2 font-medium text-sm border-b-2 transition-colors
            ${selectedTab === 'rewards' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
            }
          `}
        >
          <Gift className="h-4 w-4 inline mr-2" />
          Rewards
        </button>
        <button
          onClick={() => setSelectedTab('achievements')}
          className={`
            px-4 py-2 font-medium text-sm border-b-2 transition-colors
            ${selectedTab === 'achievements' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
            }
          `}
        >
          <Star className="h-4 w-4 inline mr-2" />
          Achievements
        </button>
      </div>

      {/* Rewards Tab */}
      <AnimatePresence mode="wait">
        {selectedTab === 'rewards' && (
          <motion.div
            key="rewards"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {rewards.map((reward, index) => (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={reward.unlocked ? 'border-primary/50' : 'opacity-60'}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">
                        {reward.unlocked ? reward.icon : '🔒'}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{reward.name}</h3>
                          {reward.unlocked && (
                            <Badge variant="secondary" className="text-xs">
                              Unlocked
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {reward.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <Sparkles className="h-3 w-3" />
                          <span>{reward.pointsRequired} points required</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Achievements Tab */}
        {selectedTab === 'achievements' && (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">
                        {achievement.unlocked ? achievement.icon : '🔒'}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{achievement.name}</h3>
                          {achievement.unlocked && (
                            <Badge variant="default">
                              +{achievement.reward} pts
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {achievement.description}
                        </p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Progress</span>
                            <span>{achievement.progress} / {achievement.target}</span>
                          </div>
                          <Progress 
                            value={(achievement.progress / achievement.target) * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
