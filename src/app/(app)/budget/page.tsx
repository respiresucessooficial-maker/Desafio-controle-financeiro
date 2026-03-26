'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Plus, Pencil, Trash2, AlertTriangle, CheckCircle, XCircle,
  X, Check,
  ShoppingCart, Home, Car, Tv, Heart, BarChart2, Package, BookOpen,
  TrendingUp, Briefcase, Music, Zap, UtensilsCrossed, Dumbbell, Coffee,
  Plane, Gift, Smartphone, Shirt, Globe, Star, DollarSign, CreditCard, PiggyBank,
} from 'lucide-react';
import { useAppData } from '@/contexts/AppDataContext';
import { getCategoryDef } from '@/data/categories';
import { useFabAction } from '@/contexts/FabContext';
import BudgetDetailDrawer from '@/components/budget/BudgetDetailDrawer';
import Select from '@/components/ui/Select';
import { Budget } from '@/types';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/currencyInput';

const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingCart, Home, Car, Tv, Heart, BarChart2, Package, BookOpen,
  TrendingUp, Briefcase, Music, Zap, UtensilsCrossed, Dumbbell, Coffee,
  Plane, Gift, Smartphone, Shirt, Globe, Star, DollarSign, CreditCard, PiggyBank,
};

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

/* ── Modal compacto para "Definir limite" de uma categoria já escolhida ── */
function SetLimitModal({
  category,
  onClose,
}: {
  category: string | null;
  onClose: () => void;
}) {
  const { setBudget, categories } = useAppData();
  const [limit, setLimit] = useState('');

  useEffect(() => {
    if (category) setLimit('');
  }, [category]);

  if (!category) return null;
  const selectedCategory = category;

  const catDef = categories.find((c) => c.name === selectedCategory) ?? getCategoryDef(selectedCategory);
  const Icon = ICON_MAP[catDef.icon] ?? Package;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = parseCurrencyInput(limit);
    if (isNaN(v) || v <= 0) return;
    setBudget({ category: selectedCategory, limit: v, color: catDef.color });
    onClose();
  }

  return (
    <AnimatePresence>
      {category && (
        <>
          <motion.div
            key="sl-bd"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            key="sl-m"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-90 bg-white dark:bg-card rounded-2xl shadow-2xl p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">Definir limite</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Categoria (somente leitura) */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/5 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: catDef.color + '22' }}>
                <Icon size={17} style={{ color: catDef.color }} />
              </div>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{selectedCategory}</span>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">
                  Limite mensal (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={limit}
                  onChange={(e) => setLimit(formatCurrencyInput(e.target.value))}
                  placeholder="0,00"
                  autoFocus
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-50 text-lg font-bold focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-2xl font-bold text-white bg-amber-500 hover:bg-amber-600 flex items-center justify-center gap-2 shadow-lg mt-1 transition-colors"
              >
                <Check size={16} />
                Criar orçamento
              </motion.button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Modal completo para criar/editar orçamento ── */
function BudgetFormModal({
  isOpen,
  onClose,
  initialCategory,
  initialLimit,
  isEditing,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
  initialLimit?: number;
  isEditing?: boolean;
}) {
  const { setBudget, budgets, categories } = useAppData();

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense' || c.type === 'both'),
    [categories],
  );

  const [category, setCategory] = useState(initialCategory ?? expenseCategories[0]?.name ?? '');
  const [limit, setLimit] = useState(initialLimit ? formatCurrencyInput(String(Math.round(initialLimit * 100))) : '');

  useEffect(() => {
    if (!isOpen) return;
    setCategory(initialCategory ?? expenseCategories[0]?.name ?? '');
    setLimit(initialLimit ? formatCurrencyInput(String(Math.round(initialLimit * 100))) : '');
  }, [isOpen, initialCategory, initialLimit]);

  const usedCategories = budgets.map((b) => b.category);
  const selectable = isEditing
    ? expenseCategories
    : expenseCategories.filter((c) => !usedCategories.includes(c.name));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = parseCurrencyInput(limit);
    if (isNaN(v) || v <= 0) return;
    const catDef = categories.find((c) => c.name === category);
    setBudget({ category, limit: v, color: catDef?.color ?? '#6B7280' });
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="bd"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            key="bm"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[380px] bg-white dark:bg-card rounded-2xl shadow-2xl p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                {isEditing ? 'Editar limite' : 'Definir orçamento'}
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Categoria — select customizado */}
              <Select
                label="Categoria"
                value={category}
                onChange={setCategory}
                disabled={isEditing}
                options={selectable.map((c) => ({ value: c.name, label: c.name, color: c.color }))}
              />

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">
                  Limite mensal (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={limit}
                  onChange={(e) => setLimit(formatCurrencyInput(e.target.value))}
                  placeholder="0,00"
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-50 text-lg font-bold focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-2xl font-bold text-white bg-amber-500 hover:bg-amber-600 flex items-center justify-center gap-2 shadow-lg mt-1 transition-colors"
              >
                <Check size={16} />
                {isEditing ? 'Salvar' : 'Criar orçamento'}
              </motion.button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Página principal ── */
export default function BudgetPage() {
  const { transactions, budgets, deleteBudget, categories } = useAppData();
  const [modalOpen, setModalOpen]   = useState(false);
  const [editBudget, setEditBudget] = useState<{ category: string; limit: number } | null>(null);
  const [detailBudget, setDetailBudget] = useState<Budget | null>(null);
  const [limitCat, setLimitCat]     = useState<string | null>(null);

  useFabAction({ label: 'Novo orçamento', onClick: () => { setEditBudget(null); setModalOpen(true); } });

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense' || c.type === 'both'),
    [categories],
  );

  const now = new Date();

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.type === 'expense') {
        const d = new Date(t.date + 'T00:00:00');
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
          map[t.category] = (map[t.category] ?? 0) + Math.abs(t.amount);
        }
      }
    });
    return map;
  }, [transactions, now.getMonth(), now.getFullYear()]);

  const totalBudgeted = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent    = budgets.reduce((s, b) => s + (spentByCategory[b.category] ?? 0), 0);

  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(now);

  // Categorias com gastos mas sem orçamento definido
  const unusedCategories = Object.entries(spentByCategory)
    .filter(([cat]) => !budgets.find((b) => b.category === cat))
    .sort((a, b) => b[1] - a[1]);

  function getCatDef(name: string) {
    return categories.find((c) => c.name === name) ?? getCategoryDef(name);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-8"
    >
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
            {monthLabel}
          </p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Orçamentos</h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={() => { setEditBudget(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-lg transition-colors"
        >
          <Plus size={16} />
          Novo orçamento
        </motion.button>
      </div>

      {/* Overview */}
      <div className="bg-white dark:bg-card rounded-2xl p-6 border border-slate-100 dark:border-white/8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Visão geral</p>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 mt-0.5">
              {fmt(totalSpent)} <span className="text-slate-400 font-medium text-sm">/ {fmt(totalBudgeted)}</span>
            </h2>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 mb-1">Disponível</p>
            <p className={`text-lg font-bold ${totalBudgeted - totalSpent < 0 ? 'text-red-500' : 'text-green-600'}`}>
              {fmt(totalBudgeted - totalSpent)}
            </p>
          </div>
        </div>
        <div className="h-3 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (totalSpent / (totalBudgeted || 1)) * 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              totalSpent / (totalBudgeted || 1) >= 1 ? 'bg-red-500'
              : totalSpent / (totalBudgeted || 1) >= 0.8 ? 'bg-amber-400'
              : 'bg-green-500'
            }`}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {budgets.length > 0
            ? `${Math.round((totalSpent / (totalBudgeted || 1)) * 100)}% do orçamento total utilizado`
            : 'Nenhum orçamento definido ainda'}
        </p>
      </div>

      {/* Lista de orçamentos */}
      {budgets.length === 0 ? (
        <div className="bg-white dark:bg-card rounded-2xl p-10 border border-slate-100 dark:border-white/8 flex flex-col items-center text-center mb-6">
          <Target size={40} className="text-slate-300 dark:text-slate-600 mb-3" />
          <p className="font-semibold text-slate-500 dark:text-slate-400">Nenhum orçamento definido</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Defina limites por categoria para controlar seus gastos mensais
          </p>
          <button
            onClick={() => { setEditBudget(null); setModalOpen(true); }}
            className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 text-sm font-semibold hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
          >
            Criar primeiro orçamento
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-6">
          {budgets.map((budget, i) => {
            const spent  = spentByCategory[budget.category] ?? 0;
            const ratio  = spent / budget.limit;
            const pct    = Math.min(100, Math.round(ratio * 100));
            const status = ratio >= 1 ? 'exceeded' : ratio >= 0.8 ? 'warning' : 'normal';
            const catDef = getCatDef(budget.category);
            const Icon   = ICON_MAP[catDef.icon] ?? Package;

            return (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setDetailBudget(budget)}
                className="group bg-white dark:bg-card rounded-2xl p-5 border border-slate-100 dark:border-white/8 cursor-pointer hover:border-slate-200 dark:hover:border-white/15 transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: budget.color + '18' }}
                  >
                    <Icon size={18} style={{ color: budget.color }} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{budget.category}</p>
                    <p className="text-xs text-slate-400">{fmt(spent)} de {fmt(budget.limit)}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                    status === 'exceeded' ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                    : status === 'warning'  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    : 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                  }`}>
                    {status === 'exceeded' ? <XCircle size={12} /> : status === 'warning' ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                    {status === 'exceeded' ? 'Excedido' : status === 'warning' ? 'Atenção' : 'Normal'}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditBudget({ category: budget.category, limit: budget.limit }); setModalOpen(true); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteBudget(budget.category); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="h-2.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut', delay: i * 0.05 }}
                    className={`h-full rounded-full ${
                      status === 'exceeded' ? 'bg-red-500' : status === 'warning' ? 'bg-amber-400' : 'bg-green-500'
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-slate-400">
                    Restam <span className={`font-semibold ${budget.limit - spent < 0 ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>{fmt(Math.max(0, budget.limit - spent))}</span>
                  </p>
                  <p className={`text-xs font-bold ${
                    status === 'exceeded' ? 'text-red-500' : status === 'warning' ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400'
                  }`}>{pct}%</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Categorias sem limite */}
      {unusedCategories.length > 0 && (
        <div className="bg-white dark:bg-card rounded-2xl p-5 border border-slate-100 dark:border-white/8">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-4">
            Categorias sem limite definido
          </h3>
          <div className="flex flex-col gap-2">
            {unusedCategories.map(([cat, spent]) => {
              const catDef = getCatDef(cat);
              const Icon   = ICON_MAP[catDef.icon] ?? Package;
              return (
                <div key={cat} className="flex items-center gap-3 py-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: catDef.color + '18' }}
                  >
                    <Icon size={15} style={{ color: catDef.color }} strokeWidth={2} />
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex-1">{cat}</p>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mr-3">{fmt(spent)}</p>
                  <button
                    onClick={() => setLimitCat(cat)}
                    className="text-xs font-semibold text-amber-500 hover:text-amber-600 px-2.5 py-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                  >
                    Definir limite
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: definir limite rápido de categoria sem orçamento */}
      <SetLimitModal
        category={limitCat}
        onClose={() => setLimitCat(null)}
      />

      {/* Modal: criar / editar orçamento completo */}
      <BudgetFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditBudget(null); }}
        initialCategory={
          editBudget?.category ??
          expenseCategories.find((c) => !budgets.find((b) => b.category === c.name))?.name ??
          expenseCategories[0]?.name
        }
        initialLimit={editBudget?.limit}
        isEditing={!!editBudget}
      />

      <BudgetDetailDrawer
        budget={detailBudget}
        transactions={transactions}
        onClose={() => setDetailBudget(null)}
        onEdit={(b) => {
          setDetailBudget(null);
          setEditBudget({ category: b.category, limit: b.limit });
          setModalOpen(true);
        }}
        onDelete={(category) => {
          setDetailBudget(null);
          deleteBudget(category);
        }}
      />
    </motion.div>
  );
}
