'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Plane, TrendingUp, Plus, Target, Home, Car, Briefcase,
  GraduationCap, Heart, Palmtree, Pencil, Trash2, X, Check, CheckCircle2,
} from 'lucide-react';
import { useAppData } from '@/contexts/AppDataContext';
import { useFabAction } from '@/contexts/FabContext';
import { Goal } from '@/types';
import GoalDetailDrawer from '@/components/goals/GoalDetailDrawer';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/currencyInput';

const ICON_OPTIONS = [
  { value: 'Shield',       label: 'Reserva',       Icon: Shield },
  { value: 'Plane',        label: 'Viagem',         Icon: Plane },
  { value: 'TrendingUp',   label: 'Investimento',   Icon: TrendingUp },
  { value: 'Target',       label: 'Meta',           Icon: Target },
  { value: 'Home',         label: 'Imóvel',         Icon: Home },
  { value: 'Car',          label: 'Veículo',        Icon: Car },
  { value: 'Briefcase',    label: 'Negócio',        Icon: Briefcase },
  { value: 'GraduationCap',label: 'Educação',       Icon: GraduationCap },
  { value: 'Heart',        label: 'Saúde',          Icon: Heart },
  { value: 'Palmtree',     label: 'Aposentadoria',  Icon: Palmtree },
];

const COLOR_OPTIONS = [
  '#EF4444', '#F59E0B', '#22C55E', '#3B82F6',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
];

const iconMap: Record<string, React.ElementType> = Object.fromEntries(
  ICON_OPTIONS.map(({ value, Icon }) => [value, Icon])
);

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// ── Modal ────────────────────────────────────────────────────────────────────
function GoalFormModal({
  isOpen,
  onClose,
  editGoal,
}: {
  isOpen: boolean;
  onClose: () => void;
  editGoal?: Goal | null;
}) {
  const { addGoal, updateGoal } = useAppData();
  const [name, setName]           = useState(editGoal?.name ?? '');
  const [description, setDesc]    = useState(editGoal?.description ?? '');
  const [target, setTarget]       = useState(editGoal ? formatCurrencyInput(String(editGoal.target)) : '');
  const [current, setCurrent]     = useState(editGoal ? formatCurrencyInput(String(editGoal.current)) : formatCurrencyInput('0'));
  const [icon, setIcon]           = useState(editGoal?.icon ?? 'Target');
  const [color, setColor]         = useState(editGoal?.color ?? '#F59E0B');

  // sync fields when editGoal changes (reopen)
  const isEditing = !!editGoal;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = parseCurrencyInput(target);
    const c = parseCurrencyInput(current);
    if (isNaN(t) || t <= 0) return;
    if (isEditing) {
      updateGoal(editGoal.id, { name, description, target: t, current: Math.max(0, isNaN(c) ? 0 : c), icon, color });
    } else {
      addGoal({
        name,
        description,
        target: t,
        current: Math.max(0, isNaN(c) ? 0 : c),
        icon,
        color,
        history: [],
      });
    }
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="gbd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            key="gbm"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[420px] bg-white dark:bg-card rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                {isEditing ? 'Editar meta' : 'Nova meta financeira'}
              </h3>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
              >
                <X size={16} />
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">
                  Nome da meta
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Reserva de emergência"
                  required
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">
                  Descrição
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Ex: 6 meses de gastos mensais"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">
                    Valor objetivo (R$)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={target}
                    onChange={(e) => setTarget(formatCurrencyInput(e.target.value))}
                    placeholder="0,00"
                    required
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">
                    Já guardado (R$)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={current}
                    onChange={(e) => setCurrent(formatCurrencyInput(e.target.value))}
                    placeholder="0,00"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              {/* Icon */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">
                  Ícone
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {ICON_OPTIONS.map(({ value, label, Icon }) => (
                    <motion.button
                      key={value}
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIcon(value)}
                      title={label}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-colors ${
                        icon === value
                          ? 'border-amber-400 bg-amber-50 dark:bg-amber-500/10'
                          : 'border-slate-200 dark:border-white/10 hover:border-amber-300 hover:bg-slate-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <Icon size={18} className={icon === value ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400'} />
                      <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-tight text-center">{label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">
                  Cor
                </label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_OPTIONS.map((c) => (
                    <motion.button
                      key={c}
                      type="button"
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-2xl font-bold text-white bg-amber-500 hover:bg-amber-600 flex items-center justify-center gap-2 shadow-lg mt-1 transition-colors"
              >
                <Check size={16} />
                {isEditing ? 'Salvar alterações' : 'Criar meta'}
              </motion.button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function GoalsPage() {
  const { goals, deleteGoal } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const detailGoal = detailGoalId ? goals.find((goal) => goal.id === detailGoalId) ?? null : null;

  useFabAction({ label: 'Nova meta', onClick: () => { setEditGoal(null); setModalOpen(true); } });

  function openEdit(g: Goal) {
    setEditGoal(g);
    setModalOpen(true);
  }

  function handleDelete(id: string) {
    if (confirmDelete === id) {
      deleteGoal(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
              Planejamento
            </p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Metas Financeiras</h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setEditGoal(null); setModalOpen(true); }}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-lg transition-colors"
          >
            <Plus size={16} />
            Nova meta
          </motion.button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-card rounded-2xl p-5 border border-slate-100 dark:border-white/8">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Total investido</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {fmt(goals.reduce((s, g) => s + g.current, 0))}
            </p>
          </div>
          <div className="bg-white dark:bg-card rounded-2xl p-5 border border-slate-100 dark:border-white/8">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Objetivo total</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {fmt(goals.reduce((s, g) => s + g.target, 0))}
            </p>
          </div>
          <div className="bg-white dark:bg-card rounded-2xl p-5 border border-slate-100 dark:border-white/8">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Metas ativas</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{goals.length}</p>
          </div>
        </div>

        {/* Empty state */}
        {goals.length === 0 && (
          <div className="bg-white dark:bg-card rounded-2xl p-12 border border-slate-100 dark:border-white/8 flex flex-col items-center text-center">
            <Target size={44} className="text-slate-300 dark:text-slate-600 mb-3" />
            <p className="font-semibold text-slate-500 dark:text-slate-400">Nenhuma meta criada</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Defina objetivos financeiros para acompanhar seu progresso</p>
            <button
              onClick={() => { setEditGoal(null); setModalOpen(true); }}
              className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 text-sm font-semibold hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
            >
              Criar primeira meta
            </button>
          </div>
        )}

        {/* Goals list */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-4"
        >
          {goals.map((goal) => {
            const Icon = iconMap[goal.icon] ?? Target;
            const pct = Math.min((goal.current / goal.target) * 100, 100);
            const remaining = goal.target - goal.current;
            const isConfirming = confirmDelete === goal.id;
            const isDone = remaining <= 0;

            return (
              <motion.div
                key={goal.id}
                variants={itemVariants}
                onClick={() => setDetailGoalId(goal.id)}
                className="group bg-white dark:bg-card rounded-2xl p-6 border border-slate-100 dark:border-white/8 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-start gap-4">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: goal.color + '18' }}
                        >
                          <Icon size={24} style={{ color: goal.color }} strokeWidth={2} />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">{goal.name}</h3>
                            {isDone && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                <CheckCircle2 size={14} />
                                Meta atingida
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{goal.description}</p>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); openEdit(goal); }}
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
                                onClick={(e) => { e.stopPropagation(); handleDelete(goal.id); }}
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
                                onClick={(e) => { e.stopPropagation(); handleDelete(goal.id); }}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={14} />
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="text-right">
                          <div className="ml-auto inline-flex flex-col items-end rounded-2xl bg-slate-50 px-4 py-2 dark:bg-white/5">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                              Valor guardado
                            </p>
                            <p className="text-xl font-bold text-slate-900 dark:text-slate-50">
                              {fmt(goal.current)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold" style={{ color: goal.color }}>
                          {pct.toFixed(1)}%
                        </span>
                        {!isDone ? (
                          <span className="text-xs text-slate-400">
                            Faltam {fmt(remaining)}
                          </span>
                        ) : <span />}
                      </div>
                      <div className="h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-white/10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: goal.color }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>

      <GoalFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditGoal(null); }}
        editGoal={editGoal}
      />

      {detailGoal && (
        <GoalDetailDrawer
          goal={detailGoal}
          onClose={() => setDetailGoalId(null)}
          onEdit={(g) => { setDetailGoalId(null); openEdit(g); }}
          onDelete={(id) => { setDetailGoalId(null); handleDelete(id); }}
        />
      )}
    </>
  );
}
