'use client';

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
} from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { icon: Home,           label: 'Dashboard',  href: '/dashboard' },
  { icon: Wallet,         label: 'Cartões',    href: '/cards' },
  { icon: ArrowLeftRight, label: 'Extrato',    href: '/transactions' },
  { icon: PieChart,       label: 'Análise',    href: '/analytics' },
  { icon: Target,         label: 'Orçamento',  href: '/budget' },
  { icon: LayoutGrid,     label: 'Metas',      href: '/goals' },
  { icon: CalendarDays,   label: 'Calendário', href: '/calendar' },
];

export default function Sidebar() {
  const pathname  = usePathname();
  const { count } = useNotifications();
  const { isDark } = useTheme();
  const { user, signOut } = useAuth();

  const logoSrc    = isDark ? '/Logo-loading-branca.png' : '/Logo-loading-preta.png';
  const initials   = (user?.user_metadata?.full_name as string | undefined)
    ?.split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?';
  const displayName = (user?.user_metadata?.full_name as string | undefined)
    ?? user?.email?.split('@')[0]
    ?? 'Usuário';

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-white dark:bg-card z-50 flex flex-col border-r border-slate-100 dark:border-white/8">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100 dark:border-white/6">
        <Link href="/dashboard">
          <Image
            src={logoSrc}
            alt="Logo"
            width={160}
            height={36}
            priority
            className="object-contain h-8 w-auto"
          />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest px-3 mb-2">
          Menu
        </p>
        {navItems.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href;
          return (
            <Link key={href} href={href}>
              <div
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-100'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeBar"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-500 rounded-r-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  size={17}
                  strokeWidth={isActive ? 2.5 : 2}
                  className="flex-shrink-0"
                />
                <span className={`text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {label}
                </span>
              </div>
            </Link>
          );
        })}

        {/* Notifications */}
        <div className="mt-1 pt-3 border-t border-slate-100 dark:border-white/6">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest px-3 mb-2">
            Sistema
          </p>
          <Link href="/notifications">
            <div
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                pathname === '/notifications'
                  ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-100'
              }`}
            >
              {pathname === '/notifications' && (
                <motion.div
                  layoutId="activeBar"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-500 rounded-r-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <div className="relative flex-shrink-0">
                <Bell size={17} strokeWidth={pathname === '/notifications' ? 2.5 : 2} />
                <AnimatePresence>
                  {count > 0 && (
                    <motion.span
                      key={count}
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center"
                    >
                      {count > 9 ? '9+' : count}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <span className={`text-sm font-medium ${pathname === '/notifications' ? 'font-semibold' : ''}`}>
                Notificações
              </span>
              {count > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </div>
          </Link>

          <Link href="/settings">
            <div
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all mt-0.5 ${
                pathname === '/settings'
                  ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-100'
              }`}
            >
              {pathname === '/settings' && (
                <motion.div
                  layoutId="activeBar"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-500 rounded-r-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Settings size={17} strokeWidth={pathname === '/settings' ? 2.5 : 2} className="flex-shrink-0" />
              <span className={`text-sm font-medium ${pathname === '/settings' ? 'font-semibold' : ''}`}>
                Configurações
              </span>
            </div>
          </Link>
        </div>
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-slate-100 dark:border-white/6">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{displayName}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            title="Sair"
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}
