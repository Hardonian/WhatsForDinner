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

export function createRouteHandlerClient<T = any>(_context?: any) {
  return supabase as any;
}

export function createServerComponentClient<T = any>(_context?: any) {
  return supabase as any;
}

export { createBrowserClient, createServerClient } from '@supabase/ssr';
