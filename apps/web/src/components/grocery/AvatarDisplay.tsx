/**
 * Avatar Display Component
 * Shows user avatar with customization options and level display
 */

'use client';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('avatardisplay');



import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarPart } from '@/lib/grocery/avatar';
import { avatarSystem } from '@/lib/grocery/avatar';
import { groceryGamification } from '@/lib/grocery/gamification';
import { Crown, Sparkles, Settings } from 'lucide-react';

interface AvatarDisplayProps {
  userId: string;
  showCustomize?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarDisplay({ userId, showCustomize = false, size = 'md' }: AvatarDisplayProps) {
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState(0);
  const [customizing, setCustomizing] = useState(false);

  useEffect(() => {
    loadAvatar();
  }, [userId]);

  async function loadAvatar() {
    try {
      const userPoints = await groceryGamification.getUserPoints(userId);
      const userAvatar = await avatarSystem.getUserAvatar(userId, userPoints.totalEarned, userPoints.level);
      
      setAvatar(userAvatar);
      setPoints(userPoints.points);
      setLevel(userPoints.level);
    } catch (error) {
      _logger.error('Failed to load avatar:', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  const sizeClasses = {
    sm: 'h-16 w-16 text-2xl',
    md: 'h-24 w-24 text-4xl',
    lg: 'h-32 w-32 text-6xl',
  };

  if (!avatar) {
    return <div className={sizeClasses[size]} />;
  }

  const avatarParts = avatarSystem.getAllParts();
  const headPart = avatarParts.find(p => p.id === avatar.head);
  const bodyPart = avatarParts.find(p => p.id === avatar.body);
  const bgPart = avatarParts.find(p => p.id === avatar.background);

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Your Avatar</CardTitle>
          {showCustomize && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCustomizing(!customizing)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Avatar Display */}
        <motion.div
          className={`
            ${sizeClasses[size]} 
            mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/5
            flex items-center justify-center relative
            border-2 border-primary/20
          `}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        >
          {/* Background */}
          <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-20">
            {bgPart?.icon}
          </div>

          {/* Avatar Parts */}
          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {headPart?.icon || '👤'}
            </motion.div>
            <div className="-mt-2">
              {bodyPart?.icon || '👕'}
            </div>
          </div>

          {/* Level Badge */}
          <Badge
            className="absolute -top-2 -right-2 bg-primary text-primary-foreground"
            variant="default"
          >
            Lv.{level}
          </Badge>
        </motion.div>

        {/* Points Display */}
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-semibold">{points} Points</span>
        </div>

        {/* Level Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Level {level}</span>
            <span>Level {level + 1}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/60"
              initial={{ width: 0 }}
              animate={{ width: `${(points / 100) * 100}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>

        {/* Customization Panel */}
        {customizing && showCustomize && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-4 border-t space-y-2"
          >
            <div className="text-xs font-semibold">Customize Avatar</div>
            {/* TODO: Add customization options */}
            <div className="text-xs text-muted-foreground">
              Unlock more parts by earning points!
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
