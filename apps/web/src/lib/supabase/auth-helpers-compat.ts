import { createBrowserClient } from '@supabase/ssr';
import { supabase } from './client';

export function createClientComponentClient<T = any>(options?: any) {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      options
    );
  }
  return supabase as any;
}

export function createRouteHandlerClient<T = any>(context?: { cookies?: any }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  if (context?.cookies) {
    const cookieFn = context.cookies;
    let cookieStore: any = null;
    try {
      cookieStore = typeof cookieFn === 'function' ? cookieFn() : cookieFn;
    } catch {
      // ignore
    }

    return createServerClient(url, key, {
      cookies: {
        get(name: string) {
          if (cookieStore && typeof cookieStore.get === 'function') {
            return cookieStore.get(name)?.value;
          }
          return undefined;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore?.set?.({ name, value, ...options });
          } catch {
            // ignore
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore?.set?.({ name, value: '', ...options });
          } catch {
            // ignore
          }
        },
      },
    }) as any;
  }

  return supabase as any;
}

export function createServerComponentClient<T = any>(context?: { cookies?: any }) {
  return createRouteHandlerClient<T>(context);
}

export { createBrowserClient, createServerClient } from '@supabase/ssr';
