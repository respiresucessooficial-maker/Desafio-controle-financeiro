'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  AlertTriangle,
  XCircle,
  Info,
  CheckCircle2,
  X,
  Check,
  Target,
  Wallet,
  ArrowLeftRight,
  SlidersHorizontal,
} from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useFabAction } from '@/contexts/FabContext';
import { Alert, AlertType, AlertSeverity } from '@/types';

// ── helpers ──────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'unread' | 'budget' | 'goals' | 'reminders';

const TAB_LABELS: { id: FilterTab; label: string }[] = [
  { id: 'all',       label: 'Todas'     },
  { id: 'unread',    label: 'Não lidas' },
  { id: 'budget',    label: 'Orçamento' },
  { id: 'goals',     label: 'Metas'     },
  { id: 'reminders', label: 'Lembretes' },
];

const TYPE_TO_TAB: Record<AlertType, FilterTab> = {
  'budget-exceeded': 'budget',
  'budget-warning':  'budget',
  'goal-milestone':  'goals',
  'txn-reminder':    'reminders',
};

const SEVERITY_STYLES: Record<AlertSeverity, { bg: string; border: string; icon: React.ElementType; iconClass: string; badge: string; badgeText: string }> = {
  error: {
    bg:        'bg-red-50 dark:bg-red-500/5',
    border:    'border-red-100 dark:border-red-500/20',
    icon:      XCircle,
    iconClass: 'text-red-500',
    badge:     'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400',
    badgeText: 'Crítico',
  },
  warning: {
    bg:        'bg-amber-50 dark:bg-amber-500/5',
    border:    'border-amber-100 dark:border-amber-500/20',
    icon:      AlertTriangle,
    iconClass: 'text-amber-500',
    badge:     'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
    badgeText: 'Atenção',
  },
  info: {
    bg:        'bg-blue-50 dark:bg-blue-500/5',
    border:    'border-blue-100 dark:border-blue-500/20',
    icon:      Info,
    iconClass: 'text-blue-500',
    badge:     'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
    badgeText: 'Info',
  },
};

const TYPE_ICON: Record<AlertType, React.ElementType> = {
  'budget-exceeded': Wallet,
  'budget-warning':  Wallet,
  'goal-milestone':  Target,
  'txn-reminder':    ArrowLeftRight,
};

const TYPE_LABEL: Record<AlertType, string> = {
  'budget-exceeded': 'Orçamento',
  'budget-warning':  'Orçamento',
  'goal-milestone':  'Meta',
  'txn-reminder':    'Lembrete',
};

// ── Notification card ────────────────────────────────────────────────────────
function NotificationCard({
  alert,
  isRead,
  onRead,
  onDismiss,
}: {
  alert: Alert;
  isRead: boolean;
  onRead: () => void;
  onDismiss: () => void;
}) {
  const style   = SEVERITY_STYLES[alert.severity];
  const SevIcon = style.icon;
  const TypeIcon = TYPE_ICON[alert.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.25 }}
      className={`group relative rounded-2xl border p-4 transition-colors ${style.bg} ${style.border} ${!isRead ? 'ring-1 ring-inset ring-current ring-opacity-10' : ''}`}
    >
      {/* Unread dot */}
      {!isRead && (
        <span className="absolute top-4 right-12 w-2 h-2 rounded-full bg-amber-500" />
      )}

      <div className="flex items-start gap-3">
        {/* Severity icon */}
        <div className={`mt-0.5 flex-shrink-0 ${style.iconClass}`}>
          <SevIcon size={18} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className={`text-sm font-bold text-slate-900 dark:text-slate-50 ${!isRead ? '' : 'opacity-70'}`}>
              {alert.title}
            </p>
            {/* Type badge */}
            <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400">
              <TypeIcon size={9} />
              {TYPE_LABEL[alert.type]}
            </span>
            {/* Severity badge */}
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${style.badge}`}>
              {style.badgeText}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {alert.message}
          </p>

          {/* Actions */}
          {!isRead && (
            <button
              onClick={onRead}
              className="mt-2 flex items-center gap-1 text-xs font-semibold text-amber-500 hover:text-amber-600 transition-colors"
            >
              <Check size={11} />
              Marcar como lida
            </button>
          )}
        </div>

        {/* Dismiss */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={onDismiss}
          className="flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
          title="Dispensar"
        >
          <X size={14} />
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { allAlerts, dismissAlert, dismissAll, markAsRead, markAllAsRead, isRead } = useNotifications();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  useFabAction({ label: '', onClick: () => {}, hidden: true });

  const filtered = useMemo<Alert[]>(() => {
    if (activeTab === 'all')      return allAlerts;
    if (activeTab === 'unread')   return allAlerts.filter((a) => !isRead(a.id));
    return allAlerts.filter((a) => TYPE_TO_TAB[a.type] === activeTab);
  }, [allAlerts, activeTab, isRead]);

  const unreadCount = useMemo(() => allAlerts.filter((a) => !isRead(a.id)).length, [allAlerts, isRead]);

  const tabCount = (tab: FilterTab) => {
    if (tab === 'all')    return allAlerts.length;
    if (tab === 'unread') return unreadCount;
    return allAlerts.filter((a) => TYPE_TO_TAB[a.type] === tab).length;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-8"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Central</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            Notificações
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </h1>
        </div>

        {/* Bulk actions */}
        {allAlerts.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors"
              >
                <CheckCircle2 size={13} />
                Marcar todas como lidas
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={dismissAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors"
            >
              <BellOff size={13} />
              Dispensar todas
            </motion.button>
          </div>
        )}
      </div>

      {/* Summary strip */}
      {allAlerts.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total',      value: allAlerts.length,                                              color: 'text-slate-900 dark:text-slate-50'  },
            { label: 'Não lidas',  value: unreadCount,                                                   color: 'text-amber-500'                     },
            { label: 'Críticas',   value: allAlerts.filter((a) => a.severity === 'error').length,        color: 'text-red-500'                       },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white dark:bg-card rounded-2xl p-4 border border-slate-100 dark:border-white/8 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-white/10 rounded-2xl mb-6 w-fit">
        {TAB_LABELS.map(({ id, label }) => {
          const count = tabCount(id);
          return (
            <motion.button
              key={id}
              onClick={() => setActiveTab(id)}
              className="relative px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              animate={{ color: activeTab === id ? '#1e293b' : '#94a3b8' }}
            >
              {activeTab === id && (
                <motion.div
                  layoutId="notifTab"
                  className="absolute inset-0 bg-white dark:bg-white/20 rounded-xl shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 dark:text-slate-200">{label}</span>
              {count > 0 && (
                <span className={`relative z-10 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold ${
                  activeTab === id
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-200 dark:bg-white/20 text-slate-500 dark:text-slate-400'
                }`}>
                  {count}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Filter info bar */}
      {activeTab !== 'all' && filtered.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/8 mb-4"
        >
          <SlidersHorizontal size={13} className="text-slate-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Exibindo <strong className="text-slate-700 dark:text-slate-200">{filtered.length}</strong> notificaç{filtered.length !== 1 ? 'ões' : 'ão'} filtradas
          </span>
          <button
            onClick={() => setActiveTab('all')}
            className="ml-auto text-xs font-semibold text-amber-500 hover:text-amber-600 transition-colors"
          >
            Limpar filtro
          </button>
        </motion.div>
      )}

      {/* Notification list */}
      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false} mode="popLayout">
          {filtered.map((alert) => (
            <NotificationCard
              key={alert.id}
              alert={alert}
              isRead={isRead(alert.id)}
              onRead={() => markAsRead(alert.id)}
              onDismiss={() => dismissAlert(alert.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center mb-4">
            <Bell size={28} className="text-slate-300 dark:text-slate-600" />
          </div>
          <p className="font-semibold text-slate-500 dark:text-slate-400">
            {activeTab === 'unread' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {activeTab === 'unread'
              ? 'Você está em dia com tudo!'
              : activeTab === 'all'
              ? 'Suas finanças estão sob controle'
              : 'Nenhum alerta nessa categoria'}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
