'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import FAB from '@/components/layout/FAB';
import SplashScreen from '@/components/layout/SplashScreen';
import { FabProvider } from '@/contexts/FabContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { useAuth } from '@/contexts/AuthContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <>
      <SplashScreen />
      <FabProvider>
        <NotificationsProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-56 min-h-screen overflow-x-hidden">
              {children}
            </main>
            <FAB />
          </div>
        </NotificationsProvider>
      </FabProvider>
    </>
  );
}
