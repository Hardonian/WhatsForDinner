import { createClient } from "@supabase/supabase-js";
type Reco = { title:string; body?:string; kind:'meal'|'video'|'tip'; score:number; cta?:{label:string;href?:string;action?:string}; rationale: unknown };
export async function recoForWhatsForDinner(userId:string): Promise<Reco[]>{
  const supa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  );
  const { data: prefsRow } = await supa.from('meal_prefs').select('*').eq('user_id',userId).maybeSingle();
  const prefs = prefsRow || { cuisines:[], diet:'none', allergies:[], cook_time_minutes:30 };
  const since=new Date(Date.now()-14*24*3600e3).toISOString();
  const { data: ev } = await supa.from('telemetry_events').select('*').eq('user_id',userId).eq('app','whatsfordinner').gte('ts',since);
  const likes=(ev||[]).filter(e=>e.type==='like' && (e.meta?.kind==='recipe')).map(e=>e.meta?.recipe_id);
  const quick =(ev||[]).filter(e=>e.type==='click' && e.meta?.tag==='quick').length>2;
  const baseTags=[...(prefs.cuisines||[])]; if(prefs.diet && prefs.diet!=='none') baseTags.push(prefs.diet);
  const recs: Reco[]=[];
  recs.push({ title:"Your 7-day meal plan", body:`~${prefs.cook_time_minutes} min/meal · ${baseTags.slice(0,3).join(', ')||'favorites'}`, kind:'meal', score:0.9, rationale:{prefs, likesCount:likes.length, quick}, cta:{label:"Generate Plan", href:"/whatsfordinner/plan?days=7"} });
  if(quick) recs.push({ title:"5 x 15-minute dinners", body:"Fast recipes; auto-grocery list.", kind:'meal', score:0.82, rationale:{signal:'quick_mode'}, cta:{label:"Open Fast Pack", href:"/whatsfordinner/collection/fast15"} });
  recs.push({ title:"Tonight's cooking videos", body:"Short step-by-steps from your recent likes.", kind:'video', score:0.76, rationale:{likes:likes.slice(-5)}, cta:{label:"Watch & Cook", href:"/whatsfordinner/videos/for-you"} });
  return recs.sort((a,b)=>b.score-a.score);
}
