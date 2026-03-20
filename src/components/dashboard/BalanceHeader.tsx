'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Eye, EyeOff } from 'lucide-react';
import { useAppData } from '@/contexts/AppDataContext';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function AnimatedNumber({ value, hidden }: { value: number; hidden: boolean }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 900;
    const start = Date.now();

    const frame = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  }, [value]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {hidden ? (
        <motion.span
          key="masked"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="select-none tracking-[0.25em] text-slate-300 dark:text-slate-600"
        >
          ........
        </motion.span>
      ) : (
        <motion.span
          key="value"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {fmt(display)}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export default function BalanceHeader() {
  const { transactions, accounts, budgets } = useAppData();
  const [hidden, setHidden] = useState(false);

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const budgetCategories = new Set(budgets.map((budget) => budget.category));

  const monthIncome = transactions
    .filter((t) => t.type === 'income' && t.date.startsWith(currentMonth))
    .reduce((sum, t) => sum + t.amount, 0);

  const monthExpenses = transactions
    .filter((t) => t.type === 'expense' && t.date.startsWith(currentMonth))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const budgetTrackedExpenses = transactions
    .filter(
      (t) =>
        t.type === 'expense' &&
        t.date.startsWith(currentMonth) &&
        budgetCategories.has(t.category),
    )
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalBudgeted = budgets.reduce((sum, budget) => sum + budget.limit, 0);
  const spentPct = totalBudgeted > 0
    ? Math.min(100, (budgetTrackedExpenses / totalBudgeted) * 100)
    : 0;
  const maskedAmount = '....';

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 dark:border-white/8 dark:bg-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Saldo Total
            </p>
            <button
              onClick={() => setHidden((h) => !h)}
              className="text-slate-300 transition-colors hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400"
            >
              {hidden ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>

          <h1 className="text-4xl font-bold leading-none tracking-tight text-slate-900 dark:text-slate-50">
            <AnimatedNumber value={totalBalance} hidden={hidden} />
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="mb-1 flex items-center justify-end gap-1">
              <ArrowUpRight size={13} className="text-green-500" />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Entradas</span>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={hidden ? 'income-hidden' : 'income-visible'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-bold text-green-600 dark:text-green-400"
              >
                {hidden ? maskedAmount : fmt(monthIncome)}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="h-10 w-px bg-slate-100 dark:bg-white/8" />

          <div className="text-right">
            <div className="mb-1 flex items-center justify-end gap-1">
              <ArrowDownRight size={13} className="text-red-500" />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Saidas</span>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={hidden ? 'expense-hidden' : 'expense-visible'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-bold text-red-500 dark:text-red-400"
              >
                {hidden ? maskedAmount : fmt(monthExpenses)}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!hidden && totalBudgeted > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="mt-5"
          >
            <div className="mb-2 flex items-center justify-center gap-6">
              <div className="text-center">
                <div className="mb-1 flex items-center justify-center gap-1">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Previsao</span>
                </div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  {fmt(totalBudgeted)}
                </p>
              </div>

              <div className="h-10 w-px bg-slate-100 dark:bg-white/8" />

              <div className="text-center">
                <div className="mb-1 flex items-center justify-center gap-1">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Gasto</span>
                </div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  {fmt(budgetTrackedExpenses)}
                </p>
              </div>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/8">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${spentPct.toFixed(1)}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-amber-400"
              />
            </div>

            <div className="mt-1 flex justify-between">
              <span className="text-[10px] text-slate-400">0%</span>
              <span className="text-[10px] text-slate-400">{spentPct.toFixed(0)}% gasto</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
