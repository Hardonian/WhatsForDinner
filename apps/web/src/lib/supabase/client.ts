import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key || url.includes('placeholder') || key.includes('placeholder')) {
  throw new Error('Supabase public URL and key are not configured');
}

export const supabase = createClient(
  url,
  key,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);
