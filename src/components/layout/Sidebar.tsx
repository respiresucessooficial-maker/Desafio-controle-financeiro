'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  LayoutGrid,
  PieChart,
  Wallet,
  Settings,
  LogOut,
  ArrowLeftRight,
  Target,
  Bell,
  CalendarDays,
  User,
  Tag,
} from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: Wallet, label: 'Contas & Cartões', href: '/cards' },
  { icon: ArrowLeftRight, label: 'Extrato', href: '/transactions' },
  { icon: Target, label: 'Orcamento', href: '/budget' },
  { icon: LayoutGrid, label: 'Metas', href: '/goals' },
  { icon: CalendarDays, label: 'Calendario', href: '/calendar' },
  { icon: Tag, label: 'Categorias', href: '/categories' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { count } = useNotifications();
  const { isDark } = useTheme();
  const { user, avatarUrl, signOut } = useAuth();
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const logoSrc = isDark ? '/Logo-loading-branca.png' : '/Logo-loading-preta.png';
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split('@')[0] ??
    'Usuario';

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-full w-56 flex-col border-r border-slate-100 bg-white dark:border-white/8 dark:bg-card">
      <div className="flex justify-center border-b border-slate-100 px-4 pb-4 pt-3 dark:border-white/6">
        <Link href="/dashboard" className="flex w-full items-center justify-center">
          <Image
            src={logoSrc}
            alt="Logo"
            width={236}
            height={60}
            priority
            className="h-16 w-auto object-contain"
          />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">
          Menu
        </p>
        {navItems.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href;
          return (
            <Link key={href} href={href}>
              <div
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                  isActive
                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeBar"
                    className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-amber-500"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={17} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />
                <span className={`text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>{label}</span>
              </div>
            </Link>
          );
        })}

        <div className="mt-1 border-t border-slate-100 pt-3 dark:border-white/6">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">
            Sistema
          </p>

          <Link href="/notifications">
            <div
              className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                pathname === '/notifications'
                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100'
              }`}
            >
              {pathname === '/notifications' && (
                <motion.div
                  layoutId="activeBar"
                  className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-amber-500"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <div className="relative flex-shrink-0">
                <Bell size={17} strokeWidth={pathname === '/notifications' ? 2.5 : 2} />
                <AnimatePresence>
                  {count > 0 && (
                    <motion.span
                      key={count}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white"
                    >
                      {count > 9 ? '9+' : count}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <span className={`text-sm font-medium ${pathname === '/notifications' ? 'font-semibold' : ''}`}>
                Notificacoes
              </span>
              {count > 0 && (
                <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                  {count}
                </span>
              )}
            </div>
          </Link>

          <Link href="/settings">
            <div
              className={`relative mt-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                pathname === '/settings'
                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100'
              }`}
            >
              {pathname === '/settings' && (
                <motion.div
                  layoutId="activeBar"
                  className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-amber-500"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Settings size={17} strokeWidth={pathname === '/settings' ? 2.5 : 2} className="flex-shrink-0" />
              <span className={`text-sm font-medium ${pathname === '/settings' ? 'font-semibold' : ''}`}>
                Configuracoes
              </span>
            </div>
          </Link>
        </div>
      </nav>

      <div className="border-t border-slate-100 px-3 py-4 dark:border-white/6">
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-amber-500 text-xs font-bold text-white">
              {avatarUrl && avatarUrl !== failedAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                  onError={() => setFailedAvatarUrl(avatarUrl)}
                />
              ) : (
                <User size={16} className="text-white/95" strokeWidth={2.2} />
              )}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{displayName}</p>
              <p className="truncate text-[10px] text-slate-400">{user?.email}</p>
            </div>
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-lg dark:border-white/8 dark:bg-card"
              >
                <button
                  onClick={() => { setProfileOpen(false); signOut(); }}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <LogOut size={15} />
                  Sair da conta
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
}
