'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, ChevronDown, X,
  ShoppingCart, Home, Car, Tv, Heart, BarChart2, Package,
  Music, Zap, Cross, UtensilsCrossed, Briefcase, Dumbbell,
  BookOpen, TrendingUp, TrendingDown, DollarSign,
  CalendarDays, ArrowUpRight, ArrowDownLeft,
  Scissors, Clock, CreditCard,
} from 'lucide-react';
import { useAppData } from '@/contexts/AppDataContext';
import { useFabAction } from '@/contexts/FabContext';
import { Transaction, Bank } from '@/types';

// ── helpers ──────────────────────────────────────────────────────────────────
const iconMap: Record<string, React.ElementType> = {
  ShoppingCart, Home, Car, Tv, Heart, BarChart2, Package, Music,
  Zap, Cross, UtensilsCrossed, Briefcase, Dumbbell, BookOpen,
  TrendingUp, TrendingDown, DollarSign,
};

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtShort = (v: number) =>
  v >= 1000
    ? `R$${(v / 1000).toFixed(1)}k`
    : `R$${v.toFixed(0)}`;

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

type ViewMode = 'month' | 'week' | 'day';

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function startOfWeek(d: Date) {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  r.setHours(0, 0, 0, 0);
  return r;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// ── Day transactions panel ────────────────────────────────────────────────────
function DayPanel({
  date, transactions, banks, onClose,
}: {
  date: Date;
  transactions: Transaction[];
  banks: Bank[];
  onClose: () => void;
}) {
  const day = date.getDate();

  const dayTx = transactions
    .filter((t) => isSameDay(new Date(t.date + 'T00:00:00'), date))
    .sort((a, b) => b.date.localeCompare(a.date));

  const income   = dayTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = dayTx.filter((t) => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);

  const closingCards = banks.filter((b) => b.closingDay === day);
  const dueCards     = banks.filter((b) => b.dueDay === day);
  const hasCardEvents = closingCards.length > 0 || dueCards.length > 0;

  const dayLabel = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  }).format(date);

  return (
    <motion.aside
      key="day-panel"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="fixed right-0 top-0 h-full w-[380px] bg-white dark:bg-card shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Detalhes do dia</span>
          <motion.button
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
          >
            <X size={15} />
          </motion.button>
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 capitalize">{dayLabel}</h2>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="bg-green-50 dark:bg-green-500/10 rounded-2xl p-3">
            <div className="flex items-center gap-1 mb-1">
              <ArrowUpRight size={12} className="text-green-500" />
              <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">Entradas</span>
            </div>
            <p className="text-base font-bold text-green-600 dark:text-green-400">{fmt(income)}</p>
          </div>
          <div className="bg-red-50 dark:bg-red-500/10 rounded-2xl p-3">
            <div className="flex items-center gap-1 mb-1">
              <ArrowDownLeft size={12} className="text-red-500" />
              <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">Saídas</span>
            </div>
            <p className="text-base font-bold text-red-500">{fmt(expenses)}</p>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-5">

        {/* Card events section */}
        {hasCardEvents && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Cartões</p>
            <div className="flex flex-col gap-2">
              {closingCards.map((b) => (
                <motion.div
                  key={`close-${b.id}`}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Scissors size={15} className="text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{b.name}</p>
                    <p className="text-xs text-slate-400">Fechamento da fatura · Agência {b.code}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex-shrink-0">
                    Fecha
                  </span>
                </motion.div>
              ))}

              {dueCards.map((b) => (
                <motion.div
                  key={`due-${b.id}`}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-orange-200 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/10"
                >
                  <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Clock size={15} className="text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{b.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-400">Vencimento da fatura · Agência {b.code}</p>
                    </div>
                    {b.lastInvoiceAmount != null && (
                      <p className="text-xs font-bold text-orange-600 dark:text-orange-400 mt-0.5">
                        {fmt(b.lastInvoiceAmount)}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex-shrink-0">
                    Vence
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction list */}
        {dayTx.length > 0 ? (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Lançamentos</p>
            <div className="flex flex-col gap-2">
              {dayTx.map((tx) => {
                const Icon = iconMap[tx.icon] ?? ShoppingCart;
                const isIncome = tx.type === 'income';
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: tx.color + '18' }}
                    >
                      <Icon size={16} style={{ color: tx.color }} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{tx.label}</p>
                      <p className="text-xs text-slate-400">{tx.category}</p>
                    </div>
                    <p className={`text-sm font-bold flex-shrink-0 ${isIncome ? 'text-green-600' : 'text-slate-700 dark:text-slate-200'}`}>
                      {isIncome ? '+' : '-'}{fmt(Math.abs(tx.amount))}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : !hasCardEvents ? (
          <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
            <CalendarDays size={40} className="mb-3 opacity-30" />
            <p className="font-semibold text-sm">Nenhum lançamento</p>
            <p className="text-xs mt-1">Sem transações neste dia</p>
          </div>
        ) : null}
      </div>
    </motion.aside>
  );
}

// ── Month view ────────────────────────────────────────────────────────────────
function MonthView({
  year, month, transactions, today, selectedDate, onSelectDate, banks, showCardDates,
}: {
  year: number; month: number;
  transactions: Transaction[];
  banks: Bank[];
  showCardDates: boolean;
  today: Date; selectedDate: Date | null;
  onSelectDate: (d: Date) => void;
}) {
  // Build spending map: 'YYYY-MM-DD' → { income, expenses }
  const spendMap = useMemo(() => {
    const map: Record<string, { income: number; expenses: number }> = {};
    transactions.forEach((t) => {
      const key = t.date;
      if (!map[key]) map[key] = { income: 0, expenses: 0 };
      if (t.type === 'income') map[key].income += t.amount;
      else map[key].expenses += Math.abs(t.amount);
    });
    return map;
  }, [transactions]);

  // Max expenses in this month for heat-map scaling
  const maxExpenses = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return Math.max(1, ...Object.entries(spendMap)
      .filter(([k]) => k.startsWith(prefix))
      .map(([, v]) => v.expenses));
  }, [spendMap, year, month]);

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;

          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const data = spendMap[dateKey];
          const expenses = data?.expenses ?? 0;
          const income   = data?.income ?? 0;
          const hasActivity = expenses > 0 || income > 0;
          const intensity = expenses / maxExpenses; // 0–1

          const cellDate = new Date(year, month, day);
          const isToday  = isSameDay(cellDate, today);
          const isSelected = selectedDate && isSameDay(cellDate, selectedDate);
          const isFuture = cellDate > today;

          // Card closing / due days
          const closingCards = showCardDates ? banks.filter((b) => b.closingDay === day) : [];
          const dueCards     = showCardDates ? banks.filter((b) => b.dueDay === day)     : [];
          const hasCardDates = closingCards.length > 0 || dueCards.length > 0;

          // Heat-map bg color based on net balance (income - expenses)
          const net = income - expenses;
          const heatBg = !isFuture && hasActivity
            ? net > 0  ? 'bg-green-50 dark:bg-green-500/10'
            : net < 0  ? intensity > 0.75 ? 'bg-red-100 dark:bg-red-500/15'
                       : intensity > 0.4  ? 'bg-amber-100 dark:bg-amber-500/15'
                       : 'bg-red-50 dark:bg-red-500/10'
            : 'bg-slate-50 dark:bg-white/5'
            : '';

          return (
            <motion.button
              key={dateKey}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectDate(cellDate)}
              className={`relative rounded-2xl p-2 flex flex-col items-center transition-colors ${hasCardDates ? 'min-h-[88px]' : 'min-h-[72px]'} ${heatBg} ${
                isSelected
                  ? 'ring-2 ring-amber-500 bg-amber-50 dark:bg-amber-500/20'
                  : 'hover:bg-slate-100 dark:hover:bg-white/5'
              } ${isFuture ? 'opacity-40' : ''}`}
            >
              {/* Day number */}
              <span className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                isToday
                  ? 'bg-amber-500 text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}>
                {day}
              </span>

              {/* Expense amount */}
              {hasActivity && !isFuture && (
                <div className="flex flex-col items-center gap-0.5 w-full">
                  {expenses > 0 && (
                    <span className="text-[9px] font-bold truncate w-full text-center text-red-500 dark:text-red-400">
                      -{fmtShort(expenses)}
                    </span>
                  )}
                  {income > 0 && (
                    <span className="text-[9px] font-bold text-green-600 dark:text-green-400 truncate w-full text-center">
                      +{fmtShort(income)}
                    </span>
                  )}
                </div>
              )}

              {/* Card closing / due date pills */}
              {hasCardDates && (
                <div className="w-full flex flex-col gap-0.5 mt-1">
                  {closingCards.slice(0, 2).map((b) => (
                    <div
                      key={`close-${b.id}`}
                      className="flex items-center gap-0.5 px-1 py-0.5 rounded-md text-[8px] font-bold truncate bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
                      title={`Fechamento ${b.name}`}
                    >
                      <Scissors size={7} className="flex-shrink-0" />
                      <span className="truncate">{b.brand}</span>
                    </div>
                  ))}
                  {dueCards.slice(0, 2).map((b) => (
                    <div
                      key={`due-${b.id}`}
                      className="flex items-center gap-0.5 px-1 py-0.5 rounded-md text-[8px] font-bold truncate bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400"
                      title={`Vencimento ${b.name}`}
                    >
                      <Clock size={7} className="flex-shrink-0" />
                      <span className="truncate">{b.brand}</span>
                    </div>
                  ))}
                  {(closingCards.length + dueCards.length) > 4 && (
                    <span className="text-[7px] text-slate-400 text-center">
                      +{closingCards.length + dueCards.length - 4}
                    </span>
                  )}
                </div>
              )}

              {/* Activity dot */}
              {hasActivity && !isFuture && (
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {expenses > 0 && <div className="w-1 h-1 rounded-full bg-red-400" />}
                  {income  > 0 && <div className="w-1 h-1 rounded-full bg-green-400" />}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ── Week view ─────────────────────────────────────────────────────────────────
function WeekView({
  weekStart, transactions, banks, showCardDates, today, selectedDate, onSelectDate,
}: {
  weekStart: Date; transactions: Transaction[];
  banks: Bank[]; showCardDates: boolean;
  today: Date; selectedDate: Date | null;
  onSelectDate: (d: Date) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const spendMap = useMemo(() => {
    const map: Record<string, { income: number; expenses: number; txs: Transaction[] }> = {};
    transactions.forEach((t) => {
      if (!map[t.date]) map[t.date] = { income: 0, expenses: 0, txs: [] };
      if (t.type === 'income') map[t.date].income += t.amount;
      else map[t.date].expenses += Math.abs(t.amount);
      map[t.date].txs.push(t);
    });
    return map;
  }, [transactions]);

  const maxExpenses = Math.max(1, ...days.map((d) => {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return spendMap[key]?.expenses ?? 0;
  }));

  return (
    <div className="grid grid-cols-7 gap-3">
      {days.map((d) => {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const data = spendMap[key];
        const expenses = data?.expenses ?? 0;
        const income   = data?.income ?? 0;
        const txCount  = data?.txs.length ?? 0;
        const isFuture = d > today;
        const isToday  = isSameDay(d, today);
        const isSelected = selectedDate && isSameDay(d, selectedDate);
        const barH = expenses > 0 ? Math.max(8, (expenses / maxExpenses) * 80) : 0;
        const closingCards = showCardDates ? banks.filter((b) => b.closingDay === d.getDate()) : [];
        const dueCards     = showCardDates ? banks.filter((b) => b.dueDay === d.getDate())     : [];

        return (
          <motion.button
            key={key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelectDate(d)}
            className={`flex flex-col items-center rounded-2xl p-3 transition-colors ${
              isSelected
                ? 'bg-amber-50 dark:bg-amber-500/15 ring-2 ring-amber-500'
                : isToday
                ? 'bg-slate-100 dark:bg-white/10'
                : 'hover:bg-slate-50 dark:hover:bg-white/5'
            } ${isFuture ? 'opacity-40' : ''}`}
          >
            {/* Weekday label */}
            <span className="text-[10px] font-semibold text-slate-400 uppercase mb-1">
              {WEEKDAYS[d.getDay()]}
            </span>

            {/* Day number */}
            <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full mb-3 ${
              isToday ? 'bg-amber-500 text-white' : 'text-slate-700 dark:text-slate-200'
            }`}>
              {d.getDate()}
            </span>

            {/* Bar chart — altura fixa para manter baseline consistente */}
            <div className="w-full flex flex-col justify-end items-center gap-1" style={{ height: 96 }}>
              {expenses > 0 && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: barH }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="w-6 rounded-t-lg"
                  style={{
                    backgroundColor: expenses / maxExpenses > 0.75 ? '#EF4444'
                      : expenses / maxExpenses > 0.4 ? '#F59E0B' : '#22C55E',
                    minHeight: 4,
                  }}
                />
              )}
              {expenses === 0 && !isFuture && (
                <div className="w-6 h-1 rounded-full bg-slate-200 dark:bg-white/10" />
              )}
            </div>

            {/* Amounts */}
            <div className="mt-2 flex flex-col items-center gap-0.5" style={{ minHeight: 36 }}>
              {!isFuture && (
                <>
                  {expenses > 0 && (
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                      -{fmtShort(expenses)}
                    </span>
                  )}
                  {income > 0 && (
                    <span className="text-[9px] font-bold text-green-500">
                      +{fmtShort(income)}
                    </span>
                  )}
                  {txCount > 0 && (
                    <span className="text-[9px] text-slate-400">{txCount} lançamento{txCount !== 1 ? 's' : ''}</span>
                  )}
                </>
              )}
            </div>

            {/* Card date pills — fora da área do gráfico, altura reservada para alinhamento */}
            <div className="w-full flex flex-col gap-0.5" style={{ minHeight: 28 }}>
              {closingCards.slice(0, 1).map((b) => (
                <div key={`c-${b.id}`} className="flex items-center gap-0.5 px-1 py-0.5 rounded-md text-[8px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 truncate">
                  <Scissors size={7} className="flex-shrink-0" />
                  <span className="truncate">{b.brand}</span>
                </div>
              ))}
              {closingCards.length > 1 && (
                <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-md text-[8px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <Scissors size={7} className="flex-shrink-0" />
                  <span>+{closingCards.length - 1}</span>
                </div>
              )}
              {dueCards.slice(0, 1).map((b) => (
                <div key={`d-${b.id}`} className="flex items-center gap-0.5 px-1 py-0.5 rounded-md text-[8px] font-bold bg-red-100 dark:bg-red-500/15 text-red-500 dark:text-red-400 truncate">
                  <Clock size={7} className="flex-shrink-0" />
                  <span className="truncate">{b.brand}</span>
                </div>
              ))}
              {dueCards.length > 1 && (
                <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-md text-[8px] font-bold bg-red-100 dark:bg-red-500/15 text-red-500 dark:text-red-400">
                  <Clock size={7} className="flex-shrink-0" />
                  <span>+{dueCards.length - 1}</span>
                </div>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

// ── Day view ──────────────────────────────────────────────────────────────────
function DayView({ date, transactions, banks }: { date: Date; transactions: Transaction[]; banks: Bank[] }) {
  const dayTx = useMemo(() =>
    transactions
      .filter((t) => isSameDay(new Date(t.date + 'T00:00:00'), date))
      .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, date]
  );

  const income   = dayTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = dayTx.filter((t) => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);

  const closingCards = banks.filter((b) => b.closingDay === date.getDate());
  const dueCards     = banks.filter((b) => b.dueDay === date.getDate());
  const hasCardEvents = closingCards.length > 0 || dueCards.length > 0;

  // Category breakdown for expenses
  const catMap = useMemo(() => {
    const m: Record<string, { amount: number; color: string; icon: string }> = {};
    dayTx.filter((t) => t.type === 'expense').forEach((t) => {
      if (!m[t.category]) m[t.category] = { amount: 0, color: t.color, icon: t.icon };
      m[t.category].amount += Math.abs(t.amount);
    });
    return Object.entries(m).sort((a, b) => b[1].amount - a[1].amount);
  }, [dayTx]);

  const maxCat = catMap[0]?.[1].amount ?? 1;

  if (dayTx.length === 0 && !hasCardEvents) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <CalendarDays size={44} className="mb-3 opacity-30" />
        <p className="font-semibold text-sm">Nenhum lançamento</p>
        <p className="text-xs mt-1">Sem transações neste dia</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Card events */}
      {hasCardEvents && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Cartões</p>
          <div className="flex flex-col gap-2">
            {closingCards.map((b) => (
              <div key={`close-${b.id}`} className="flex items-center gap-3 p-3 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Scissors size={16} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{b.name}</p>
                  <p className="text-xs text-slate-400">Fechamento da fatura · Agência {b.code}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex-shrink-0">Fecha</span>
              </div>
            ))}
            {dueCards.map((b) => (
              <div key={`due-${b.id}`} className="flex items-center gap-3 p-3 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10">
                <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <Clock size={16} className="text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{b.name}</p>
                  <p className="text-xs text-slate-400">Vencimento da fatura · Agência {b.code}</p>
                  {b.lastInvoiceAmount != null && (
                    <p className="text-xs font-bold text-red-500 mt-0.5">{fmt(b.lastInvoiceAmount)}</p>
                  )}
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-500 dark:text-red-400 flex-shrink-0">Vence</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 dark:bg-green-500/10 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowUpRight size={13} className="text-green-500" />
            <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">Entradas</span>
          </div>
          <p className="text-xl font-bold text-green-600 dark:text-green-400">{fmt(income)}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-500/10 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowDownLeft size={13} className="text-red-500" />
            <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">Saídas</span>
          </div>
          <p className="text-xl font-bold text-red-500">{fmt(expenses)}</p>
        </div>
        <div className={`rounded-2xl p-4 ${income - expenses >= 0 ? 'bg-slate-50 dark:bg-white/5' : 'bg-red-50 dark:bg-red-500/10'}`}>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Saldo do dia</p>
          <p className={`text-xl font-bold ${income - expenses >= 0 ? 'text-slate-900 dark:text-slate-50' : 'text-red-500'}`}>
            {fmt(income - expenses)}
          </p>
        </div>
      </div>

      {/* Category breakdown */}
      {catMap.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Gastos por categoria</p>
          <div className="flex flex-col gap-2.5">
            {catMap.map(([cat, { amount, color, icon }]) => {
              const Icon = iconMap[icon] ?? ShoppingCart;
              const pct = (amount / maxCat) * 100;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: color + '20' }}
                  >
                    <Icon size={14} style={{ color }} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{cat}</span>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-2 flex-shrink-0">{fmt(amount)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transaction list */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Lançamentos</p>
        <div className="flex flex-col gap-2">
          {dayTx.map((tx, i) => {
            const Icon = iconMap[tx.icon] ?? ShoppingCart;
            const isIncome = tx.type === 'income';
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: tx.color + '18' }}
                >
                  <Icon size={16} style={{ color: tx.color }} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{tx.label}</p>
                  <p className="text-xs text-slate-400">{tx.category}</p>
                </div>
                <p className={`text-sm font-bold flex-shrink-0 ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-slate-700 dark:text-slate-200'}`}>
                  {isIncome ? '+' : '-'}{fmt(Math.abs(tx.amount))}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Month/Year picker popover ─────────────────────────────────────────────────
function MonthYearPicker({
  year, month, onSelect, onClose,
}: {
  year: number; month: number;
  onSelect: (year: number, month: number) => void;
  onClose: () => void;
}) {
  const [pickerYear, setPickerYear] = useState(year);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -6 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white dark:bg-card border border-slate-100 dark:border-white/10 rounded-2xl shadow-2xl p-4 w-64"
    >
      {/* Year selector */}
      <div className="flex items-center justify-between mb-3">
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => setPickerYear((y) => y - 1)}
          className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors"
        >
          <ChevronLeft size={15} />
        </motion.button>
        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{pickerYear}</span>
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => setPickerYear((y) => y + 1)}
          className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors"
        >
          <ChevronRight size={15} />
        </motion.button>
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {MONTHS.map((m, i) => {
          const isCurrent = pickerYear === year && i === month;
          return (
            <motion.button
              key={m}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => { onSelect(pickerYear, i); onClose(); }}
              className={`py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                isCurrent
                  ? 'bg-amber-500 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400'
              }`}
            >
              {m.slice(0, 3)}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const { transactions, banks } = useAppData();
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  const [view, setView]               = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date(today));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [pickerOpen, setPickerOpen]   = useState(false);
  const [showCardDates, setShowCardDates] = useState(true);

  useFabAction({ label: '', onClick: () => {}, hidden: true });

  // Navigation
  function prev() {
    if (view === 'month') {
      setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    } else if (view === 'week') {
      setCurrentDate((d) => addDays(d, -7));
    } else {
      setCurrentDate((d) => addDays(d, -1));
    }
    setSelectedDate(null);
  }

  function next() {
    if (view === 'month') {
      setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    } else if (view === 'week') {
      setCurrentDate((d) => addDays(d, 7));
    } else {
      setCurrentDate((d) => addDays(d, 1));
    }
    setSelectedDate(null);
  }

  function goToday() {
    setCurrentDate(new Date(today));
    setSelectedDate(null);
  }

  const weekStart = startOfWeek(currentDate);

  // Period summary
  const periodTx = useMemo(() => {
    if (view === 'month') {
      const prefix = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      return transactions.filter((t) => t.date.startsWith(prefix));
    }
    if (view === 'week') {
      const end = addDays(weekStart, 6);
      return transactions.filter((t) => {
        const d = new Date(t.date + 'T00:00:00');
        return d >= weekStart && d <= end;
      });
    }
    return transactions.filter((t) => isSameDay(new Date(t.date + 'T00:00:00'), currentDate));
  }, [transactions, view, currentDate, weekStart]);

  const periodIncome   = periodTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const periodExpenses = periodTx.filter((t) => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);

  // Period label
  const periodLabel = view === 'month'
    ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    : view === 'week'
    ? `${weekStart.getDate()} – ${addDays(weekStart, 6).getDate()} de ${MONTHS[addDays(weekStart, 3).getMonth()]} ${addDays(weekStart, 3).getFullYear()}`
    : new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(currentDate);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Finanças</p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Calendário</h1>
          </div>

          {/* View toggle */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-white/10 rounded-2xl">
            {(['month', 'week', 'day'] as ViewMode[]).map((v) => (
              <motion.button
                key={v}
                onClick={() => { setView(v); setSelectedDate(null); }}
                className="relative px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                animate={{ color: view === v ? '#1e293b' : '#94a3b8' }}
              >
                {view === v && (
                  <motion.div
                    layoutId="calView"
                    className="absolute inset-0 bg-white dark:bg-white/20 rounded-xl shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 dark:text-slate-200">
                  {{ month: 'Mês', week: 'Semana', day: 'Dia' }[v]}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Entradas', value: periodIncome,   color: 'text-green-600 dark:text-green-400' },
            { label: 'Saídas',   value: periodExpenses, color: 'text-red-500' },
            { label: 'Saldo',    value: periodIncome - periodExpenses,
              color: periodIncome - periodExpenses >= 0 ? 'text-slate-900 dark:text-slate-50' : 'text-red-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white dark:bg-card rounded-2xl p-4 border border-slate-100 dark:border-white/8">
              <p className="text-xs text-slate-400 mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{fmt(value)}</p>
            </div>
          ))}
        </div>

        {/* Calendar card */}
        <div className="bg-white dark:bg-card rounded-3xl border border-slate-100 dark:border-white/8 p-6">
          {/* Nav bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                onClick={prev}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors"
              >
                <ChevronLeft size={18} />
              </motion.button>

              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setPickerOpen((o) => !o)}
                  className="text-base font-bold text-slate-900 dark:text-slate-50 capitalize min-w-[220px] text-center px-3 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                >
                  {periodLabel}
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${pickerOpen ? 'rotate-180' : ''}`} />
                </motion.button>
                <AnimatePresence>
                  {pickerOpen && (
                    <MonthYearPicker
                      year={currentDate.getFullYear()}
                      month={currentDate.getMonth()}
                      onSelect={(y, m) => {
                        setCurrentDate(new Date(y, m, 1));
                        setSelectedDate(null);
                      }}
                      onClose={() => setPickerOpen(false)}
                    />
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                onClick={next}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors"
              >
                <ChevronRight size={18} />
              </motion.button>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={goToday}
              className="px-4 py-1.5 rounded-xl border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
            >
              Hoje
            </motion.button>
          </div>

          {/* Legend (month view) */}
          {view === 'month' && (
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Gastos:</span>
              {[
                { color: 'bg-green-100 dark:bg-green-500/20', label: 'Baixo' },
                { color: 'bg-amber-100 dark:bg-amber-500/20', label: 'Médio' },
                { color: 'bg-red-100 dark:bg-red-500/15',    label: 'Alto'  },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-sm ${color}`} />
                  <span className="text-[10px] text-slate-400">{label}</span>
                </div>
              ))}

              <div className="ml-auto flex items-center gap-3">
                {/* Card dates legend */}
                {showCardDates && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Scissors size={9} className="text-slate-400" />
                      <span className="text-[10px] text-slate-400">Fechamento</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={9} className="text-orange-400" />
                      <span className="text-[10px] text-slate-400">Vencimento</span>
                    </div>
                  </div>
                )}

                {/* Toggle filter */}
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setShowCardDates((v) => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-colors border ${
                    showCardDates
                      ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400'
                      : 'bg-slate-100 dark:bg-white/8 border-slate-200 dark:border-white/10 text-slate-400'
                  }`}
                >
                  <CreditCard size={11} />
                  Datas dos cartões
                </motion.button>
              </div>
            </div>
          )}

          {/* Calendar views */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${view}-${currentDate.toISOString().slice(0, 10)}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {view === 'month' && (
                <MonthView
                  year={currentDate.getFullYear()}
                  month={currentDate.getMonth()}
                  transactions={transactions}
                  banks={banks}
                  showCardDates={showCardDates}
                  today={today}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
              )}
              {view === 'week' && (
                <WeekView
                  weekStart={weekStart}
                  transactions={transactions}
                  banks={banks}
                  showCardDates={showCardDates}
                  today={today}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
              )}
              {view === 'day' && (
                <DayView date={currentDate} transactions={transactions} banks={banks} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Day detail drawer */}
      <AnimatePresence>
        {selectedDate && (
          <>
            <motion.div
              key="cal-bd"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDate(null)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />
            <DayPanel
              date={selectedDate}
              transactions={transactions}
              banks={banks}
              onClose={() => setSelectedDate(null)}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}
