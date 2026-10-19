import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('placeholder') || key.includes('placeholder')) {
    throw new Error('Supabase public URL and key are not configured');
  }

  let cookieStore: any;
  try {
    cookieStore = await cookies();
  } catch {
    // Fallback if called outside of request context
  }

  return createServerClient(
    url,
    key,
    {
      cookies: {
        get(name: string) {
          return cookieStore?.get?.(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore?.set?.({ name, value, ...options });
          } catch (error) {
            // Ignored if called from a Server Component
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore?.set?.({ name, value: '', ...options });
          } catch (error) {
            // Ignored if called from a Server Component
          }
        },
      },
    }
  );
}
