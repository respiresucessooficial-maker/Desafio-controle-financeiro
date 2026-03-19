'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  Sector,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAppData } from '@/contexts/AppDataContext';
import { useFabAction } from '@/contexts/FabContext';
import { useTheme } from '@/contexts/ThemeContext';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtK = (v: number) =>
  v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`;

type Period = '3M' | '6M' | '1A';
const PERIOD_SLICE: Record<Period, number> = { '3M': -3, '6M': -6, '1A': 999 };

// ── Area chart tooltip ────────────────────────────────────────────────────────
interface AreaPayload {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

function AreaTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: AreaPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const income = payload.find((p) => p.dataKey === 'income');
  const expenses = payload.find((p) => p.dataKey === 'expenses');
  const balance = (income?.value ?? 0) - (expenses?.value ?? 0);

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-white/10 text-xs min-w-[170px]">
      <div className="px-3.5 py-2 border-b border-white/10">
        <p className="font-semibold text-slate-300">{label}</p>
      </div>
      <div className="px-3.5 py-2.5 flex flex-col gap-1.5">
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-slate-400 flex-1">{p.name}</span>
            <span className="font-bold text-white">{fmt(p.value)}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1.5 border-t border-white/10 mt-0.5">
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-500" />
          <span className="text-slate-400 flex-1">Saldo</span>
          <span className={`font-bold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {fmt(balance)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Pie active shape ──────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 3}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 15}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.4}
      />
    </g>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  useFabAction({ label: '', onClick: () => {}, hidden: true });
  const { transactions } = useAppData();
  const { isDark } = useTheme();

  const [period, setPeriod] = useState<Period>('6M');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredSeries, setHoveredSeries] = useState<'income' | 'expenses' | null>(null);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const netProfit = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  const stats = [
    { label: 'Receitas', value: fmt(totalIncome), sub: 'este mês', accent: '#22C55E' },
    { label: 'Despesas', value: fmt(totalExpenses), sub: 'este mês', accent: '#EF4444' },
    {
      label: 'Saldo líquido',
      value: fmt(netProfit),
      sub: 'fluxo de caixa',
      accent: netProfit >= 0 ? '#3B82F6' : '#F59E0B',
    },
    {
      label: 'Taxa de poupança',
      value: `${savingsRate.toFixed(1)}%`,
      sub: 'da receita guardada',
      accent: '#8B5CF6',
    },
  ];

  const allMonthlyData = useMemo(() => {
    const map: Record<string, { income: number; expenses: number }> = {};
    transactions.forEach((t) => {
      const key = t.date.slice(0, 7); // 'YYYY-MM'
      if (!map[key]) map[key] = { income: 0, expenses: 0 };
      if (t.type === 'income') map[key].income += t.amount;
      else map[key].expenses += Math.abs(t.amount);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, { income, expenses }]) => {
        const [year, month] = key.split('-');
        const label = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('pt-BR', { month: 'short' });
        return { month: label.charAt(0).toUpperCase() + label.slice(1).replace('.', ''), income, expenses };
      });
  }, [transactions]);

  const chartData =
    period === '1A' ? allMonthlyData : allMonthlyData.slice(PERIOD_SLICE[period]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { value: number; color: string }> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        if (!map[t.category]) map[t.category] = { value: 0, color: t.color };
        map[t.category].value += Math.abs(t.amount);
      });
    return Object.entries(map)
      .map(([name, { value, color }]) => ({ name, value, color }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions]);

  const totalCatExpenses = categoryBreakdown.reduce((s, c) => s + c.value, 0);

  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9';
  const tickColor = isDark ? '#475569' : '#94A3B8';

  // recharts callbacks (stable refs)
  const onPieEnter = useCallback((_: unknown, index: number) => setActiveIndex(index), []);
  const onPieLeave = useCallback(() => setActiveIndex(null), []);

  const activeItem = activeIndex !== null ? categoryBreakdown[activeIndex] : null;
  const activePct =
    activeItem && totalCatExpenses > 0
      ? ((activeItem.value / totalCatExpenses) * 100).toFixed(1)
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-8"
    >
      {/* Page header */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
          Março 2026
        </p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Análise Financeira
        </h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-card rounded-2xl px-5 py-4 border border-slate-100 dark:border-white/8 transition-shadow hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/20 cursor-default"
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className="inline-block w-1 h-3.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: stat.accent }}
              />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {stat.label}
              </span>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-50 leading-none mb-1">
              {stat.value}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-5 gap-5">
        {/* ── Area chart ── */}
        <div className="col-span-3 bg-white dark:bg-card rounded-2xl p-6 border border-slate-100 dark:border-white/8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                Fluxo de Caixa
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Receitas vs Despesas</p>
            </div>

            {/* Period toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-white/6 rounded-xl p-1 gap-0.5">
              {(['3M', '6M', '1A'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    period === p
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {period === p && (
                    <motion.span
                      layoutId="periodBg"
                      className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                    />
                  )}
                  <span className="relative z-10">{p}</span>
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 4, right: 0, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="expensesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: tickColor, fontFamily: 'Plus Jakarta Sans' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: tickColor, fontFamily: 'Plus Jakarta Sans' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={fmtK}
                width={44}
              />
              <Tooltip
                content={<AreaTooltip />}
                cursor={{
                  stroke: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
                  strokeWidth: 1,
                  strokeDasharray: '4 3',
                }}
              />
              <Area
                type="monotone"
                dataKey="income"
                name="Receitas"
                stroke="#22C55E"
                strokeWidth={hoveredSeries === 'expenses' ? 1.5 : 2}
                strokeOpacity={hoveredSeries === 'expenses' ? 0.3 : 1}
                fill="url(#incomeGrad)"
                fillOpacity={hoveredSeries === 'expenses' ? 0.3 : 1}
                dot={false}
                activeDot={{ r: 5, fill: '#22C55E', stroke: 'white', strokeWidth: 2 }}
                animationDuration={500}
                animationEasing="ease-out"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name="Despesas"
                stroke="#EF4444"
                strokeWidth={hoveredSeries === 'income' ? 1.5 : 2}
                strokeOpacity={hoveredSeries === 'income' ? 0.3 : 1}
                fill="url(#expensesGrad)"
                fillOpacity={hoveredSeries === 'income' ? 0.3 : 1}
                dot={false}
                activeDot={{ r: 5, fill: '#EF4444', stroke: 'white', strokeWidth: 2 }}
                animationDuration={500}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Interactive legend */}
          <div className="flex items-center gap-5 mt-4 border-t border-slate-100 dark:border-white/6 pt-4">
            {[
              { key: 'income' as const, color: '#22C55E', label: 'Receitas', value: totalIncome },
              { key: 'expenses' as const, color: '#EF4444', label: 'Despesas', value: totalExpenses },
            ].map((s) => (
              <button
                key={s.key}
                onMouseEnter={() => setHoveredSeries(s.key)}
                onMouseLeave={() => setHoveredSeries(null)}
                className={`flex items-center gap-2 transition-opacity ${
                  hoveredSeries && hoveredSeries !== s.key ? 'opacity-35' : 'opacity-100'
                }`}
              >
                <div className="w-6 h-0.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-slate-500 dark:text-slate-400">{s.label}</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {fmt(s.value)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Pie chart ── */}
        <div className="col-span-2 bg-white dark:bg-card rounded-2xl p-6 border border-slate-100 dark:border-white/8 flex flex-col">
          <div className="mb-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">
              Por Categoria
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeItem ? activeItem.name : 'Distribuição de despesas'}
            </p>
          </div>

          {/* Donut chart with center overlay */}
          <div className="relative">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={76}
                  paddingAngle={3}
                  dataKey="value"
                  activeShape={ActiveShape}
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  stroke="none"
                  style={{ cursor: 'pointer' }}
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.color}
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center label overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex ?? 'total'}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col items-center"
                >
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-50">
                    {activeItem ? fmt(activeItem.value) : fmt(totalCatExpenses)}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {activeItem ? `${activePct}%` : 'Total'}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Interactive legend */}
          <div className="flex flex-col gap-1 mt-auto pt-3 border-t border-slate-100 dark:border-white/6">
            {categoryBreakdown.map((cat, i) => {
              const pct =
                totalCatExpenses > 0
                  ? ((cat.value / totalCatExpenses) * 100).toFixed(0)
                  : '0';
              const isActive = activeIndex === i;
              const isDimmed = activeIndex !== null && !isActive;
              return (
                <button
                  key={cat.name}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded-lg transition-all ${
                    isActive ? 'bg-slate-50 dark:bg-white/6' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                  } ${isDimmed ? 'opacity-35' : 'opacity-100'}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 transition-transform ${isActive ? 'scale-125' : ''}`}
                    style={{ backgroundColor: cat.color }}
                  />
                  <span
                    className={`text-xs flex-1 truncate min-w-0 ${
                      isActive
                        ? 'font-semibold text-slate-800 dark:text-slate-100'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {cat.name}
                  </span>
                  <AnimatePresence mode="wait">
                    {isActive ? (
                      <motion.span
                        key="val"
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -3 }}
                        transition={{ duration: 0.1 }}
                        className="text-xs font-bold text-slate-800 dark:text-slate-200 flex-shrink-0"
                      >
                        {fmt(cat.value)}
                      </motion.span>
                    ) : (
                      <motion.span
                        key="pct"
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -3 }}
                        transition={{ duration: 0.1 }}
                        className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0"
                      >
                        {pct}%
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
