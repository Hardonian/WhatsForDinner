'use client';

export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import { GamificationProvider, useGamify } from "@/components/gamification/GamificationProvider";
import ProgressRing from "@/components/gamification/ProgressRing";
import StreakFlame from "@/components/gamification/StreakFlame";
import QuestCard from "@/components/gamification/QuestCard";
import AvatarStack from "@/components/social/AvatarStack";
import ShareButton from "@/components/social/ShareButton";
import WeeklyChallenges from "@/components/gamification/WeeklyChallenges";
import Leaderboard from "@/components/gamification/Leaderboard";
import NotificationsCenter from "@/components/gamification/NotificationsCenter";
import ReferralSection from "@/components/gamification/ReferralSection";
import ProgressChart from "@/components/gamification/ProgressChart";
import BadgeCollection from "@/components/gamification/BadgeCollection";
import { AIPersonality } from "@/components/AIPersonality";
import { CTAOptimizer } from "@/components/CTAOptimizer";
import dynamic from "next/dynamic";

const LiveVisitors = dynamic(()=>import("@/components/integrations/LiveVisitors").then(m=>m.default), { ssr:false });

function HubInner(){
  const { level, xp, dailyGoal, streak } = useGamify();
  const pct = Math.min(1, (xp % 100)/dailyGoal);
  const currentXp = xp % 100;
  const [peers, setPeers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "challenges" | "leaderboard" | "badges" | "referrals">("overview");
  
  useEffect(()=>{ setPeers([
    "https://i.pravatar.cc/64?img=1","https://i.pravatar.cc/64?img=2","https://i.pravatar.cc/64?img=3",
    "https://i.pravatar.cc/64?img=4","https://i.pravatar.cc/64?img=5","https://i.pravatar.cc/64?img=6"
  ]); }, []);
  
  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Decision Games 🎮</h1>
          <p className="text-muted-foreground">Make dinner decisions fun and easy</p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationsCenter />
          <LiveVisitors />
        </div>
      </div>

      {/* AI Personality */}
      <AIPersonality context="suggestion" />

      {/* Quick CTA */}
      <div className="flex gap-2">
        <CTAOptimizer variant="primary" context="dashboard" size="md" />
        <CTAOptimizer variant="secondary" context="dashboard" size="md" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {(["overview", "challenges", "leaderboard", "badges", "referrals"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap ${
              activeTab === tab ? "bg-primary text-primary-fg" : "bg-muted"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          {/* Decision Games - Prominent */}
          <DecisionGames />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border p-4 flex flex-col items-center gap-2">
              <ProgressRing value={pct}/>
              <div className="text-sm">Level {level} · {currentXp}/{dailyGoal} XP</div>
            </div>
            <div className="rounded-2xl border p-4 grid place-items-center">
              <StreakFlame days={streak}/>
              <div className="text-sm mt-2">{streak ? `${streak}-day streak` : "Start your streak"}</div>
            </div>
            <div className="rounded-2xl border p-4">
              <div className="text-sm font-semibold mb-2">Peers active now</div>
              <AvatarStack urls={peers}/>
            </div>
          </div>

          <ProgressChart />

          <div className="space-y-3">
            <div className="text-sm font-semibold">Daily Quests</div>
            <QuestCard title="Play a decision game" xp={25}/>
            <QuestCard title="Complete one journal entry" xp={20}/>
            <QuestCard title="Share a tip in community" xp={15}/>
            <QuestCard title="Invite a friend" xp={25}/>
          </div>

          <div className="flex gap-2 flex-wrap">
            <a className="h-10 px-4 rounded-xl bg-secondary grid place-items-center" href="/journal">Open Journal</a>
            <a className="h-10 px-4 rounded-xl bg-secondary grid place-items-center" href="/community">Community</a>
            <a className="h-10 px-4 rounded-xl bg-secondary grid place-items-center" href="/profile">Profile</a>
            <ShareButton />
          </div>
        </>
      )}

      {activeTab === "challenges" && <WeeklyChallenges />}
      {activeTab === "leaderboard" && <Leaderboard />}
      {activeTab === "badges" && <BadgeCollection />}
      {activeTab === "referrals" && <ReferralSection />}
    </div>
  );
}

export default function PlayPage(){
  return (<GamificationProvider><HubInner/></GamificationProvider>);
}