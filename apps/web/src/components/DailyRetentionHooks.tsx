/**
 * Daily Retention Hooks Component
 * Streak counter, daily suggestion, check-in prompts
 */

'use client';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('dailyretentionhooks');



import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sparkles, Calendar, CheckCircle2, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

interface DailyRetentionHooksProps {
  userId?: string;
  compact?: boolean;
}

export function DailyRetentionHooks({ userId, compact = false }: DailyRetentionHooksProps) {
  const [streak, setStreak] = useState(7);
  const [dailySuggestion, setDailySuggestion] = useState<any>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);

  useEffect(() => {
    // Check if user checked in today
    const lastCheckIn = localStorage.getItem('lastCheckIn');
    const today = new Date().toDateString();
    setCheckedIn(lastCheckIn === today);

    // Show check-in prompt if not checked in and it's evening
    const hour = new Date().getHours();
    if (!checkedIn && hour >= 17 && hour <= 21) {
      setTimeout(() => setShowCheckIn(true), 2000);
    }

    // Load daily suggestion
    loadDailySuggestion();
  }, [checkedIn]);

  const loadDailySuggestion = async () => {
    try {
      const response = await fetch('/api/meal-plan/daily-suggestion');
      if (response.ok) {
        const data = await response.json();
        setDailySuggestion(data);
      }
    } catch (error) {
      _logger.error('Failed to load daily suggestion:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const handleCheckIn = async () => {
    const today = new Date().toDateString();
    localStorage.setItem('lastCheckIn', today);
    setCheckedIn(true);
    setShowCheckIn(false);
    
    // Update streak
    setStreak(prev => prev + 1);

    // Track event
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'daily_check_in',
        properties: { streak },
      }),
    }).catch(() => {});
  };

  if (compact) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <span className="font-semibold">{streak} day streak</span>
        </div>
        {!checkedIn && (
          <Button size="sm" onClick={handleCheckIn}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Check In
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Streak Display */}
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/10 border-orange-200 dark:border-orange-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Flame className="w-6 h-6 text-orange-500" />
                </motion.div>
                <h3 className="text-lg font-bold">Your Streak</h3>
              </div>
              <div className="text-3xl font-bold text-orange-600">{streak}</div>
              <div className="text-sm text-muted-foreground">days in a row!</div>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="mb-2">
                Keep it going!
              </Badge>
              <div className="text-xs text-muted-foreground">
                {checkedIn ? 'Checked in today ✓' : 'Check in to continue'}
              </div>
            </div>
          </div>
          {!checkedIn && (
            <Button onClick={handleCheckIn} className="w-full mt-4" size="sm">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Check In Today
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Daily Suggestion */}
      {dailySuggestion && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Today's Suggestion</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-1">{dailySuggestion.title || 'Your Daily Recipe'}</h4>
                <p className="text-sm text-muted-foreground">
                  {dailySuggestion.description || 'A personalized recipe just for you'}
                </p>
              </div>
              <Button asChild className="w-full" size="sm">
                <Link href={`/recipes/${dailySuggestion.id || 'daily'}`}>
                  View Recipe
                  <Sparkles className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Check-in Prompt Modal */}
      <AnimatePresence>
        {showCheckIn && !checkedIn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCheckIn(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="max-w-md w-full border-2 border-primary/20">
                <CardHeader className="text-center">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                    className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center"
                  >
                    <Gift className="w-8 h-8 text-white" />
                  </motion.div>
                  <CardTitle>Keep Your Streak Going!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-center text-muted-foreground">
                    You're on a {streak}-day streak! Check in to continue and earn rewards.
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={handleCheckIn} className="flex-1">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Check In
                    </Button>
                    <Button variant="outline" onClick={() => setShowCheckIn(false)}>
                      Later
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
