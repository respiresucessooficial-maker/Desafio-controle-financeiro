'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel, User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { USER_ACCESS_STATUS } from '@/lib/access-status';
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrlState] = useState<string | null>(null);
  const [plan, setPlan]               = useState<PlanName>('free');
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const statusChannelRef = useRef<RealtimeChannel | null>(null);

  const isPro = (plan === 'basic' || plan === 'premium') &&
    (planExpiresAt === null || new Date(planExpiresAt) > new Date());

  async function loadUser(u: User) {
    const storedAvatar = window.localStorage.getItem(avatarStorageKey(u.id));
    setAvatarUrlState(storedAvatar ?? null);
    const { data, error } = await supabase
      .from('users')
      .select('plan, plan_expires_at, status')
      .eq('auth_user_id', u.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data || data.status === USER_ACCESS_STATUS.inactive) {
      await supabase.auth.signOut();
      return;
    }

    const userPlan: UserPlan = {
      plan: (data?.plan as PlanName) ?? 'free',
      expiresAt: data?.plan_expires_at ?? null,
    };

    setPlan(userPlan.plan);
    setPlanExpiresAt(userPlan.expiresAt);
  }

  async function ensureUserIsActive(authUserId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('status')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data || data.status === USER_ACCESS_STATUS.inactive) {
      await supabase.auth.signOut();
    }
  }

  function clearUserState() {
    setAvatarUrlState(null);
    setPlan('free');
    setPlanExpiresAt(null);
  }

  const clearStatusSubscription = useCallback(() => {
    if (!statusChannelRef.current) return;
    void supabase.removeChannel(statusChannelRef.current);
    statusChannelRef.current = null;
  }, []);

  const subscribeToUserStatus = useCallback((authUserId: string) => {
    clearStatusSubscription();

    const channel = supabase
      .channel(`user-status:${authUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `auth_user_id=eq.${authUserId}`,
        },
        async (payload) => {
          const previousStatus = Number(payload.old?.status ?? 0);
          const nextStatus = Number(payload.new?.status ?? 0);

          if (
            previousStatus === USER_ACCESS_STATUS.active &&
            nextStatus === USER_ACCESS_STATUS.inactive
          ) {
            await supabase.auth.signOut();
          }
        },
      )
      .subscribe();

    statusChannelRef.current = channel;
  }, [clearStatusSubscription]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUser(session.user).catch(() => {
          void supabase.auth.signOut();
        });
        subscribeToUserStatus(session.user.id);
      } else {
        clearUserState();
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUser(session.user).catch(() => {
          void supabase.auth.signOut();
        });
        subscribeToUserStatus(session.user.id);
      } else {
        clearStatusSubscription();
        clearUserState();
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      clearStatusSubscription();
    };
  }, [clearStatusSubscription, subscribeToUserStatus]);

  useEffect(() => {
    if (!user) return;

    const intervalId = window.setInterval(() => {
      ensureUserIsActive(user.id).catch(() => {
        void supabase.auth.signOut();
      });
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, [user]);

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
