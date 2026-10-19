import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  let cookieStore: any;
  try {
    cookieStore = await cookies();
  } catch {
    // Fallback if called outside of request context
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
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
