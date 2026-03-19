'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Pencil, Trash2,
  ShoppingCart, Home, Car, Tv, Heart, BarChart2, Package,
  Music, Zap, Cross, UtensilsCrossed, Briefcase, Dumbbell,
  BookOpen, TrendingUp, TrendingDown, DollarSign,
  Calendar, Tag, ArrowUpRight, ArrowDownLeft, CreditCard, FileText,
} from 'lucide-react';
import { Transaction } from '@/types';
import { useAppData } from '@/contexts/AppDataContext';

const iconMap: Record<string, React.ElementType> = {
  ShoppingCart, Home, Car, Tv, Heart, BarChart2, Package, Music,
  Zap, Cross, UtensilsCrossed, Briefcase, Dumbbell, BookOpen,
  TrendingUp, TrendingDown, DollarSign,
};

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function formatDateLong(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  }).format(d);
}

interface Props {
  transaction: Transaction | null;
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export default function TransactionDetailModal({ transaction: tx, onClose, onEdit, onDelete }: Props) {
  const { banks } = useAppData();

  const bank = tx?.bankId ? banks.find((b) => b.id === tx.bankId) : null;
  const Icon = tx ? (iconMap[tx.icon] ?? ShoppingCart) : ShoppingCart;
  const isIncome = tx?.type === 'income';

  return (
    <AnimatePresence>
      {tx && (
        <>
          {/* Backdrop */}
          <motion.div
            key="txd-bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            key="txd-modal"
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[420px] max-h-[90vh] overflow-y-auto bg-white dark:bg-card rounded-3xl shadow-2xl"
          >
            {/* Colored top banner */}
            <div
              className="relative flex flex-col items-center pt-8 pb-6 px-6 rounded-t-3xl"
              style={{ backgroundColor: tx.color + '15' }}
            >
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/60 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:bg-white dark:hover:bg-white/20 transition-colors"
              >
                <X size={15} />
              </motion.button>

              {/* Icon */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-lg"
                style={{ backgroundColor: tx.color + '25' }}
              >
                <Icon size={28} style={{ color: tx.color }} strokeWidth={2} />
              </div>

              {/* Label */}
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 text-center mb-1">
                {tx.label}
              </h2>

              {/* Amount */}
              <p
                className="text-3xl font-bold"
                style={{ color: isIncome ? '#16a34a' : tx.color }}
              >
                {isIncome ? '+' : '-'}{fmt(Math.abs(tx.amount))}
              </p>

              {/* Type badge */}
              <span
                className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: tx.color + '20', color: tx.color }}
              >
                {isIncome
                  ? <><ArrowUpRight size={12} /> Receita</>
                  : <><ArrowDownLeft size={12} /> Gasto</>
                }
              </span>
            </div>

            {/* Details */}
            <div className="p-6 flex flex-col gap-3">
              {/* Detail rows */}
              {[
                {
                  icon: Calendar,
                  label: 'Data',
                  value: formatDateLong(tx.date),
                  capitalize: true,
                },
                {
                  icon: Tag,
                  label: 'Categoria',
                  value: tx.category,
                },
                ...(bank ? [{
                  icon: CreditCard,
                  label: 'Conta',
                  value: bank.name,
                }] : []),
                ...(tx.description ? [{
                  icon: FileText,
                  label: 'Descrição',
                  value: tx.description,
                }] : []),
              ].map(({ icon: RowIcon, label, value, capitalize }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                    <RowIcon size={14} className="text-slate-500 dark:text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
                    <p className={`text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5 ${capitalize ? 'capitalize' : ''}`}>
                      {value}
                    </p>
                  </div>
                </div>
              ))}

              {/* Actions */}
              <div className="flex gap-2 mt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { onClose(); onEdit(tx); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/10 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors"
                >
                  <Pencil size={14} />
                  Editar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { onClose(); onDelete(tx.id); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-red-50 dark:bg-red-500/10 text-sm font-semibold text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 size={14} />
                  Excluir
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
