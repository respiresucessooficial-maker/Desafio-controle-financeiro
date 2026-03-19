'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useAppData } from '@/contexts/AppDataContext';

const R = 52;
const CIRCUMFERENCE = 2 * Math.PI * R;

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function scoreColor(score: number) {
  if (score <= 30) return '#EF4444';
  if (score <= 50) return '#F97316';
  if (score <= 75) return '#F59E0B';
  return '#10B981';
}

export default function FinancialHealth() {
  const { transactions } = useAppData();
  const [progress, setProgress] = useState(0);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthlyTransactions = transactions.filter((t) => t.date.startsWith(currentMonth));

  const monthlyIncome = monthlyTransactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const monthlyExpenses = monthlyTransactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const savingsRate = monthlyIncome > 0
    ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
    : 0;

  // Score: based on savings rate (0–100)
  const SCORE = Math.min(100, Math.max(0, Math.round(savingsRate)));

  useEffect(() => {
    const t = setTimeout(() => setProgress(SCORE), 300);
    return () => clearTimeout(t);
  }, [SCORE]);

  const color = scoreColor(SCORE);
  const dashOffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  const insights = [
    { label: 'Renda mensal',     value: fmt(monthlyIncome),   trend: 'up'   as const },
    { label: 'Gastos mensais',   value: fmt(monthlyExpenses), trend: 'down' as const },
    { label: 'Taxa de poupança', value: `${savingsRate.toFixed(1)}%`, trend: savingsRate >= 0 ? 'up' as const : 'down' as const },
  ];

  return (
    <div className="bg-white dark:bg-card rounded-2xl p-5 border border-slate-100 dark:border-white/8 flex flex-col">
      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-4">Saúde Financeira</h2>

      <div className="flex items-center gap-5 flex-1">

        {/* ── Gauge ── */}
        <div className="relative shrink-0 flex items-center justify-center">
          <svg width="130" height="130" viewBox="0 0 130 130">
            <defs>
              <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={color} />
                <stop offset="100%" stopColor={color} stopOpacity="0.7" />
              </linearGradient>
            </defs>
            {/* Track */}
            <circle
              cx="65" cy="65" r={R}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-slate-100 dark:text-white/8"
            />
            {/* Arc */}
            <motion.circle
              cx="65" cy="65" r={R}
              fill="none"
              stroke="url(#healthGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
              transform="rotate(-90 65 65)"
            />
          </svg>

          {/* Score text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-3xl font-bold leading-none"
              style={{ color }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {SCORE}
            </motion.span>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">/ 100</span>
          </div>
        </div>

        {/* ── Metrics ── */}
        <div className="flex flex-col gap-2">
          {insights.map((item, i) => (
            <motion.div
              key={item.label}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              {/* Icon pill */}
              <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                item.trend === 'up'
                  ? 'bg-emerald-500/15 dark:bg-emerald-500/20'
                  : 'bg-red-500/15 dark:bg-red-500/20'
              }`}>
                {item.trend === 'up'
                  ? <TrendingUp size={11} className="text-emerald-500" />
                  : <TrendingDown size={11} className="text-red-500" />
                }
              </div>

              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {item.label}
              </span>

              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap ml-3">
                {item.value}
              </span>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
