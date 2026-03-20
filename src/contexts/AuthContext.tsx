'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  avatarUrl: string | null;
  setAvatarUrl: (value: string | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null, session: null, loading: true,
  avatarUrl: null,
  setAvatarUrl: () => {},
  signOut: async () => {},
});

function avatarStorageKey(userId: string) {
  return `profile-avatar:${userId}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrlState] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const storedAvatar = window.localStorage.getItem(avatarStorageKey(session.user.id));
        setAvatarUrlState(storedAvatar ?? null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const storedAvatar = window.localStorage.getItem(avatarStorageKey(session.user.id));
        setAvatarUrlState(storedAvatar ?? null);
      } else {
        setAvatarUrlState(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const setAvatarUrl = (value: string | null) => {
    if (!user) return;
    const key = avatarStorageKey(user.id);
    if (value) {
      window.localStorage.setItem(key, value);
    } else {
      window.localStorage.removeItem(key);
    }
    setAvatarUrlState(value);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, avatarUrl, setAvatarUrl, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
