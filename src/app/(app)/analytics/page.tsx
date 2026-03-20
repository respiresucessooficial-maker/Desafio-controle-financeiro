'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, Sector,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  ChevronLeft, ChevronRight,
  ShoppingCart, Home, Car, Tv, Heart, TrendingUp, BarChart2, BookOpen, Package,
  TrendingDown, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { useAppData } from '@/contexts/AppDataContext';
import { useFabAction } from '@/contexts/FabContext';
import { useTheme } from '@/contexts/ThemeContext';

const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingCart, Home, Car, Tv, Heart, TrendingUp, BarChart2, BookOpen, Package,
};

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtK = (v: number) =>
  v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`;

const MONTHS_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

type Period = '3M' | '6M' | '1A';
const PERIOD_SLICE: Record<Period, number> = { '3M': 3, '6M': 6, '1A': 999 };

// ── Tooltip ───────────────────────────────────────────────────────────────────
interface AreaPayload { name: string; value: number; color: string; dataKey: string; }

function AreaTooltip({ active, payload, label }: { active?: boolean; payload?: AreaPayload[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const income   = payload.find((p) => p.dataKey === 'income');
  const expenses = payload.find((p) => p.dataKey === 'expenses');
  const balance  = (income?.value ?? 0) - (expenses?.value ?? 0);
  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-white/10 text-xs min-w-[170px]">
      <div className="px-3.5 py-2 border-b border-white/10">
        <p className="font-semibold text-slate-300">{label}</p>
      </div>
      <div className="px-3.5 py-2.5 flex flex-col gap-1.5">
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-slate-400 flex-1">{p.name}</span>
            <span className="font-bold text-white">{fmt(p.value)}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-1.5 border-t border-white/10 mt-0.5">
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-500" />
          <span className="text-slate-400 flex-1">Saldo</span>
          <span className={`font-bold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(balance)}</span>
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 3} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 12} outerRadius={outerRadius + 15} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.4} />
    </g>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  useFabAction({ label: '', onClick: () => {}, hidden: true });
  const { transactions } = useAppData();
  const { isDark } = useTheme();

  const now = new Date();
  const [selYear,  setSelYear]  = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [period,   setPeriod]   = useState<Period>('6M');
  const [activeIndex,   setActiveIndex]   = useState<number | null>(null);
  const [hoveredSeries, setHoveredSeries] = useState<'income' | 'expenses' | null>(null);

  function prevMonth() {
    if (selMonth === 0) { setSelYear((y) => y - 1); setSelMonth(11); }
    else setSelMonth((m) => m - 1);
  }
  function nextMonth() {
    if (selYear === now.getFullYear() && selMonth === now.getMonth()) return;
    if (selMonth === 11) { setSelYear((y) => y + 1); setSelMonth(0); }
    else setSelMonth((m) => m + 1);
  }
  const isCurrentMonth = selYear === now.getFullYear() && selMonth === now.getMonth();
  const selKey  = `${selYear}-${String(selMonth + 1).padStart(2, '0')}`;
  const prevKey = selMonth === 0
    ? `${selYear - 1}-12`
    : `${selYear}-${String(selMonth).padStart(2, '0')}`;

  const monthTransactions = useMemo(
    () => transactions.filter((t) => t.date.startsWith(selKey)),
    [transactions, selKey],
  );
  const prevTransactions = useMemo(
    () => transactions.filter((t) => t.date.startsWith(prevKey)),
    [transactions, prevKey],
  );

  const monthIncome   = monthTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthExpenses = monthTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
  const monthNet      = monthIncome - monthExpenses;
  const monthSavings  = monthIncome > 0 ? (monthNet / monthIncome) * 100 : 0;

  const prevIncome   = prevTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const prevExpenses = prevTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);

  function pctDelta(curr: number, prev: number) {
    if (prev === 0) return null;
    return ((curr - prev) / prev) * 100;
  }

  const stats = [
    { label: 'Receitas',       value: fmt(monthIncome),       sub: MONTHS_PT[selMonth], accent: '#22C55E', delta: pctDelta(monthIncome, prevIncome),   goodWhenUp: true  },
    { label: 'Despesas',       value: fmt(monthExpenses),     sub: MONTHS_PT[selMonth], accent: '#EF4444', delta: pctDelta(monthExpenses, prevExpenses), goodWhenUp: false },
    { label: 'Saldo líquido',  value: fmt(monthNet),          sub: 'fluxo de caixa',    accent: monthNet >= 0 ? '#3B82F6' : '#F59E0B', delta: null, goodWhenUp: true },
    { label: 'Taxa de poupança', value: `${monthSavings.toFixed(1)}%`, sub: 'da receita guardada', accent: '#8B5CF6', delta: null, goodWhenUp: true },
  ];

  const allMonthlyData = useMemo(() => {
    const map: Record<string, { income: number; expenses: number }> = {};
    transactions.forEach((t) => {
      const key = t.date.slice(0, 7);
      if (!map[key]) map[key] = { income: 0, expenses: 0 };
      if (t.type === 'income') map[key].income += t.amount;
      else map[key].expenses += Math.abs(t.amount);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, { income, expenses }]) => {
        const [year, month] = key.split('-');
        const label = new Date(parseInt(year), parseInt(month) - 1, 1)
          .toLocaleDateString('pt-BR', { month: 'short' });
        return { month: label.charAt(0).toUpperCase() + label.slice(1).replace('.', ''), income, expenses };
      });
  }, [transactions]);

  const sliceCount = PERIOD_SLICE[period];
  const chartData  = sliceCount >= 999 ? allMonthlyData : allMonthlyData.slice(-sliceCount);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { value: number; color: string }> = {};
    monthTransactions.filter((t) => t.type === 'expense').forEach((t) => {
      if (!map[t.category]) map[t.category] = { value: 0, color: t.color };
      map[t.category].value += Math.abs(t.amount);
    });
    return Object.entries(map)
      .map(([name, { value, color }]) => ({ name, value, color }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [monthTransactions]);

  const totalCatExpenses = categoryBreakdown.reduce((s, c) => s + c.value, 0);

  const topExpenses = useMemo(
    () => monthTransactions.filter((t) => t.type === 'expense').sort((a, b) => a.amount - b.amount).slice(0, 5),
    [monthTransactions],
  );

  const gridColor  = isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9';
  const tickColor  = isDark ? '#475569' : '#94A3B8';

  const onPieEnter = useCallback((_: unknown, index: number) => setActiveIndex(index), []);
  const onPieLeave = useCallback(() => setActiveIndex(null), []);

  const activeItem = activeIndex !== null ? categoryBreakdown[activeIndex] : null;
  const activePct  = activeItem && totalCatExpenses > 0
    ? ((activeItem.value / totalCatExpenses) * 100).toFixed(1)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-8"
    >
      {/* Header with month nav */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Análise</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {MONTHS_PT[selMonth]} {selYear}
          </h1>
        </div>
        <div className="flex items-center gap-1 bg-white dark:bg-card border border-slate-100 dark:border-white/8 rounded-xl p-1">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-500 dark:text-slate-400">
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 px-2 min-w-[120px] text-center">
            {MONTHS_PT[selMonth].slice(0, 3)} {selYear}
          </span>
          <button onClick={nextMonth} disabled={isCurrentMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-500 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-card rounded-2xl px-5 py-4 border border-slate-100 dark:border-white/8 hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/20 transition-shadow cursor-default">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block w-1 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: stat.accent }} />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-50 leading-none mb-1">{stat.value}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-400 dark:text-slate-500">{stat.sub}</p>
              {stat.delta !== null && (
                <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${
                  (stat.goodWhenUp ? stat.delta >= 0 : stat.delta <= 0) ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  {stat.delta >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  {Math.abs(stat.delta).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-5 gap-5 mb-5">
        {/* Area chart */}
        <div className="col-span-3 bg-white dark:bg-card rounded-2xl p-6 border border-slate-100 dark:border-white/8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">Fluxo de Caixa</h2>
              <p className="text-xs text-slate-400 mt-0.5">Receitas vs Despesas ao longo do tempo</p>
            </div>
            <div className="flex items-center bg-slate-100 dark:bg-white/6 rounded-xl p-1 gap-0.5">
              {(['3M', '6M', '1A'] as Period[]).map((p) => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    period === p ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {period === p && <motion.span layoutId="periodBg" className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm" />}
                  <span className="relative z-10">{p}</span>
                </button>
              ))}
            </div>
          </div>

          {chartData.length < 2 ? (
            <div className="h-[240px] flex flex-col items-center justify-center gap-2 text-slate-400">
              <TrendingDown size={32} className="opacity-30" />
              <p className="text-sm">Dados insuficientes para o gráfico</p>
              <p className="text-xs opacity-60">Continue registrando transações para ver o histórico</p>
            </div>
          ) : (
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
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} tickFormatter={fmtK} width={44} />
                <Tooltip content={<AreaTooltip />} cursor={{ stroke: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)', strokeWidth: 1, strokeDasharray: '4 3' }} />
                <Area type="monotone" dataKey="income" name="Receitas" stroke="#22C55E" strokeWidth={hoveredSeries === 'expenses' ? 1.5 : 2} strokeOpacity={hoveredSeries === 'expenses' ? 0.3 : 1} fill="url(#incomeGrad)" fillOpacity={hoveredSeries === 'expenses' ? 0.3 : 1} dot={false} activeDot={{ r: 5, fill: '#22C55E', stroke: 'white', strokeWidth: 2 }} animationDuration={500} />
                <Area type="monotone" dataKey="expenses" name="Despesas" stroke="#EF4444" strokeWidth={hoveredSeries === 'income' ? 1.5 : 2} strokeOpacity={hoveredSeries === 'income' ? 0.3 : 1} fill="url(#expensesGrad)" fillOpacity={hoveredSeries === 'income' ? 0.3 : 1} dot={false} activeDot={{ r: 5, fill: '#EF4444', stroke: 'white', strokeWidth: 2 }} animationDuration={500} />
              </AreaChart>
            </ResponsiveContainer>
          )}

          <div className="flex items-center gap-5 mt-4 border-t border-slate-100 dark:border-white/6 pt-4">
            {[
              { key: 'income'   as const, color: '#22C55E', label: 'Receitas', value: monthIncome   },
              { key: 'expenses' as const, color: '#EF4444', label: 'Despesas', value: monthExpenses },
            ].map((s) => (
              <button key={s.key} onMouseEnter={() => setHoveredSeries(s.key)} onMouseLeave={() => setHoveredSeries(null)}
                className={`flex items-center gap-2 transition-opacity ${hoveredSeries && hoveredSeries !== s.key ? 'opacity-35' : 'opacity-100'}`}
              >
                <div className="w-6 h-0.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-slate-500 dark:text-slate-400">{s.label}</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{fmt(s.value)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pie chart */}
        <div className="col-span-2 bg-white dark:bg-card rounded-2xl p-6 border border-slate-100 dark:border-white/8 flex flex-col">
          <div className="mb-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">Por Categoria</h2>
            <p className="text-xs text-slate-400 mt-0.5">{activeItem ? activeItem.name : `Despesas de ${MONTHS_PT[selMonth]}`}</p>
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Package size={28} className="opacity-30" />
              <p className="text-xs text-center">Nenhuma despesa em {MONTHS_PT[selMonth]}</p>
            </div>
          ) : (
            <>
              <div className="relative">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={54} outerRadius={76} paddingAngle={3} dataKey="value" activeShape={ActiveShape} onMouseEnter={onPieEnter} onMouseLeave={onPieLeave} stroke="none" style={{ cursor: 'pointer' }}>
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={index} fill={entry.color} opacity={activeIndex === null || activeIndex === index ? 1 : 0.3} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <AnimatePresence mode="wait">
                    <motion.div key={activeIndex ?? 'total'} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.15 }} className="flex flex-col items-center">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-50">{activeItem ? fmt(activeItem.value) : fmt(totalCatExpenses)}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{activeItem ? `${activePct}%` : 'Total'}</span>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex flex-col gap-1 mt-auto pt-3 border-t border-slate-100 dark:border-white/6">
                {categoryBreakdown.map((cat, i) => {
                  const pct      = totalCatExpenses > 0 ? ((cat.value / totalCatExpenses) * 100).toFixed(0) : '0';
                  const isActive = activeIndex === i;
                  const isDimmed = activeIndex !== null && !isActive;
                  return (
                    <button key={cat.name} onMouseEnter={() => setActiveIndex(i)} onMouseLeave={() => setActiveIndex(null)}
                      className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded-lg transition-all ${isActive ? 'bg-slate-50 dark:bg-white/6' : 'hover:bg-slate-50 dark:hover:bg-white/5'} ${isDimmed ? 'opacity-35' : 'opacity-100'}`}
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-transform ${isActive ? 'scale-125' : ''}`} style={{ backgroundColor: cat.color }} />
                      <span className={`text-xs flex-1 truncate min-w-0 ${isActive ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>{cat.name}</span>
                      <AnimatePresence mode="wait">
                        {isActive ? (
                          <motion.span key="val" initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.1 }} className="text-xs font-bold text-slate-800 dark:text-slate-200 flex-shrink-0">{fmt(cat.value)}</motion.span>
                        ) : (
                          <motion.span key="pct" initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.1 }} className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">{pct}%</motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top expenses */}
      {topExpenses.length > 0 && (
        <div className="bg-white dark:bg-card rounded-2xl p-6 border border-slate-100 dark:border-white/8">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-1">Maiores gastos</h2>
          <p className="text-xs text-slate-400 mb-5">{MONTHS_PT[selMonth]} {selYear}</p>
          <div className="flex flex-col gap-4">
            {topExpenses.map((tx, i) => {
              const Icon = ICON_MAP[tx.icon] ?? Package;
              const pct  = monthExpenses > 0 ? (Math.abs(tx.amount) / monthExpenses) * 100 : 0;
              return (
                <div key={tx.id} className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-300 dark:text-slate-600 w-4 shrink-0">{i + 1}</span>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: tx.color + '20' }}>
                    <Icon size={15} style={{ color: tx.color }} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{tx.label}</p>
                      <p className="text-xs font-bold text-red-500 dark:text-red-400 shrink-0 ml-3">{fmt(Math.abs(tx.amount))}</p>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-white/8 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: i * 0.07, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: tx.color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
