import { createClient } from "@supabase/supabase-js";

type Reco = {
  title: string; 
  body: string; 
  kind: "workflow"|"automation"|"tip"|"support";
  score: number; 
  rationale: any; 
  cta?: { label: string; href?: string; action?: string };
};

export async function makeRecommendations(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  );

  const { data: signals } = await supabase
    .from("signals")
    .select("*")
    .eq("user_id", userId)
    .order("computed_at", { ascending: false })
    .limit(50);

  const byK: Record<string, number> = {};
  (signals||[]).forEach(s => { 
    byK[s.k] = Math.max(byK[s.k] || 0, Number(s.v)); 
  });

  const recs: Reco[] = [];
  // Simple rule-based seed (explainable), then optional bandit tuning later
  if ((byK["rage_clicks"] || 0) >= 2) {
    recs.push({
      title: "One-click Fix: Reset stuck UI",
      body: "We noticed rapid clicks on the same element. Try clearing cache for this feature or opening in a lite mode.",
      kind: "support",
      score: 0.72,
      rationale: { signal: "rage_clicks", value: byK["rage_clicks"] },
      cta: { label: "Open Lite Mode", href: "/?lite=1" }
    });
  }
  if ((byK["checkout_drop"] || 0) >= 1) {
    recs.push({
      title: "Recover your checkout",
      body: "It looks like you reached checkout but didn't complete. We can save your cart and suggest a faster path.",
      kind: "workflow",
      score: 0.81,
      rationale: { signal: "checkout_drop", value: byK["checkout_drop"] },
      cta: { label: "Resume Checkout", href: "/checkout?resume=1" }
    });
  }
  if ((byK["error_count"] || 0) >= 3) {
    recs.push({
      title: "Stability Mode",
      body: "We detected repeated errors. Enable Stability Mode (retries + low-bandwidth images).",
      kind: "automation",
      score: 0.76,
      rationale: { signal: "error_count", value: byK["error_count"] },
      cta: { label: "Enable Stability", action: "enable:stability" }
    });
  }
  return recs.sort((a,b)=>b.score - a.score);
}

export async function persistRecommendations(userId: string, recs: Reco[]) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  );
  if (!recs.length) return;
  const rows = recs.map(r => ({ user_id: userId, ...r }));
  await supabase.from("recommendations").insert(rows);
}
