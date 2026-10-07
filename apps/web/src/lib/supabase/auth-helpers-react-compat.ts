import { useState, useEffect } from 'react';
import { supabase } from './client';

export function useUser() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);
  return user;
}

export function useSession() {
  const [session, setSession] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data?.session ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s ?? null);
    });
    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);
  return session;
}

export function useSupabaseClient() {
  return supabase;
}
