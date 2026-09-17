import { createClient } from "@supabase/supabase-js";

export async function computeSignalsForUser(userId: string, window: "1d"|"7d"|"30d" = "7d") {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  );

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", userId)
    .gte("ts", new Date(Date.now() - windowMs(window)).toISOString());

  const signals: { k: string; v: number; meta?: unknown }[] = [];
  if (!events || !events.length) return signals;

  const clicks = events.filter(e => e.type === "click");
  const errors = events.filter(e => e.type === "error");
  const rageClicks = countRageClicks(clicks);
  const checkoutDrops = events.filter(e => e.type === "page_view" && e.path?.includes("checkout")).length > 0
    && !events.find(e => e.type === "purchase") ? 1 : 0;

  signals.push({ k: "rage_clicks", v: rageClicks });
  signals.push({ k: "error_count", v: errors.length });
  signals.push({ k: "checkout_drop", v: checkoutDrops });

  // Persist signals to database
  if (signals.length > 0) {
    const rows = signals.map(s => ({ 
      user_id: userId, 
      window, 
      k: s.k, 
      v: s.v, 
      meta: s.meta 
    }));
    try {
      await supabase.from("signals").insert(rows);
    } catch {
      // Silently fail if insert fails (e.g., duplicate key)
    }
  }

  return signals;
}

const windowMs = (w: "1d"|"7d"|"30d") => ({ "1d": 86400000, "7d": 604800000, "30d": 2592000000 }[w]);

function countRageClicks(clicks: any[]) {
  // naive heuristic: ≥4 clicks on same path within 2s
  const byPath: Record<string, number[]> = {};
  clicks.forEach(c => {
    const t = new Date(c?.ts || Date.now()).getTime();
    const key = c?.path || "unknown";
    byPath[key] ??= [];
    byPath[key].push(t);
  });
  let rage = 0;
  for (const arr of Object.values(byPath)) {
    arr.sort((a,b)=>a-b);
    for (let i=3;i<arr.length;i++){
      if (arr[i] - arr[i-3] <= 2000) { rage++; }
    }
  }
  return rage;
}
