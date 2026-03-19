'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAppData } from '@/contexts/AppDataContext';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function AnimatedNumber({ value, hidden }: { value: number; hidden: boolean }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    setDisplay(0);
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

  if (hidden) {
    return (
      <span className="tracking-[0.25em] text-slate-300 dark:text-slate-600 select-none">
        ••••••••
      </span>
    );
  }

  return <span>{fmt(display)}</span>;
}

export default function BalanceHeader() {
  const { transactions, banks } = useAppData();
  const totalBalance = banks.reduce((sum, b) => sum + b.balance, 0);
  const [hidden, setHidden] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const monthIncome = transactions
    .filter((t) => t.type === 'income' && t.date.startsWith(currentMonth))
    .reduce((s, t) => s + t.amount, 0);

  const monthExpenses = transactions
    .filter((t) => t.type === 'expense' && t.date.startsWith(currentMonth))
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const balance = totalBalance;

  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-slate-100 dark:border-white/8 p-6">
      <div className="flex items-start justify-between">
        {/* Left: balance */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Saldo Total
            </p>
            <button
              onClick={() => setHidden((h) => !h)}
              className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors"
            >
              {hidden ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-none">
            <AnimatedNumber value={balance} hidden={hidden} />
          </h1>
        </div>

        {/* Right: monthly stats */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 mb-1">
              <ArrowUpRight size={13} className="text-green-500" />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Entradas
              </span>
            </div>
            <p className="text-sm font-bold text-green-600 dark:text-green-400">
              {hidden ? '••••' : fmt(monthIncome)}
            </p>
          </div>

          <div className="w-px h-10 bg-slate-100 dark:bg-white/8" />

          <div className="text-right">
            <div className="flex items-center justify-end gap-1 mb-1">
              <ArrowDownRight size={13} className="text-red-500" />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Saídas
              </span>
            </div>
            <p className="text-sm font-bold text-red-500 dark:text-red-400">
              {hidden ? '••••' : fmt(monthExpenses)}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom: net bar */}
      {!hidden && monthIncome > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Economia este mês
            </span>
            <span
              className={`text-xs font-semibold ${
                monthIncome - monthExpenses >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-500'
              }`}
            >
              {fmt(monthIncome - monthExpenses)}
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-white/8 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(100, (monthExpenses / monthIncome) * 100).toFixed(1)}%`,
              }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full bg-amber-400"
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-slate-400">0%</span>
            <span className="text-[10px] text-slate-400">
              {((monthExpenses / monthIncome) * 100).toFixed(0)}% gasto
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
