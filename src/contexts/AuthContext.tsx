'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { PlanName, UserPlan } from '@/types';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  avatarUrl: string | null;
  setAvatarUrl: (value: string | null) => void;
  signOut: () => Promise<void>;
  plan: PlanName;
  planExpiresAt: string | null;
  isPro: boolean; // basic ou premium e não expirado
}

const AuthContext = createContext<AuthContextValue>({
  user: null, session: null, loading: true,
  avatarUrl: null,
  setAvatarUrl: () => {},
  signOut: async () => {},
  plan: 'free',
  planExpiresAt: null,
  isPro: false,
});

function avatarStorageKey(userId: string) {
  return `profile-avatar:${userId}`;
}

async function fetchUserPlan(authUserId: string): Promise<UserPlan> {
  const { data } = await supabase
    .from('users')
    .select('plan, plan_expires_at')
    .eq('auth_user_id', authUserId)
    .maybeSingle();
  return {
    plan: (data?.plan as PlanName) ?? 'free',
    expiresAt: data?.plan_expires_at ?? null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrlState] = useState<string | null>(null);
  const [plan, setPlan]               = useState<PlanName>('free');
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);

  const isPro = (plan === 'basic' || plan === 'premium') &&
    (planExpiresAt === null || new Date(planExpiresAt) > new Date());

  async function loadUser(u: User) {
    const storedAvatar = window.localStorage.getItem(avatarStorageKey(u.id));
    setAvatarUrlState(storedAvatar ?? null);
    const userPlan = await fetchUserPlan(u.id);
    setPlan(userPlan.plan);
    setPlanExpiresAt(userPlan.expiresAt);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadUser(session.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUser(session.user);
      } else {
        setAvatarUrlState(null);
        setPlan('free');
        setPlanExpiresAt(null);
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
    <AuthContext.Provider value={{ user, session, loading, avatarUrl, setAvatarUrl, signOut, plan, planExpiresAt, isPro }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
