'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Copy, Check, Sparkles, ChefHat, Trophy, ArrowRight, Share2, Clock, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Celebration } from '@/components/AdvancedAnimations';
import { awardXp } from '@/components/gamification/GamificationProvider';
import { useRouter, useSearchParams } from 'next/navigation';

interface Participant {
  id: string;
  name: string;
  avatar: string;
  hasVoted: boolean;
}

interface CandidateDish {
  id: string;
  title: string;
  cuisine: string;
  emoji: string;
  votes: number;
  cookTime: string;
}

interface RoomData {
  code: string;
  hostId: string;
  status: 'lobby' | 'voting' | 'completed';
  participants: Participant[];
  dishes: CandidateDish[];
  winner: CandidateDish | null;
}

function SessionInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomParam = searchParams.get('room');

  const [userName, setUserName] = useState('Chef');
  const [roomCodeInput, setRoomCodeInput] = useState(roomParam || '');
  const [activeRoom, setActiveRoom] = useState<RoomData | null>(null);
  const [myParticipantId, setMyParticipantId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [votedDishId, setVotedDishId] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Poll room updates if inside an active room
  useEffect(() => {
    if (!activeRoom?.code || activeRoom.status === 'completed') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/games/session?code=${activeRoom.code}`);
        if (res.ok) {
          const data = await res.json();
          if (data.room) {
            setActiveRoom(data.room);
            if (data.room.winner && !activeRoom.winner) {
              setShowCelebration(true);
              awardXp(40);
            }
          }
        }
      } catch {}
    }, 3000);

    return () => clearInterval(interval);
  }, [activeRoom?.code, activeRoom?.status, activeRoom?.winner]);

  // If query param 'room' is provided, auto-fetch or prepare room
  useEffect(() => {
    if (roomParam && !activeRoom) {
      setRoomCodeInput(roomParam.toUpperCase());
    }
  }, [roomParam, activeRoom]);

  const handleCreateRoom = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/games/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostName: userName, hostAvatar: '👑' }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveRoom(data.room);
        setMyParticipantId(data.hostId);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCodeInput.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/games/session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: roomCodeInput.toUpperCase().trim(),
          name: userName,
          avatar: '🥑',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveRoom(data.room);
        setMyParticipantId(data.participantId);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleVote = async (dishId: string) => {
    if (votedDishId || !activeRoom) return;
    setVotedDishId(dishId);

    try {
      const res = await fetch('/api/games/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: activeRoom.code,
          participantId: myParticipantId,
          dishId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveRoom(data.room);
        if (data.isResolved) {
          setShowCelebration(true);
          awardXp(40);
        }
      }
    } catch {}
  };

  const copyRoomLink = () => {
    if (!activeRoom) return;
    const url = `${window.location.origin}/play/session?room=${activeRoom.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen p-4 pb-24 md:pb-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
          Live Decision Game #6
        </Badge>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 bg-clip-text text-transparent">
          Group Decision Room 👥
        </h1>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          End the group dinner debate! Create a live room or join with a 4-character code. Vote together and let the server compute consensus.
        </p>
      </div>

      {/* Lobby Entry Card if not in a room */}
      {!activeRoom && (
        <Card className="border-2 border-primary/20 shadow-xl max-w-md mx-auto">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
              <Users className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-bold">Join or Host Session</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Your Nickname</label>
              <Input
                value={userName}
                onChange={e => setUserName(e.target.value)}
                placeholder="e.g. Alex"
                className="h-11"
              />
            </div>

            <div className="pt-2 space-y-3">
              <Button
                onClick={handleCreateRoom}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11"
              >
                <ChefHat className="w-4 h-4 mr-2" />
                Host a New Room
              </Button>

              <div className="relative text-center my-2">
                <span className="bg-card px-2 text-xs text-muted-foreground relative z-10">or enter code</span>
                <div className="absolute inset-0 top-1/2 border-t" />
              </div>

              <div className="flex gap-2">
                <Input
                  value={roomCodeInput}
                  onChange={e => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder="Room Code (e.g. DINE21)"
                  className="uppercase tracking-widest font-mono font-bold text-center h-11"
                  maxLength={6}
                />
                <Button
                  onClick={handleJoinRoom}
                  disabled={loading || !roomCodeInput.trim()}
                  variant="outline"
                  className="h-11 px-6 font-semibold"
                >
                  Join
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Room Session Arena */}
      {activeRoom && (
        <div className="space-y-6">
          {/* Room Header & Invite Banner */}
          <Card className="border-2 border-emerald-500/30 bg-emerald-500/5 shadow-md">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-mono font-extrabold px-3 py-1.5 rounded-xl bg-background border-2 border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                  {activeRoom.code}
                </div>
                <div>
                  <h3 className="text-sm font-bold">Decision Room Active</h3>
                  <p className="text-xs text-muted-foreground">Share code with everyone deciding dinner</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyRoomLink}
                  className="text-xs flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Link Copied!' : 'Copy Link'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Connected Participants Avatars */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                In Room ({activeRoom.participants?.length || 0}):
              </span>
              <div className="flex -space-x-2">
                {activeRoom.participants?.map(p => (
                  <div
                    key={p.id}
                    title={p.name}
                    className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-sm shadow-sm"
                  >
                    {p.avatar || '👤'}
                  </div>
                ))}
              </div>
            </div>

            <Badge variant="secondary" className="text-xs">
              {activeRoom.winner ? '🎉 Consensus Reached' : '⚡ Voting in Progress'}
            </Badge>
          </div>

          {/* Voting Candidate Dishes */}
          {!activeRoom.winner && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold">Vote on Tonight&apos;s Options:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeRoom.dishes?.map(dish => {
                  const hasMyVote = votedDishId === dish.id;
                  return (
                    <motion.div
                      key={dish.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Card
                        className={`p-4 cursor-pointer transition-all border-2 flex items-center justify-between ${
                          hasMyVote
                            ? 'border-emerald-500 bg-emerald-500/10 shadow-md'
                            : 'hover:border-primary/50'
                        }`}
                        onClick={() => handleVote(dish.id)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{dish.emoji}</span>
                          <div>
                            <h4 className="font-bold text-sm">{dish.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span>{dish.cuisine}</span>
                              <span>·</span>
                              <span>{dish.cookTime}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-bold text-xs">
                            {dish.votes} {dish.votes === 1 ? 'vote' : 'votes'}
                          </Badge>
                          <Button
                            size="sm"
                            variant={hasMyVote ? 'default' : 'outline'}
                            className={hasMyVote ? 'bg-emerald-600 text-white' : ''}
                          >
                            {hasMyVote ? 'Voted ✓' : 'Vote'}
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Consensus Winner Display */}
          <AnimatePresence>
            {activeRoom.winner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="border-4 border-emerald-500/40 shadow-2xl text-center overflow-hidden bg-gradient-to-b from-emerald-500/15 via-card to-background p-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
                    <Trophy className="w-10 h-10 animate-bounce" />
                  </div>
                  <Badge className="bg-emerald-600 text-white font-bold mx-auto px-3 py-1 flex items-center gap-1 w-fit">
                    <Award className="w-4 h-4" /> Consensus Reached! +40 XP
                  </Badge>
                  <div className="text-7xl pt-1">{activeRoom.winner.emoji}</div>
                  <CardTitle className="text-3xl font-extrabold">{activeRoom.winner.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Winning dinner choice voted by the group with {activeRoom.winner.votes} votes!
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => router.push('/recipes/session-winner')}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg"
                      size="lg"
                    >
                      Cook Winner Tonight
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setActiveRoom(null);
                        setVotedDishId(null);
                      }}
                      size="lg"
                      className="flex-1"
                    >
                      Start New Group Room
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {showCelebration && (
        <Celebration type="achievement" onComplete={() => setShowCelebration(false)} />
      )}
    </div>
  );
}

export default function GroupDecisionSessionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-8 text-center text-muted-foreground">Loading decision room...</div>}>
      <SessionInner />
    </Suspense>
  );
}
