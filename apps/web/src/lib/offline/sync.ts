import { createClient } from "@supabase/supabase-js";
import { getLocal, setLocal } from "./db";
export async function syncUp(userId:string, table:string, rows: unknown[]){
  if(!rows?.length) return { synced:0 };
  const supa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  );
  // Optimize: Batch upsert instead of individual operations
  const { error } = await supa.from(table).upsert(rows.map(r=>({ user_id:userId, ...((r as Record<string, any>) || {}) })));
  if(error) throw error; return { synced: rows.length };
}
export async function syncDown(userId:string, table:string){
  const supa = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  );
  const { data } = await supa.from(table).select("*").eq("user_id",userId).order("updated_at",{ascending:false}).limit(500);
  await setLocal(`${table}:cache`, data||[]);
  return data||[];
}
