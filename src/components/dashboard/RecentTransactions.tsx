'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
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
} from 'lucide-react';
import { useAppData } from '@/contexts/AppDataContext';
import { Transaction } from '@/types';
import TransactionDetailModal from '@/components/transactions/TransactionDetailModal';
import TransactionFormModal from '@/components/transactions/TransactionFormModal';

const iconMap: Record<string, React.ElementType> = {
  ShoppingCart, TrendingUp, Car, Tv, UtensilsCrossed, Briefcase,
  Dumbbell, Package, Music, Zap, Cross, BarChart2, Heart, Home, BookOpen,
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date);
}

export default function RecentTransactions() {
  const { transactions, deleteTransaction } = useAppData();
  const recent = transactions.slice(0, 8);

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [editTx, setEditTx]         = useState<Transaction | undefined>(undefined);
  const [formOpen, setFormOpen]     = useState(false);

  function handleEdit(tx: Transaction) {
    setEditTx(tx);
    setFormOpen(true);
  }

  function handleDelete(id: string) {
    deleteTransaction(id);
  }

  return (
    <>
      <div className="bg-white dark:bg-card rounded-2xl p-6 border border-slate-100 dark:border-white/8 h-full">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">Transações Recentes</h2>
          <Link href="/transactions" className="text-xs font-semibold text-amber-500 cursor-pointer hover:text-amber-600">
            Ver todas
          </Link>
        </div>

        <div className="flex flex-col gap-1">
          {recent.map((tx, i) => {
            const Icon = iconMap[tx.icon] ?? ShoppingCart;
            const isIncome = tx.type === 'income';
            return (
              <div key={tx.id}>
                <button
                  type="button"
                  onClick={() => setSelectedTx(tx)}
                  className="w-full flex items-center gap-3 py-3 hover:bg-slate-50/80 dark:hover:bg-white/5 rounded-2xl px-2 transition-colors text-left"
                >
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: tx.color + '18' }}
                  >
                    <Icon size={18} style={{ color: tx.color }} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{tx.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{tx.category} · {formatDate(tx.date)}</p>
                  </div>
                  <span
                    className={`text-sm font-bold shrink-0 ${
                      isIncome ? 'text-green-600' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {isIncome ? '+' : ''}
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(tx.amount)}
                  </span>
                </button>
                {i < recent.length - 1 && (
                  <div className="h-px bg-slate-50 dark:bg-white/5 mx-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <TransactionFormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditTx(undefined); }}
        editTransaction={editTx}
      />
    </>
  );
}
