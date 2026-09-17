/**
 * Decision Games Component
 * Interactive games to help users decide what to cook with live server integrations
 */

'use client';

import { motion } from 'framer-motion';
import { Shuffle, Heart, Sparkles, Zap, Flame, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface Game {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  href: string;
  badge: string;
  xpReward: number;
}

const games: Game[] = [
  {
    id: 'spin-wheel',
    name: 'Spin the Wheel',
    description: 'Let chance decide your dinner with animated category wheel',
    icon: <Shuffle className="w-8 h-8" />,
    color: 'from-purple-500 to-pink-500',
    href: '/play/spin-wheel',
    badge: 'Popular',
    xpReward: 25,
  },
  {
    id: 'dinner-duel',
    name: 'Dinner Duel',
    description: 'Head-to-head bracket tournament to crown your meal champion',
    icon: <Heart className="w-8 h-8" />,
    color: 'from-rose-500 to-red-600',
    href: '/play/dinner-duel',
    badge: 'Bracket Mode',
    xpReward: 35,
  },
  {
    id: 'mystery-ingredient',
    name: 'Mystery Ingredient',
    description: 'Crack open a secret pantry treasure & unlock a chef-crafted recipe',
    icon: <Sparkles className="w-8 h-8" />,
    color: 'from-blue-500 to-cyan-500',
    href: '/play/mystery-ingredient',
    badge: 'Surprise Box',
    xpReward: 30,
  },
  {
    id: 'quick-pick',
    name: 'Quick Pick',
    description: 'Answer 3 fast questions for an instant dinner match in 15 seconds',
    icon: <Zap className="w-8 h-8" />,
    color: 'from-amber-500 to-orange-500',
    href: '/play/quick-pick',
    badge: '15-Sec Fast',
    xpReward: 20,
  },
  {
    id: 'swipe',
    name: 'Dinner Swipe',
    description: 'Tinder for dinner! Swipe right on dishes you crave, pass on the rest',
    icon: <Flame className="w-8 h-8" />,
    color: 'from-orange-500 to-rose-500',
    href: '/play/swipe',
    badge: 'Swipe Cards',
    xpReward: 25,
  },
  {
    id: 'session',
    name: 'Group Decision Room',
    description: 'Live multiplayer room! Invite family/friends with a code to vote together',
    icon: <Users className="w-8 h-8" />,
    color: 'from-emerald-500 to-teal-600',
    href: '/play/session',
    badge: 'Live Multiplayer',
    xpReward: 40,
  },
];

export function DecisionGames() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Interactive Decision Games 🎮</h2>
          <p className="text-muted-foreground text-sm">
            End the &quot;What do you want to eat?&quot; debate with fun, live interactive games.
          </p>
        </div>
        <Badge variant="outline" className="w-fit bg-primary/5 text-primary border-primary/20 py-1 px-3">
          Daily Bonus Active ✨ Earn +XP
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="cursor-pointer hover:border-primary transition-all border-2 h-full flex flex-col justify-between hover:shadow-lg"
              onClick={() => router.push(game.href)}
            >
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center text-white shadow-md`}>
                      {game.icon}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="text-xs font-semibold">
                        {game.badge}
                      </Badge>
                      <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs">
                        +{game.xpReward} XP
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{game.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {game.description}
                    </p>
                  </div>
                </div>
                <div className="pt-4 mt-2 border-t">
                  <Button size="sm" variant="default" className="w-full font-medium">
                    Play {game.name}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Live Group Session Callout */}
      <Card className="bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-cyan-500/10 border-2 border-emerald-500/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-lg">Deciding with a Partner or Family?</CardTitle>
            </div>
            <Badge className="bg-emerald-600 text-white animate-pulse">Live Sync</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Host a live room or enter a 4-letter room code to swipe together in real-time. The server computes the consensus pick in under 60 seconds!
          </p>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => router.push('/play/session')}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            Host a Live Decision Room
          </Button>
          <Button 
            onClick={() => router.push('/play/swipe')}
            variant="outline"
            className="flex-1"
          >
            Solo Quick Swipe
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
