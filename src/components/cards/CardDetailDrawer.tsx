'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CreditCard,
  Calendar,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShoppingCart,
  Car,
  Tv,
  UtensilsCrossed,
  Briefcase,
  Dumbbell,
  Package,
  Music,
  Zap,
  Cross,
  BarChart2,
  Heart,
  Home,
  BookOpen,
  TrendingUp,
  Pencil,
  ChevronDown,
  CalendarDays,
} from 'lucide-react';
import { Bank, Transaction } from '@/types';
import BankCard from './BankCard';
import AddCardModal from './AddCardModal';

const iconMap: Record<string, React.ElementType> = {
  ShoppingCart, TrendingUp, Car, Tv, UtensilsCrossed, Briefcase,
  Dumbbell, Package, Music, Zap, Cross, BarChart2, Heart, Home, BookOpen,
};

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function formatDate(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date);
}

const invoiceHistory = [
  { month: 'Fevereiro/2026', amount: 1240.80, status: 'paid' },
  { month: 'Janeiro/2026', amount: 987.40, status: 'paid' },
  { month: 'Dezembro/2025', amount: 2130.60, status: 'paid' },
];

interface Props {
  bank: Bank | null;
  transactions: Transaction[];
  onClose: () => void;
}


const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function CardDetailDrawer({ bank, transactions, onClose }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [futureOpen, setFutureOpen] = useState(false);

  if (!bank) return null;

  const cardTransactions = transactions
    .filter((t) => t.bankId === bank.id)
    .slice(0, 5);

  // Future invoices: transactions linked to this card dated after the current month
  const now = new Date();
  const currentYearMonth = now.getFullYear() * 12 + now.getMonth();

  const futureTransactions = transactions
    .filter((t) => {
      if (t.bankId !== bank.id) return false;
      const d = new Date(t.date + 'T00:00:00');
      return d.getFullYear() * 12 + d.getMonth() > currentYearMonth;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // Group by year-month
  const futureByMonth = futureTransactions.reduce<Record<string, { label: string; total: number; items: Transaction[] }>>(
    (acc, t) => {
      const d = new Date(t.date + 'T00:00:00');
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[key]) {
        acc[key] = { label: `${MONTHS_PT[d.getMonth()]}/${d.getFullYear()}`, total: 0, items: [] };
      }
      acc[key].total += Math.abs(t.amount);
      acc[key].items.push(t);
      return acc;
    },
    {},
  );

  const creditLimit = bank.creditLimit ?? 0;
  const creditUsed = bank.creditUsed ?? 0;
  const creditAvailable = Math.max(0, creditLimit - creditUsed);
  const usagePct = creditLimit > 0 ? Math.min(100, (creditUsed / creditLimit) * 100) : 0;

  const barColor =
    usagePct >= 90 ? '#EF4444' : usagePct >= 70 ? '#F59E0B' : '#22C55E';

  const statusConfig = {
    paid: { label: 'Paga', icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10' },
    open: { label: 'Em aberto', icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    overdue: { label: 'Atrasada', icon: AlertCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
  };

  const status = statusConfig[bank.invoiceStatus ?? 'open'];
  const StatusIcon = status.icon;

  return (
    <AnimatePresence>
      {bank && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 h-full w-full max-w-[420px] bg-white dark:bg-card z-50 flex flex-col shadow-2xl overflow-y-auto styled-scrollbar"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Detalhes</p>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">{bank.name}</h2>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => setEditOpen(true)}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  title="Editar cartão"
                  className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
                >
                  <Pencil size={16} />
                </motion.button>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
                >
                  <X size={18} />
                </motion.button>
              </div>
            </div>

            {/* Card visual */}
            <div className="flex justify-center px-6 pb-6">
              <BankCard bank={bank} />
            </div>

            <div className="flex flex-col gap-4 px-6 pb-8">
              {/* Credit limit bar */}
              {creditLimit > 0 && (
                <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Limite do cartão</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{usagePct.toFixed(0)}% usado</span>
                  </div>

                  <div className="h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mb-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${usagePct}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: barColor }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 mb-0.5">Usado</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{fmt(creditUsed)}</p>
                    </div>
                    <div className="text-center border-x border-slate-200 dark:border-white/10">
                      <p className="text-[10px] text-slate-400 mb-0.5">Disponível</p>
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">{fmt(creditAvailable)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 mb-0.5">Limite total</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{fmt(creditLimit)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Invoice info */}
              <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Fatura atual</p>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{fmt(creditUsed)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Valor em aberto</p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${status.bg}`}>
                    <StatusIcon size={13} className={status.color} />
                    <span className={`text-xs font-semibold ${status.color}`}>{status.label}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2.5 p-3 bg-white dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/8">
                    <Calendar size={15} className="text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400">Fechamento</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Dia {bank.closingDay}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 bg-white dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/8">
                    <TrendingDown size={15} className="text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400">Vencimento</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Dia {bank.dueDay}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent transactions */}
              <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard size={14} className="text-slate-400" />
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Últimos gastos neste cartão
                  </p>
                </div>

                {cardTransactions.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">Nenhuma transação neste cartão</p>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {cardTransactions.map((tx, i) => {
                      const Icon = iconMap[tx.icon] ?? ShoppingCart;
                      return (
                        <div key={tx.id}>
                          <div className="flex items-center gap-3 py-2.5">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: tx.color + '18' }}
                            >
                              <Icon size={14} style={{ color: tx.color }} strokeWidth={2} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{tx.label}</p>
                              <p className="text-[10px] text-slate-400">{formatDate(tx.date)}</p>
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex-shrink-0">
                              {fmt(Math.abs(tx.amount))}
                            </span>
                          </div>
                          {i < cardTransactions.length - 1 && (
                            <div className="h-px bg-slate-100 dark:bg-white/5" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Future invoices */}
              {Object.keys(futureByMonth).length > 0 && (
                <div className="bg-slate-50 dark:bg-white/5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setFutureOpen((o) => !o)}
                    className="w-full flex items-center justify-between px-4 py-4 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <CalendarDays size={14} className="text-amber-500" />
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Faturas futuras
                      </p>
                      <span className="text-[10px] font-semibold bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                        {Object.keys(futureByMonth).length} {Object.keys(futureByMonth).length === 1 ? 'mês' : 'meses'}
                      </span>
                    </div>
                    <motion.div animate={{ rotate: futureOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={15} className="text-slate-400" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {futureOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 flex flex-col gap-3">
                          {Object.entries(futureByMonth).map(([key, month]) => (
                            <div key={key} className="bg-white dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/8 overflow-hidden">
                              {/* Month header */}
                              <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 dark:border-white/8">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{month.label}</p>
                                <p className="text-xs font-bold text-red-500 dark:text-red-400">−{fmt(month.total)}</p>
                              </div>
                              {/* Transactions */}
                              <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/5">
                                {month.items.map((tx) => {
                                  const Icon = iconMap[tx.icon] ?? ShoppingCart;
                                  return (
                                    <div key={tx.id} className="flex items-center gap-2.5 px-3 py-2">
                                      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: tx.color + '20' }}>
                                        <Icon size={12} style={{ color: tx.color }} strokeWidth={2} />
                                      </div>
                                      <p className="flex-1 text-xs text-slate-700 dark:text-slate-200 truncate">{tx.label}</p>
                                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">{fmt(Math.abs(tx.amount))}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Invoice history */}
              <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Histórico de faturas</p>

                <div className="flex flex-col gap-0.5">
                  {/* Current open/overdue invoice */}
                  <div className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Março/2026</p>
                      <p className={`text-[10px] font-medium ${status.color}`}>{status.label}</p>
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{fmt(creditUsed)}</p>
                  </div>

                  {invoiceHistory.map((inv, i) => (
                    <div key={inv.month}>
                      <div className="h-px bg-slate-100 dark:bg-white/5" />
                      <div className="flex items-center justify-between py-2.5">
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{inv.month}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <CheckCircle2 size={10} className="text-green-500" />
                            <p className="text-[10px] font-medium text-green-600 dark:text-green-400">Paga</p>
                          </div>
                        </div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{fmt(inv.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}

      <AddCardModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        editBank={bank}
      />
    </AnimatePresence>
  );
}
