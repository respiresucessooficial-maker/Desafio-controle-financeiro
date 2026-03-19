'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Pencil, Trash2,
  Shield, Plane, TrendingUp, Target, Home, Car, Briefcase,
  GraduationCap, Heart, Palmtree,
  Plus, Check,
} from 'lucide-react';
import { Goal } from '@/types';
import { useAppData } from '@/contexts/AppDataContext';

const iconMap: Record<string, React.ElementType> = {
  Shield, Plane, TrendingUp, Target, Home, Car,
  Briefcase, GraduationCap, Heart, Palmtree,
};

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface Props {
  goal: Goal | null;
  onClose: () => void;
  onEdit: (g: Goal) => void;
  onDelete: (id: string) => void;
}

export default function GoalDetailDrawer({ goal, onClose, onEdit, onDelete }: Props) {
  const { updateGoal } = useAppData();
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositValue, setDepositValue] = useState('');
  const [depositMode, setDepositMode] = useState<'add' | 'set'>('add');

  if (!goal) return null;

  const Icon = iconMap[goal.icon] ?? Target;
  const pct = Math.min(100, (goal.current / goal.target) * 100);
  const remaining = Math.max(0, goal.target - goal.current);
  const done = goal.current >= goal.target;

  function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    if (!goal) return;
    const v = parseFloat(depositValue.replace(',', '.'));
    if (isNaN(v) || v < 0) return;
    const newCurrent = depositMode === 'add'
      ? Math.min(goal.target, goal.current + v)
      : Math.min(goal.target, v);
    updateGoal(goal.id, { current: newCurrent });
    setDepositValue('');
    setDepositOpen(false);
  }

  return (
    <AnimatePresence>
      {goal && (
        <>
          {/* Backdrop */}
          <motion.div
            key="gdd-bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.aside
            key="gdd-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 h-full w-[400px] bg-white dark:bg-card shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Colored header */}
            <div
              className="px-6 pt-6 pb-5 flex-shrink-0"
              style={{ backgroundColor: goal.color + '12' }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Detalhe da meta
                </span>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-white/70 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:bg-white dark:hover:bg-white/20 transition-colors"
                >
                  <X size={15} />
                </motion.button>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: goal.color + '22' }}
                >
                  <Icon size={24} style={{ color: goal.color }} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 truncate">{goal.name}</h2>
                  {goal.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{goal.description}</p>
                  )}
                </div>
              </div>

              {/* Big progress */}
              <div className="flex items-end justify-between mb-2">
                <div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{fmt(goal.current)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">de {fmt(goal.target)}</p>
                </div>
                <p
                  className="text-2xl font-bold pb-1"
                  style={{ color: goal.color }}
                >
                  {pct.toFixed(1)}%
                </p>
              </div>

              <div className="h-3 bg-white/30 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: goal.color }}
                />
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Já guardado',  value: fmt(goal.current),    color: 'text-slate-900 dark:text-slate-50' },
                  { label: 'Faltam',       value: done ? '—' : fmt(remaining), color: done ? 'text-green-600' : 'text-slate-700 dark:text-slate-200' },
                  { label: 'Objetivo',     value: fmt(goal.target),     color: 'text-slate-900 dark:text-slate-50' },
                  { label: 'Progresso',    value: `${pct.toFixed(1)}%`, color: 'text-slate-700 dark:text-slate-200' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                    <p className={`text-base font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Status */}
              {done ? (
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20">
                  <Check size={16} className="text-green-500 flex-shrink-0" />
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                    Meta atingida! Parabéns!
                  </p>
                </div>
              ) : (
                <div
                  className="px-4 py-3 rounded-2xl border text-sm text-slate-600 dark:text-slate-300"
                  style={{ backgroundColor: goal.color + '0d', borderColor: goal.color + '30' }}
                >
                  <p className="font-semibold" style={{ color: goal.color }}>
                    Faltam {fmt(remaining)}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Guardando R$ 500/mês você atingiria a meta em{' '}
                    <strong className="text-slate-600 dark:text-slate-300">
                      {Math.ceil(remaining / 500)} {Math.ceil(remaining / 500) === 1 ? 'mês' : 'meses'}
                    </strong>
                  </p>
                </div>
              )}

              {/* Deposit section */}
              <div>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDepositOpen((v) => !v)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: goal.color + '18',
                    color: goal.color,
                  }}
                >
                  <Plus size={15} />
                  Registrar aporte
                </motion.button>

                <AnimatePresence>
                  {depositOpen && (
                    <motion.form
                      onSubmit={handleDeposit}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 flex flex-col gap-2">
                        {/* Mode toggle */}
                        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-white/10 rounded-xl">
                          {(['add', 'set'] as const).map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setDepositMode(m)}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                depositMode === m
                                  ? 'bg-white dark:bg-white/20 text-slate-800 dark:text-slate-100 shadow-sm'
                                  : 'text-slate-400'
                              }`}
                            >
                              {m === 'add' ? 'Adicionar valor' : 'Definir total'}
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={depositValue}
                            onChange={(e) => setDepositValue(e.target.value)}
                            placeholder="R$ 0,00"
                            required
                            className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                          />
                          <motion.button
                            type="submit"
                            whileTap={{ scale: 0.95 }}
                            className="px-4 rounded-2xl text-sm font-bold text-white transition-colors"
                            style={{ backgroundColor: goal.color }}
                          >
                            <Check size={16} />
                          </motion.button>
                        </div>
                        <p className="text-[10px] text-slate-400 text-center">
                          {depositMode === 'add'
                            ? 'O valor será somado ao total já guardado'
                            : 'O total guardado será atualizado para esse valor'}
                        </p>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-white/8 flex gap-2 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { onClose(); onEdit(goal); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/10 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors"
              >
                <Pencil size={14} />
                Editar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { onClose(); onDelete(goal.id); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-red-50 dark:bg-red-500/10 text-sm font-semibold text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
              >
                <Trash2 size={14} />
                Excluir
              </motion.button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
