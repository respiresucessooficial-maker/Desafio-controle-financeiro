'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useAppData } from '@/contexts/AppDataContext';
import { getMonthlyAccountFlowTotals } from '@/lib/dashboardMetrics';
import { dashboardTitleClass } from '@/components/dashboard/dashboardTypography';

const R = 52;
const CIRCUMFERENCE = 2 * Math.PI * R;

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface FinancialHealthProps {
  showTitle?: boolean;
}

function scoreColor(score: number) {
  if (score <= 30) return '#EF4444';
  if (score <= 50) return '#F97316';
  if (score <= 75) return '#F59E0B';
  return '#10B981';
}

export default function FinancialHealth({ showTitle = true }: FinancialHealthProps) {
  const { transactions, accounts } = useAppData();
  const [progress, setProgress] = useState(0);
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthlyFlows = getMonthlyAccountFlowTotals(accounts, transactions, currentMonth);
  const monthlyIncome = monthlyFlows.income;
  const monthlyExpenses = monthlyFlows.expenses;

  const savingsRate = monthlyIncome > 0
    ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
    : 0;

  const score = Math.min(100, Math.max(0, Math.round(savingsRate)));

  useEffect(() => {
    const t = setTimeout(() => setProgress(score), 300);
    return () => clearTimeout(t);
  }, [score]);

  const color = scoreColor(score);
  const dashOffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

  const insights = [
    { label: 'Renda mensal', value: fmt(monthlyIncome), trend: 'up' as const },
    { label: 'Gastos mensais', value: fmt(monthlyExpenses), trend: 'down' as const },
    { label: 'Taxa de poupanca', value: `${savingsRate.toFixed(1)}%`, trend: savingsRate >= 0 ? 'up' as const : 'down' as const },
  ];

  return (
    <div className="w-full rounded-2xl border border-slate-100 bg-white p-5 dark:bg-card dark:border-white/8 flex flex-col">
      {showTitle && (
        <h2 className={`mb-4 ${dashboardTitleClass}`}>Saude Financeira</h2>
      )}

      <div className="flex flex-1 items-center gap-5">
        <div className="relative flex shrink-0 items-center justify-center">
          <svg width="130" height="130" viewBox="0 0 130 130">
            <defs>
              <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={color} />
                <stop offset="100%" stopColor={color} stopOpacity="0.7" />
              </linearGradient>
            </defs>
            <circle
              cx="65"
              cy="65"
              r={R}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-slate-100 dark:text-white/8"
            />
            <motion.circle
              cx="65"
              cy="65"
              r={R}
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

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-3xl font-bold leading-none"
              style={{ color }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {score}
            </motion.span>
            <span className="mt-0.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">/ 100</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 min-w-0 flex-1">
          {insights.map((item, i) => (
            <motion.div
              key={item.label}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                  item.trend === 'up'
                    ? 'bg-emerald-500/15 dark:bg-emerald-500/20'
                    : 'bg-red-500/15 dark:bg-red-500/20'
                }`}
              >
                {item.trend === 'up' ? (
                  <TrendingUp size={11} className="text-emerald-500" />
                ) : (
                  <TrendingDown size={11} className="text-red-500" />
                )}
              </div>

              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-none mb-0.5">
                  {item.label}
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  {item.value}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
