'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Pencil, Trash2,
  ShoppingCart, Home, Car, Tv, Heart, BarChart2, Package,
  BookOpen, TrendingUp, TrendingDown, DollarSign,
  CheckCircle, AlertTriangle, XCircle,
} from 'lucide-react';
import { Budget, Transaction } from '@/types';
import { CATEGORIES } from '@/data/categories';

const iconMap: Record<string, React.ElementType> = {
  ShoppingCart, Home, Car, Tv, Heart, BarChart2, Package,
  BookOpen, TrendingUp, TrendingDown, DollarSign,
};

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(d);
}

interface Props {
  budget: Budget | null;
  transactions: Transaction[];
  onClose: () => void;
  onEdit: (b: Budget) => void;
  onDelete: (category: string) => void;
}

export default function BudgetDetailDrawer({ budget, transactions, onClose, onEdit, onDelete }: Props) {
  const now = new Date();
  const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const catTransactions = useMemo(() => {
    if (!budget) return [];
    return transactions
      .filter((t) =>
        t.type === 'expense' &&
        t.category === budget.category &&
        t.date.startsWith(thisMonthPrefix)
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [budget, transactions, thisMonthPrefix]);

  const spent = catTransactions.reduce((s, t) => s + Math.abs(t.amount), 0);
  const ratio = budget ? spent / budget.limit : 0;
  const pct   = Math.min(100, Math.round(ratio * 100));
  const status = ratio >= 1 ? 'exceeded' : ratio >= 0.8 ? 'warning' : 'normal';

  const catDef = budget ? CATEGORIES.find((c) => c.name === budget.category) : null;
  const CategoryIcon = iconMap[catDef?.icon ?? 'Package'] ?? Package;

  return (
    <AnimatePresence>
      {budget && (
        <>
          {/* Backdrop */}
          <motion.div
            key="bdd-bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.aside
            key="bdd-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 h-full w-[400px] bg-white dark:bg-card shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div
              className="px-6 pt-6 pb-5"
              style={{ backgroundColor: (budget.color ?? '#6B7280') + '12' }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Detalhe do orçamento
                </span>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-white/70 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:bg-white dark:hover:bg-white/20 transition-colors"
                >
                  <X size={15} />
                </motion.button>
              </div>

              {/* Category */}
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: budget.color + '22' }}
                >
                  <CategoryIcon size={22} style={{ color: budget.color }} strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">{budget.category}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Limite mensal de {fmt(budget.limit)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mt-4 mb-4">
                {[
                  { label: 'Gasto',      value: fmt(spent),                    color: 'text-slate-900 dark:text-slate-50' },
                  { label: 'Disponível', value: fmt(Math.max(0, budget.limit - spent)), color: 'text-green-600 dark:text-green-400' },
                  { label: 'Utilizado',  value: `${pct}%`,                     color: status === 'exceeded' ? 'text-red-500' : status === 'warning' ? 'text-amber-500' : 'text-slate-700 dark:text-slate-200' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-slate-50 dark:bg-white/5 rounded-2xl p-3 text-center">
                    <p className={`text-base font-bold ${color}`}>{value}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="mb-2">
                <div className="h-3 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      status === 'exceeded' ? 'bg-red-500' : status === 'warning' ? 'bg-amber-400' : 'bg-green-500'
                    }`}
                  />
                </div>
              </div>

              {/* Status badge */}
              <div className="flex justify-end mb-5">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  status === 'exceeded'
                    ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                    : status === 'warning'
                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    : 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                }`}>
                  {status === 'exceeded'
                    ? <><XCircle size={12} /> Limite excedido</>
                    : status === 'warning'
                    ? <><AlertTriangle size={12} /> Atenção</>
                    : <><CheckCircle size={12} /> Normal</>
                  }
                </span>
              </div>

              {/* Transactions this month */}
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                Lançamentos do mês ({catTransactions.length})
              </h3>

              {catTransactions.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-slate-400">
                  <Package size={32} className="mb-2 opacity-40" />
                  <p className="text-sm">Nenhum gasto nessa categoria este mês</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {catTransactions.map((tx) => {
                    const TxIcon = iconMap[tx.icon] ?? ShoppingCart;
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5"
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: tx.color + '18' }}
                        >
                          <TxIcon size={16} style={{ color: tx.color }} strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{tx.label}</p>
                          <p className="text-xs text-slate-400">{formatDate(tx.date)}</p>
                        </div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 flex-shrink-0">
                          -{fmt(Math.abs(tx.amount))}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-white/8 flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { onClose(); onEdit(budget); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/10 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors"
              >
                <Pencil size={14} />
                Editar limite
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { onClose(); onDelete(budget.category); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-red-50 dark:bg-red-500/10 text-sm font-semibold text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
              >
                <Trash2 size={14} />
                Excluir
              </motion.button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
