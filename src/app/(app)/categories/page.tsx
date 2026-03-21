'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Lock, Check, X, Tag } from 'lucide-react';
import {
  ShoppingCart, Home, Car, Tv, Heart, TrendingUp, BarChart2,
  BookOpen, Package, Briefcase, Music, Zap, UtensilsCrossed,
  Dumbbell, Coffee, Plane, Gift, Smartphone, Shirt, Globe,
  Star, DollarSign, CreditCard, PiggyBank,
} from 'lucide-react';
import { useAppData } from '@/contexts/AppDataContext';
import { AVAILABLE_ICONS, AVAILABLE_COLORS, CategoryDef } from '@/data/categories';
import type { CustomCategory } from '@/contexts/AppDataContext';

const ALL_ICONS: Record<string, React.ElementType> = {
  ShoppingCart, Home, Car, Tv, Heart, TrendingUp, BarChart2,
  BookOpen, Package, Briefcase, Music, Zap, UtensilsCrossed,
  Dumbbell, Coffee, Plane, Gift, Smartphone, Shirt, Globe,
  Star, DollarSign, CreditCard, PiggyBank,
};

// ── Category card ─────────────────────────────────────────────────────────────
function CategoryCard({
  cat,
  onEdit,
  onDelete,
}: {
  cat: CategoryDef & { isCustom?: true };
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = ALL_ICONS[cat.icon] ?? Package;
  const isCustom = (cat as { isCustom?: boolean }).isCustom === true;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="group relative flex flex-col items-center gap-2.5 rounded-2xl border border-slate-100 bg-white p-4 dark:border-white/8 dark:bg-card"
    >
      <div
        className="flex h-11 w-11 items-center justify-center rounded-2xl"
        style={{ backgroundColor: cat.color + '28' }}
      >
        <Icon size={20} style={{ color: cat.color }} />
      </div>
      <span className="text-center text-xs font-medium text-slate-700 dark:text-slate-200 leading-tight">
        {cat.name}
      </span>

      {isCustom ? (
        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onEdit}
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-amber-100 hover:text-amber-600 dark:bg-white/8 dark:text-slate-400 dark:hover:bg-amber-500/20 dark:hover:text-amber-400"
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={onDelete}
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-red-100 hover:text-red-500 dark:bg-white/8 dark:text-slate-400 dark:hover:bg-red-500/20 dark:hover:text-red-400"
          >
            <Trash2 size={11} />
          </button>
        </div>
      ) : (
        <div className="absolute right-2 top-2">
          <Lock size={11} className="text-slate-300 dark:text-slate-600" />
        </div>
      )}
    </motion.div>
  );
}

// ── Add card ──────────────────────────────────────────────────────────────────
function AddCard({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-transparent p-4 text-slate-400 transition-colors hover:border-amber-400 hover:bg-amber-50 hover:text-amber-500 dark:border-white/10 dark:hover:border-amber-500/50 dark:hover:bg-amber-500/8 dark:hover:text-amber-400"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/6">
        <Plus size={18} />
      </div>
      <span className="text-xs font-medium">Nova categoria</span>
    </motion.button>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
interface ModalState {
  mode: 'create' | 'edit';
  type: 'expense' | 'income';
  name: string;
  icon: string;
  color: string;
  editingName?: string; // original name when editing
}

function CategoryModal({
  state,
  onChange,
  onSave,
  onClose,
}: {
  state: ModalState;
  onChange: (patch: Partial<ModalState>) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const PreviewIcon = ALL_ICONS[state.icon] ?? Package;

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        key="modal"
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="fixed inset-x-0 bottom-0 z-50 w-full rounded-t-3xl bg-white shadow-2xl dark:bg-[#181c27] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-120 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/6">
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <X size={17} className="text-slate-500 dark:text-slate-400" />
          </button>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {state.mode === 'create' ? 'Nova categoria' : 'Editar categoria'}
          </h2>
          <button
            onClick={onSave}
            disabled={!state.name.trim()}
            className="flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Check size={14} />
            Salvar
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          {/* Preview */}
          <div className="mb-5 flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              style={{ backgroundColor: state.color + '30' }}
            >
              <PreviewIcon size={26} style={{ color: state.color }} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                Nome
              </p>
              <input
                type="text"
                value={state.name}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="Ex: Streaming, Academia…"
                maxLength={40}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 dark:border-white/8 dark:bg-white/5 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-amber-500/60"
              />
            </div>
          </div>

          {/* Type selector — create mode only */}
          {state.mode === 'create' && (
            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Tipo
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onChange({ type: 'expense' })}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-all ${
                    state.type === 'expense'
                      ? 'border-red-400/40 bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400'
                      : 'border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/6 dark:text-slate-400 dark:hover:bg-white/10'
                  }`}
                >
                  Despesa
                </button>
                <button
                  onClick={() => onChange({ type: 'income' })}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-all ${
                    state.type === 'income'
                      ? 'border-emerald-400/40 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/6 dark:text-slate-400 dark:hover:bg-white/10'
                  }`}
                >
                  Receita
                </button>
              </div>
            </div>
          )}

          {/* Icon picker */}
          <div className="mb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Ícone
            </p>
            <div className="grid grid-cols-8 gap-2">
              {AVAILABLE_ICONS.map((iconName) => {
                const IconComp = ALL_ICONS[iconName] ?? Package;
                const isSelected = state.icon === iconName;
                return (
                  <button
                    key={iconName}
                    onClick={() => onChange({ icon: iconName })}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                      isSelected
                        ? 'ring-2 ring-offset-1 dark:ring-offset-[#181c27]'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/6 dark:text-slate-400 dark:hover:bg-white/10'
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: state.color + '28', color: state.color }
                        : {}
                    }
                  >
                    <IconComp size={16} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Cor
            </p>
            <div className="flex flex-wrap gap-2.5">
              {AVAILABLE_COLORS.map((color) => {
                const isSelected = state.color === color;
                return (
                  <button
                    key={color}
                    onClick={() => onChange({ color })}
                    className="relative flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                  >
                    {isSelected && (
                      <Check size={14} className="text-white drop-shadow" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
function CategorySection({
  title,
  type,
  cats,
  onAdd,
  onEdit,
  onDelete,
}: {
  title: string;
  type: 'expense' | 'income';
  cats: (CategoryDef & { isCustom?: true })[];
  onAdd: (type: 'expense' | 'income') => void;
  onEdit: (cat: CategoryDef & { isCustom?: true }) => void;
  onDelete: (name: string) => void;
}) {
  return (
    <div>
      <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        <AnimatePresence mode="popLayout">
          {cats.map((cat) => (
            <CategoryCard
              key={cat.name}
              cat={cat}
              onEdit={() => onEdit(cat)}
              onDelete={() => onDelete(cat.name)}
            />
          ))}
          <AddCard key="add" onClick={() => onAdd(type)} />
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
const defaultModalState: ModalState = {
  mode: 'create',
  type: 'expense',
  name: '',
  icon: 'Package',
  color: '#F59E0B',
};

export default function CategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useAppData();
  const [modal, setModal] = useState<ModalState | null>(null);

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense') as (CategoryDef & { isCustom?: true })[],
    [categories],
  );
  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === 'income') as (CategoryDef & { isCustom?: true })[],
    [categories],
  );

  function openCreate(type: 'expense' | 'income') {
    setModal({ ...defaultModalState, mode: 'create', type });
  }

  function openEdit(cat: CategoryDef & { isCustom?: true }) {
    setModal({
      mode: 'edit',
      type: (cat.type === 'both' ? 'expense' : cat.type) as 'expense' | 'income',
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      editingName: cat.name,
    });
  }

  function handleSave() {
    if (!modal || !modal.name.trim()) return;
    if (modal.mode === 'create') {
      addCategory({ name: modal.name.trim(), icon: modal.icon, color: modal.color, type: modal.type });
    } else {
      updateCategory(modal.editingName!, {
        name: modal.name.trim(),
        icon: modal.icon,
        color: modal.color,
      });
    }
    setModal(null);
  }

  function handleDelete(name: string) {
    deleteCategory(name);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15">
            <Tag size={18} className="text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Categorias</h1>
        </div>
        <p className="ml-12 text-sm text-slate-500 dark:text-slate-400">
          Gerencie as categorias de despesas e receitas
        </p>
      </motion.div>

      {/* Sections */}
      <div className="flex flex-col gap-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <CategorySection
            title="Despesas"
            type="expense"
            cats={expenseCategories}
            onAdd={openCreate}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <CategorySection
            title="Receitas"
            type="income"
            cats={incomeCategories}
            onAdd={openCreate}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        </motion.div>
      </div>

      {/* Modal */}
      {modal && (
        <CategoryModal
          state={modal}
          onChange={(patch) => setModal((prev) => prev ? { ...prev, ...patch } : prev)}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
