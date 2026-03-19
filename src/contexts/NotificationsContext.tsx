'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Alert } from '@/types';
import { useAppData } from '@/contexts/AppDataContext';

const DISMISSED_KEY = 'finance-dismissed-alerts';
const READ_KEY      = 'finance-read-alerts';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface NotificationsContextValue {
  alerts: Alert[];        // visible on dashboard (not dismissed today)
  allAlerts: Alert[];     // all computed alerts (for the notifications page)
  dismissAlert: (id: string) => void;
  dismissAll: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  isRead: (id: string) => boolean;
  count: number;           // unread + not dismissed
}

const NotificationsContext = createContext<NotificationsContextValue>({
  alerts: [],
  allAlerts: [],
  dismissAlert: () => {},
  dismissAll: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  isRead: () => false,
  count: 0,
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { transactions, budgets, goals } = useAppData();
  const [dismissed, setDismissed] = useState<Record<string, string>>({});
  const [read, setRead]           = useState<Record<string, boolean>>({});
  const [mounted, setMounted]     = useState(false);

  useEffect(() => {
    try {
      const rawD = localStorage.getItem(DISMISSED_KEY);
      if (rawD) setDismissed(JSON.parse(rawD));
      const rawR = localStorage.getItem(READ_KEY);
      if (rawR) setRead(JSON.parse(rawR));
    } catch {}
    setMounted(true);
  }, []);

  const dismissAlert = useCallback((id: string) => {
    const today = new Date().toISOString().slice(0, 10);
    setDismissed((prev) => {
      const next = { ...prev, [id]: today };
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const dismissAll = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    setDismissed((prev) => {
      // will be merged with all current IDs after computed runs — we mark sentinel
      void prev;
      const next: Record<string, string> = { ...prev, __all__: today };
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setRead((prev) => {
      const next = { ...prev, [id]: true };
      localStorage.setItem(READ_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setRead((prev) => {
      // sentinel handled during filtering
      const next = { ...prev, __all__: true };
      localStorage.setItem(READ_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isRead = useCallback((id: string) => !!read[id] || !!read.__all__, [read]);

  const computed = useMemo<Alert[]>(() => {
    const now = new Date();
    const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const result: Alert[] = [];

    const monthExpenses = transactions
      .filter((t) => t.type === 'expense' && t.date.startsWith(thisMonthPrefix))
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] ?? 0) + Math.abs(t.amount);
        return acc;
      }, {});

    budgets.forEach((b) => {
      const spent = monthExpenses[b.category] ?? 0;
      const pct = spent / b.limit;
      if (pct >= 1) {
        result.push({
          id: `budget-exceeded-${b.category}`,
          type: 'budget-exceeded',
          severity: 'error',
          title: `Limite excedido: ${b.category}`,
          message: `Você gastou ${fmt(spent)} de ${fmt(b.limit)} (${Math.round(pct * 100)}% do limite mensal).`,
        });
      } else if (pct >= 0.8) {
        result.push({
          id: `budget-warning-${b.category}`,
          type: 'budget-warning',
          severity: 'warning',
          title: `Atenção: ${b.category}`,
          message: `Você já usou ${Math.round(pct * 100)}% do orçamento de ${b.category}. Restam ${fmt(b.limit - spent)}.`,
        });
      }
    });

    goals.forEach((g) => {
      const pct = g.current / g.target;
      if (pct >= 0.9 && pct < 1) {
        result.push({
          id: `goal-milestone-${g.id}`,
          type: 'goal-milestone',
          severity: 'info',
          title: `Meta quase completa: ${g.name}`,
          message: `Você está a ${fmt(g.target - g.current)} de atingir "${g.name}". Continue assim!`,
        });
      } else if (pct >= 1) {
        result.push({
          id: `goal-done-${g.id}`,
          type: 'goal-milestone',
          severity: 'info',
          title: `Meta atingida: ${g.name}`,
          message: `Parabéns! Você completou a meta "${g.name}". Que tal definir um novo objetivo?`,
        });
      }
    });

    if (transactions.length > 0) {
      const latest = transactions[0]?.date;
      if (latest) {
        const latestDate = new Date(latest + 'T00:00:00');
        const diff = Math.floor((now.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diff >= 3) {
          result.push({
            id: 'txn-reminder',
            type: 'txn-reminder',
            severity: 'info',
            title: 'Lembrete de lançamentos',
            message: `Sua última transação foi há ${diff} dia${diff !== 1 ? 's' : ''}. Não esqueça de registrar seus gastos!`,
          });
        }
      }
    } else {
      result.push({
        id: 'txn-reminder',
        type: 'txn-reminder',
        severity: 'info',
        title: 'Comece a registrar',
        message: 'Você ainda não tem nenhuma transação. Clique no botão + para adicionar.',
      });
    }

    return result;
  }, [transactions, budgets, goals]);

  const today = new Date().toISOString().slice(0, 10);

  const allAlerts = useMemo(() => (mounted ? computed : []), [computed, mounted]);

  const alerts = useMemo(
    () => (mounted ? computed.filter((a) => dismissed[a.id] !== today && dismissed.__all__ !== today) : []),
    [computed, dismissed, mounted, today]
  );

  const count = useMemo(
    () => alerts.filter((a) => !isRead(a.id)).length,
    [alerts, isRead]
  );

  return (
    <NotificationsContext.Provider value={{ alerts, allAlerts, dismissAlert, dismissAll, markAsRead, markAllAsRead, isRead, count }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);
