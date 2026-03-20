'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Pencil,
  Trash2,
  Shield,
  Plane,
  TrendingUp,
  Target,
  Home,
  Car,
  Briefcase,
  GraduationCap,
  Heart,
  Palmtree,
  Plus,
  Check,
  History,
} from 'lucide-react';
import { Goal, GoalContribution } from '@/types';
import { useAppData } from '@/contexts/AppDataContext';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/currencyInput';

const iconMap: Record<string, React.ElementType> = {
  Shield,
  Plane,
  TrendingUp,
  Target,
  Home,
  Car,
  Briefcase,
  GraduationCap,
  Heart,
  Palmtree,
};

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface Props {
  goal: Goal;
  onClose: () => void;
  onEdit: (g: Goal) => void;
  onDelete: (id: string) => void;
}

export default function GoalDetailDrawer({ goal, onClose, onEdit, onDelete }: Props) {
  const { updateGoal } = useAppData();
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositValue, setDepositValue] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!successMessage && !errorMessage) return;
    const timer = window.setTimeout(() => {
      setSuccessMessage('');
      setErrorMessage('');
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [successMessage, errorMessage]);

  const Icon = iconMap[goal.icon] ?? Target;
  const pct = Math.min(100, (goal.current / goal.target) * 100);
  const remaining = Math.max(0, goal.target - goal.current);
  const done = goal.current >= goal.target;
  const history = [...(goal.history ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseCurrencyInput(depositValue);
    if (isNaN(value) || value <= 0) return;
    if (remaining <= 0) {
      setSuccessMessage('');
      setErrorMessage('Essa meta ja foi atingida. Nao e possivel adicionar mais valores.');
      return;
    }
    if (value > remaining) {
      setSuccessMessage('');
      setErrorMessage(`O aporte maximo agora e ${fmt(remaining)}.`);
      return;
    }

    const contribution: GoalContribution = {
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      amount: value,
      createdAt: new Date().toISOString(),
    };

    updateGoal(goal.id, {
      current: goal.current + value,
      history: [contribution, ...(goal.history ?? [])],
    });

    setDepositValue('');
    setDepositOpen(false);
    setErrorMessage('');
    setSuccessMessage(`Aporte de ${fmt(value)} adicionado com sucesso.`);
  }

  return (
    <AnimatePresence>
      {goal && (
        <>
          <motion.div
            key="gdd-bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />

          <motion.aside
            key="gdd-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 z-50 flex h-full w-[400px] flex-col overflow-hidden bg-white shadow-2xl dark:bg-card"
          >
            <div
              className="flex-shrink-0 px-6 pb-5 pt-6"
              style={{ backgroundColor: `${goal.color}12` }}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Detalhe da meta
                </span>
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 text-slate-500 transition-colors hover:bg-white dark:bg-white/10 dark:hover:bg-white/20"
                >
                  <X size={15} />
                </motion.button>
              </div>

              <div className="mb-5 flex items-center gap-3">
                <div
                  className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${goal.color}22` }}
                >
                  <Icon size={24} style={{ color: goal.color }} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold text-slate-900 dark:text-slate-50">
                    {goal.name}
                  </h2>
                  {goal.description && (
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {goal.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-2 flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                    {fmt(goal.current)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">de {fmt(goal.target)}</p>
                </div>
                <p className="pb-1 text-2xl font-bold" style={{ color: goal.color }}>
                  {pct.toFixed(1)}%
                </p>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-white/30 dark:bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: goal.color }}
                />
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
              <AnimatePresence>
                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400"
                  >
                    {successMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400"
                  >
                    {errorMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Ja guardado', value: fmt(goal.current), color: 'text-slate-900 dark:text-slate-50' },
                  { label: 'Faltam', value: done ? '-' : fmt(remaining), color: done ? 'text-green-600' : 'text-slate-700 dark:text-slate-200' },
                  { label: 'Objetivo', value: fmt(goal.target), color: 'text-slate-900 dark:text-slate-50' },
                  { label: 'Progresso', value: `${pct.toFixed(1)}%`, color: 'text-slate-700 dark:text-slate-200' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      {label}
                    </p>
                    <p className={`text-base font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {done ? (
                <div className="flex items-center gap-2 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 dark:border-green-500/20 dark:bg-green-500/10">
                  <Check size={16} className="flex-shrink-0 text-green-500" />
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                    Meta atingida! Parabens!
                  </p>
                </div>
              ) : (
                <div
                  className="rounded-2xl border px-4 py-3 text-sm text-slate-600 dark:text-slate-300"
                  style={{ backgroundColor: `${goal.color}0d`, borderColor: `${goal.color}30` }}
                >
                  <p className="font-semibold" style={{ color: goal.color }}>
                    Faltam {fmt(remaining)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Guardando R$ 500 por mes voce atingiria a meta em{' '}
                    <strong className="text-slate-600 dark:text-slate-300">
                      {Math.ceil(remaining / 500)} {Math.ceil(remaining / 500) === 1 ? 'mes' : 'meses'}
                    </strong>
                  </p>
                </div>
              )}

              <div>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDepositOpen((value) => !value)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-semibold transition-colors"
                  style={{ backgroundColor: `${goal.color}18`, color: goal.color }}
                >
                  <Plus size={15} />
                  Adicionar valor
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
                      <div className="flex flex-col gap-2 pt-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={depositValue}
                            onChange={(e) => {
                              setDepositValue(formatCurrencyInput(e.target.value));
                              if (errorMessage) setErrorMessage('');
                            }}
                            placeholder="R$ 0,00"
                            required
                            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-colors focus:border-amber-400 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-slate-50"
                          />
                          <motion.button
                            type="submit"
                            whileTap={{ scale: 0.95 }}
                            className="rounded-2xl px-4 text-sm font-bold text-white transition-colors"
                            style={{ backgroundColor: goal.color }}
                          >
                            <Check size={16} />
                          </motion.button>
                        </div>
                        <p className="text-center text-[10px] text-slate-400">
                          Digite apenas numeros. O valor sera somado ao total ja guardado.
                        </p>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-white/8 dark:bg-white/5">
                <div className="mb-3 flex items-center gap-2">
                  <History size={15} className="text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Historico de valores
                  </h3>
                </div>

                {history.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    Nenhum valor adicionado ainda.
                  </p>
                ) : (
                  <div className="flex max-h-48 flex-col gap-2 overflow-y-auto pr-1">
                    {history.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between rounded-xl bg-white px-3 py-2 dark:bg-white/5"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {fmt(entry.amount)}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {new Intl.DateTimeFormat('pt-BR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            }).format(new Date(entry.createdAt))}
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                          Aporte
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-shrink-0 gap-2 border-t border-slate-100 px-6 py-4 dark:border-white/8">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  onClose();
                  onEdit(goal);
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
              >
                <Pencil size={14} />
                Editar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  onClose();
                  onDelete(goal.id);
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-50 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20"
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
