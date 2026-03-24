'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart2,
  BookOpen,
  Briefcase,
  Car,
  ChevronLeft,
  ChevronRight,
  Cross,
  Dumbbell,
  Heart,
  Home,
  Music,
  Package,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Tv,
  UtensilsCrossed,
  Zap,
} from 'lucide-react';
import { useAppData } from '@/contexts/AppDataContext';
import { getCategoryDef } from '@/data/categories';
import { getInferredAccountIncome, getMonthlyAccountFlowTotals } from '@/lib/dashboardMetrics';
import { dashboardTitleClass } from '@/components/dashboard/dashboardTypography';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const iconMap: Record<string, React.ElementType> = {
  ShoppingCart,
  TrendingUp,
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
};

const fmt = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

function monthKeyOf(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function PctRing({
  values,
  colors,
  size = 118,
}: {
  values: number[];
  colors: string[];
  size?: number;
}) {
  const total = values.reduce((sum, value) => sum + value, 0);
  const gradient = values.reduce<string[]>((parts, value, index) => {
    const previous = values.slice(0, index).reduce((sum, item) => sum + item, 0);
    const start = total > 0 ? (previous / total) * 100 : 0;
    const end = total > 0 ? ((previous + value) / total) * 100 : 0;
    return [...parts, `${colors[index]} ${start}% ${end}%`];
  }, []);

  const background = total > 0
    ? `conic-gradient(${gradient.join(', ')})`
    : 'conic-gradient(#334155 0% 100%)';

  return (
    <div
      className="relative shrink-0 rounded-full"
      style={{ width: size, height: size, background }}
    >
      <div className="absolute inset-[20%] rounded-full bg-[#1d1d1d]" />
    </div>
  );
}

function MonthPicker({
  year,
  month,
  onSelect,
  onClose,
}: {
  year: number;
  month: number;
  onSelect: (nextYear: number, nextMonth: number) => void;
  onClose: () => void;
}) {
  const [pickerYear, setPickerYear] = useState(year);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.96, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -6 }}
      transition={{ duration: 0.16 }}
      className="absolute right-0 top-full z-30 mt-2 w-[250px] rounded-2xl border border-white/10 bg-[#151515] p-3 shadow-[0_24px_70px_rgba(0,0,0,0.38)]"
    >
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setPickerYear((current) => current - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/6 text-slate-300 transition-colors hover:bg-white/12"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-lg font-bold text-white">{pickerYear}</span>
        <button
          type="button"
          onClick={() => setPickerYear((current) => current + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/6 text-slate-300 transition-colors hover:bg-white/12"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-y-2">
        {MONTHS.map((label, index) => {
          const active = pickerYear === year && index === month;
          return (
            <button
              key={label}
              type="button"
              onClick={() => {
                onSelect(pickerYear, index);
                onClose();
              }}
              className={`rounded-xl px-2 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? 'bg-amber-500 text-white'
                  : 'text-slate-300 hover:bg-white/6 hover:text-white'
              }`}
            >
              {label.slice(0, 3)}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

interface MonthlySummaryProps {
  showTitle?: boolean;
}

export default function MonthlySummary({ showTitle = true }: MonthlySummaryProps) {
  const { transactions, budgets, accounts } = useAppData();
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [pickerOpen, setPickerOpen] = useState(false);

  const selectedMonthKey = monthKeyOf(selectedYear, selectedMonth);
  const currentMonthKey = monthKeyOf(today.getFullYear(), today.getMonth());
  const monthTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.date.startsWith(selectedMonthKey)),
    [selectedMonthKey, transactions],
  );
  const inferredIncome = selectedMonthKey === currentMonthKey
    ? getInferredAccountIncome(accounts, transactions)
    : 0;
  const monthlyAccountFlows = getMonthlyAccountFlowTotals(accounts, transactions, selectedMonthKey);

  const monthlyIncomeTotal = monthTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0) + inferredIncome;

  const incomeTotal = monthlyAccountFlows.income || monthlyIncomeTotal;
  const expenseTotal = monthlyAccountFlows.expenses;

  const profitPct = incomeTotal > 0 ? ((incomeTotal - expenseTotal) / incomeTotal) * 100 : 0;
  const isCurrentMonth = selectedMonthKey === currentMonthKey;
  const totalBudgeted = isCurrentMonth
    ? budgets.reduce((sum, budget) => sum + budget.limit, 0)
    : 0;
  const budgetCategories = new Set(budgets.map((budget) => budget.category));

  const spentOnBudget = isCurrentMonth
    ? monthTransactions
      .filter(
        (transaction) =>
          transaction.type === 'expense' &&
          budgetCategories.has(transaction.category),
      )
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0)
    : 0;

  const categoryTotals = monthTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce<Record<string, { amount: number; color: string; icon: string }>>((map, transaction) => {
      const base = map[transaction.category];
      const categoryDef = getCategoryDef(transaction.category);
      map[transaction.category] = {
        amount: (base?.amount ?? 0) + Math.abs(transaction.amount),
        color: base?.color ?? transaction.color ?? categoryDef.color,
        icon: base?.icon ?? transaction.icon ?? categoryDef.icon,
      };
      return map;
    }, {});

  const categoryItems = Object.entries(categoryTotals)
    .sort(([, left], [, right]) => right.amount - left.amount);

  const maxCategoryValue = categoryItems[0]?.[1].amount ?? 0;

  const profitLabel = `${profitPct >= 0 ? '' : '-'}${Math.abs(profitPct).toFixed(1)}%`;
  const budgetLabel = `${totalBudgeted > 0 ? Math.min(100, (spentOnBudget / totalBudgeted) * 100).toFixed(1) : '0.0'}%`;

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 text-slate-900 dark:border-white/8 dark:bg-card dark:text-slate-50">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          {showTitle && (
            <p className={dashboardTitleClass}>
              Resumo mensal
            </p>
          )}
        </div>

        <div className="relative self-start lg:self-auto">
          <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-2 dark:bg-white/[0.04]">
            <button
              type="button"
              onClick={() => {
                if (selectedMonth === 0) {
                  setSelectedYear((current) => current - 1);
                  setSelectedMonth(11);
                  return;
                }
                setSelectedMonth((current) => current - 1);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-500 transition-colors hover:bg-slate-200 dark:bg-white/6 dark:text-slate-300 dark:hover:bg-white/12"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={() => setPickerOpen((current) => !current)}
              className="min-w-[150px] rounded-xl px-3 py-2 text-center text-lg font-bold text-slate-900 transition-colors hover:bg-white dark:text-white dark:hover:bg-white/6"
            >
              {MONTHS[selectedMonth]} {selectedYear}
            </button>

            <button
              type="button"
              onClick={() => {
                if (selectedMonth === 11) {
                  setSelectedYear((current) => current + 1);
                  setSelectedMonth(0);
                  return;
                }
                setSelectedMonth((current) => current + 1);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-500 transition-colors hover:bg-slate-200 dark:bg-white/6 dark:text-slate-300 dark:hover:bg-white/12"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <AnimatePresence>
            {pickerOpen && (
              <MonthPicker
                year={selectedYear}
                month={selectedMonth}
                onSelect={(year, month) => {
                  setSelectedYear(year);
                  setSelectedMonth(month);
                }}
                onClose={() => setPickerOpen(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(300px,0.95fr)]">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-white/8 dark:bg-card/80">
          <h3 className={`mb-4 ${dashboardTitleClass}`}>Entrada &amp; Saida</h3>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <PctRing
              values={[incomeTotal, expenseTotal]}
              colors={['#10B981', '#EF4444']}
              size={118}
            />

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15 dark:bg-emerald-500/20">
                  <TrendingUp size={12} className="text-emerald-500 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Entradas</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{fmt(incomeTotal)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-red-500/15 dark:bg-red-500/20">
                  <TrendingDown size={12} className="text-red-500 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Saidas</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{fmt(expenseTotal)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15 dark:bg-emerald-500/20">
                  <TrendingUp size={12} className="text-emerald-500 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Percentual de lucro</p>
                  <p className={`text-xl font-bold ${profitPct >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-500 dark:text-red-400'}`}>
                    {profitLabel}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-white/8 dark:bg-card/80">
          <h3 className={`mb-4 ${dashboardTitleClass}`}>Previsoes &amp; Gastos</h3>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <PctRing
              values={[spentOnBudget, Math.max(totalBudgeted - spentOnBudget, 0)]}
              colors={['#EF4444', '#10B981']}
              size={118}
            />

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15 dark:bg-emerald-500/20">
                  <TrendingUp size={12} className="text-emerald-500 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Previsoes</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{fmt(totalBudgeted)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-red-500/15 dark:bg-red-500/20">
                  <TrendingDown size={12} className="text-red-500 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Gastos</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{fmt(spentOnBudget)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15 dark:bg-emerald-500/20">
                  <TrendingUp size={12} className="text-emerald-500 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Percentual consumido</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{budgetLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-white/8 dark:bg-card/80">
          <h3 className={`mb-4 ${dashboardTitleClass}`}>
            Gastos por categoria
          </h3>

          {categoryItems.length === 0 ? (
            <div className="flex h-[118px] items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400 dark:border-white/10">
              Nenhum gasto encontrado no periodo.
            </div>
          ) : (
            <div className="max-h-[210px] overflow-y-auto pr-1 styled-scrollbar">
              <div className="flex flex-col gap-3">
              {categoryItems.map(([category, item]) => {
                const Icon = iconMap[item.icon] ?? Package;
                const pct = maxCategoryValue > 0 ? (item.amount / maxCategoryValue) * 100 : 0;

                return (
                  <div key={category}>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `${item.color}22` }}
                        >
                          <Icon size={13} style={{ color: item.color }} />
                        </div>
                        <span className="truncate text-sm font-semibold text-slate-800 dark:text-white">{category}</span>
                      </div>

                      <span className="shrink-0 text-sm font-bold text-slate-700 dark:text-[#dce7ff]">{fmt(item.amount)}</span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/8">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
