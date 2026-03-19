'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Pencil,
  Trash2,
  ShoppingCart,
  Home,
  Car,
  Tv,
  Heart,
  BarChart2,
  Package,
  Music,
  Zap,
  Cross,
  UtensilsCrossed,
  Briefcase,
  Dumbbell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { Transaction } from '@/types';
import { useAppData } from '@/contexts/AppDataContext';
import { CATEGORIES } from '@/data/categories';
import TransactionFormModal from '@/components/transactions/TransactionFormModal';
import TransactionDetailModal from '@/components/transactions/TransactionDetailModal';
import Select, { SelectOption } from '@/components/ui/Select';
import { useFabAction } from '@/contexts/FabContext';

const iconMap: Record<string, React.ElementType> = {
  ShoppingCart, Home, Car, Tv, Heart, BarChart2, Package, Music,
  Zap, Cross, UtensilsCrossed, Briefcase, Dumbbell, BookOpen,
  TrendingUp, TrendingDown, DollarSign,
};

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

type Period = 'week' | 'month' | 'all';

const PAGE_SIZE = 15;

const typeOptions: SelectOption[] = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'income', label: 'Receitas', color: '#22C55E' },
  { value: 'expense', label: 'Gastos', color: '#EF4444' },
];

const categoryOptions: SelectOption[] = [
  { value: '', label: 'Todas as categorias' },
  ...CATEGORIES.map((c) => ({ value: c.name, label: c.name, color: c.color })),
];

const periodLabels: Record<Period, string> = {
  week: 'Semana',
  month: 'Mês',
  all: 'Todos',
};

export default function TransactionsPage() {
  useFabAction({ label: 'Nova transação', onClick: () => { setEditTx(undefined); setIsModalOpen(true); } });
  const { transactions, deleteTransaction } = useAppData();

  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<Period>('month');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [page, setPage] = useState(1);
  const [editTx, setEditTx] = useState<Transaction | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailTx, setDetailTx] = useState<Transaction | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const activeFilterCount = [
    search !== '',
    typeFilter !== 'all',
    categoryFilter !== '',
    period !== 'month',
  ].filter(Boolean).length;

  const filtered = useMemo(() => {
    const now = new Date();
    return transactions
      .filter((t) => {
        const d = new Date(t.date + 'T00:00:00');
        if (period === 'week') {
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          if (d < weekAgo) return false;
        } else if (period === 'month') {
          if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear())
            return false;
        }
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;
        if (categoryFilter && t.category !== categoryFilter) return false;
        if (search && !t.label.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, period, typeFilter, categoryFilter, search]);

  const summary = useMemo(() => {
    const income = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
    return { income, expenses, balance: income - expenses };
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleEdit(tx: Transaction) {
    setEditTx(tx);
    setIsModalOpen(true);
  }

  function handleDelete(id: string) {
    if (confirmDelete === id) {
      deleteTransaction(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  }

  function resetFilters() {
    setSearch('');
    setPeriod('month');
    setCategoryFilter('');
    setTypeFilter('all');
    setPage(1);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-8"
    >
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
          Controle
        </p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Extrato</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Receitas', value: summary.income, color: '#22C55E', bg: '#F0FDF4', icon: TrendingUp },
          { label: 'Gastos', value: summary.expenses, color: '#EF4444', bg: '#FEF2F2', icon: TrendingDown },
          { label: 'Saldo', value: summary.balance, color: '#3B82F6', bg: '#EFF6FF', icon: DollarSign },
        ].map(({ label, value, color, bg, icon: Icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white dark:bg-card rounded-2xl p-5 border border-slate-100 dark:border-white/8"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: bg }}>
              <Icon size={16} style={{ color }} />
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
            <motion.p
              key={value}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-bold"
              style={{ color: label === 'Saldo' && value < 0 ? '#EF4444' : color }}
            >
              {fmt(label === 'Gastos' ? value : value)}
            </motion.p>
          </motion.div>
        ))}
      </div>

      {/* ── Filter panel ── */}
      <motion.div
        layout
        className={`bg-white dark:bg-card rounded-2xl border transition-all mb-4 ${
          activeFilterCount > 0
            ? 'border-amber-200 dark:border-amber-500/30'
            : 'border-slate-100 dark:border-white/10'
        }`}
      >
        {/* Filter header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Filtros</span>
            <AnimatePresence>
              {activeFilterCount > 0 && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold"
                >
                  {activeFilterCount}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {activeFilterCount > 0 && (
              <motion.button
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                onClick={resetFilters}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
              >
                <X size={12} />
                Limpar filtros
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Filter controls */}
        <div className="px-5 pb-5 flex flex-wrap gap-3 items-end">
          {/* Search */}
          <motion.div
            className="relative flex-1 min-w-[200px]"
            animate={{ width: searchFocused ? '100%' : undefined }}
          >
            <motion.div
              animate={{
                boxShadow: searchFocused
                  ? '0 0 0 3px rgba(245,158,11,0.15)'
                  : '0 0 0 0px transparent',
              }}
              className="rounded-xl"
            >
              <Search
                size={15}
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                  searchFocused ? 'text-amber-400' : 'text-slate-400'
                }`}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Buscar transação..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:border-amber-400 dark:focus:border-amber-400 transition-colors"
              />
            </motion.div>
          </motion.div>

          {/* Period toggle */}
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-white/10 rounded-xl">
            {(Object.keys(periodLabels) as Period[]).map((p) => (
              <motion.button
                key={p}
                onClick={() => { setPeriod(p); setPage(1); }}
                className="relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                animate={{
                  color: period === p ? '#1e293b' : '#94a3b8',
                }}
              >
                {period === p && (
                  <motion.div
                    layoutId="periodActive"
                    className="absolute inset-0 bg-white dark:bg-white/20 rounded-lg shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 dark:text-slate-200">{periodLabels[p]}</span>
              </motion.button>
            ))}
          </div>

          {/* Type select */}
          <Select
            size="sm"
            value={typeFilter}
            onChange={(v) => { setTypeFilter(v as typeof typeFilter); setPage(1); }}
            options={typeOptions}
            className="w-44"
          />

          {/* Category select */}
          <Select
            size="sm"
            value={categoryFilter}
            onChange={(v) => { setCategoryFilter(v); setPage(1); }}
            options={categoryOptions}
            className="w-52"
          />
        </div>

        {/* Active filter pills */}
        <AnimatePresence>
          {activeFilterCount > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 px-5 pb-4 border-t border-slate-50 dark:border-white/5 pt-3">
                {search && (
                  <FilterPill label={`"${search}"`} onRemove={() => setSearch('')} />
                )}
                {period !== 'month' && (
                  <FilterPill label={periodLabels[period]} onRemove={() => setPeriod('month')} />
                )}
                {typeFilter !== 'all' && (
                  <FilterPill
                    label={typeFilter === 'income' ? 'Receitas' : 'Gastos'}
                    color={typeFilter === 'income' ? '#22C55E' : '#EF4444'}
                    onRemove={() => setTypeFilter('all')}
                  />
                )}
                {categoryFilter && (
                  <FilterPill
                    label={categoryFilter}
                    color={CATEGORIES.find((c) => c.name === categoryFilter)?.color}
                    onRemove={() => setCategoryFilter('')}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Transaction list */}
      <div className="bg-white dark:bg-card rounded-2xl border border-slate-100 dark:border-white/8 overflow-hidden">
        {paginated.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-slate-400"
          >
            <Package size={40} className="mb-3 opacity-40" />
            <p className="font-semibold text-slate-500 dark:text-slate-400">Nenhuma transação encontrada</p>
            <p className="text-xs mt-1">Tente ajustar os filtros ou adicione uma transação</p>
          </motion.div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-white/5">
            <AnimatePresence initial={false}>
              {paginated.map((tx) => {
                const Icon = iconMap[tx.icon] ?? ShoppingCart;
                const isIncome = tx.type === 'income';
                const isConfirming = confirmDelete === tx.id;

                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10, height: 0, paddingTop: 0, paddingBottom: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setDetailTx(tx)}
                    className="group flex items-center gap-3 px-5 py-4 hover:bg-slate-50/80 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: tx.color + '18' }}
                    >
                      <Icon size={18} style={{ color: tx.color }} strokeWidth={2} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{tx.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {tx.category} · {formatDate(tx.date)}
                      </p>
                    </div>

                    <span
                      className={`text-sm font-bold flex-shrink-0 mr-2 ${
                        isIncome ? 'text-green-600' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {isIncome ? '+' : ''}
                      {fmt(tx.amount)}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); handleEdit(tx); }}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </motion.button>

                      <AnimatePresence mode="wait">
                        {isConfirming ? (
                          <motion.button
                            key="confirm"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); handleDelete(tx.id); }}
                            className="px-2.5 h-8 rounded-xl flex items-center gap-1 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
                          >
                            <Trash2 size={12} />
                            Confirmar
                          </motion.button>
                        ) : (
                          <motion.button
                            key="delete"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); handleDelete(tx.id); }}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-50 dark:border-white/5">
            <p className="text-xs text-slate-400">
              {filtered.length} transaç{filtered.length !== 1 ? 'ões' : 'ão'} ·{' '}
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <motion.button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                <ChevronLeft size={15} />
              </motion.button>
              <motion.button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                <ChevronRight size={15} />
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      <TransactionFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditTx(undefined); }}
        editTransaction={editTx}
      />

      {/* Detail modal */}
      <TransactionDetailModal
        transaction={detailTx}
        onClose={() => setDetailTx(null)}
        onEdit={(tx) => handleEdit(tx)}
        onDelete={(id) => { handleDelete(id); }}
      />
    </motion.div>
  );
}

// ── Filter pill chip ──
function FilterPill({
  label,
  color,
  onRemove,
}: {
  label: string;
  color?: string;
  onRemove: () => void;
}) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300"
    >
      {color && (
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      )}
      {label}
      <button
        onClick={onRemove}
        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
      >
        <X size={10} />
      </button>
    </motion.div>
  );
}
