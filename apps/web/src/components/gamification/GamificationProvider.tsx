"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import flags from "@/config/flags.gamify.json";
type State = {
  flags: typeof flags;
  level: number;
  xp: number;
  dailyGoal: number;
  streak: number;
};
const Ctx = createContext<State | null>(null);
export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const [xp, setXp] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const dailyGoal = 50;
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      setXp(Number(localStorage.getItem("xp")||0));
      setStreak(Number(localStorage.getItem("streak")||0));
    }
  }, []);
  
  useEffect(()=>{ if (typeof window !== "undefined") localStorage.setItem("xp", String(xp)); }, [xp]);
  useEffect(()=>{ if (typeof window !== "undefined") localStorage.setItem("streak", String(streak)); }, [streak]);
  const state = useMemo(()=>({ flags, level: Math.floor(xp/100)+1, xp, dailyGoal, streak }), [xp, streak]);
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}
const defaultGamifyState: State = {
  flags,
  level: 1,
  xp: 0,
  dailyGoal: 50,
  streak: 0,
};

export const useGamify = () => {
  const v = useContext(Ctx);
  return v || defaultGamifyState;
};
export const awardXp = (delta=5) => {
  if (typeof window === "undefined") return;
  const cur = Number(localStorage.getItem("xp")||0);
  localStorage.setItem("xp", String(cur + delta));
};

