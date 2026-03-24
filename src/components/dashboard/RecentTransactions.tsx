'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BarChart2,
  BookOpen,
  Briefcase,
  Car,
  Cross,
  Dumbbell,
  Heart,
  Home,
  Music,
  Package,
  Plus,
  ShoppingCart,
  TrendingUp,
  Tv,
  UtensilsCrossed,
  Wallet,
  Zap,
} from 'lucide-react';
import { useAppData } from '@/contexts/AppDataContext';
import { Transaction } from '@/types';
import TransactionDetailModal from '@/components/transactions/TransactionDetailModal';
import TransactionFormModal from '@/components/transactions/TransactionFormModal';
import { dashboardTitleClass } from '@/components/dashboard/dashboardTypography';

interface RecentTransactionsProps {
  showTitle?: boolean;
}

const iconMap: Record<string, React.ElementType> = {
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
};

function formatDate(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`);
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date);
}

type DisplayTx = Transaction & { _instCount?: number; _instTotal?: number; _baseLabel?: string };

function groupInstallments(txs: Transaction[]): DisplayTx[] {
  const seen = new Set<string>();
  const result: DisplayTx[] = [];
  for (const tx of txs) {
    const match = tx.label.match(/^(.+)\s+\((\d+)\/(\d+)\)$/);
    if (!match) { result.push(tx); continue; }
    const [, base, , total] = match;
    const key = `${base}||${total}||${Math.abs(tx.amount)}||${tx.category}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ ...tx, _instCount: parseInt(total), _instTotal: Math.abs(tx.amount) * parseInt(total), _baseLabel: base });
  }
  return result;
}

export default function RecentTransactions({ showTitle = true }: RecentTransactionsProps) {
  const { transactions, deleteTransaction } = useAppData();
  const recent = groupInstallments(transactions.slice(0, 12)).slice(0, 8);

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [editTx, setEditTx] = useState<Transaction | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);

  function handleEdit(tx: Transaction) {
    setEditTx(tx);
    setFormOpen(true);
  }

  function handleDelete(id: string) {
    deleteTransaction(id);
  }

  return (
    <>
      <div className="h-full rounded-2xl border border-slate-100 bg-white p-6 dark:bg-card dark:border-white/8">
        <div className="mb-5 flex items-center justify-between">
          {showTitle ? (
            <h2 className={dashboardTitleClass}>Transacoes Recentes</h2>
          ) : (
            <div />
          )}
          {recent.length > 0 && (
            <Link href="/transactions" className="cursor-pointer text-xs font-semibold text-amber-500 hover:text-amber-600">
              Ver todas
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400">
                <Wallet size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Nenhuma transacao registrada</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Quando voce adicionar entradas ou saidas, elas vao aparecer aqui para consulta rapida.
                </p>
                <div className="mt-4">
                  <Link
                    href="/transactions"
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
                  >
                    <Plus size={16} />
                    Nova transacao
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {recent.map((tx, i) => {
              const Icon = iconMap[tx.icon] ?? ShoppingCart;
              const isIncome = tx.type === 'income';
              const fmtCur = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
              const label = tx._baseLabel ?? tx.label;
              const displayAmount = tx._instTotal ?? Math.abs(tx.amount);

              return (
                <div key={tx.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedTx(tx)}
                    className="flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left transition-colors hover:bg-slate-50/80 dark:hover:bg-white/5"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: `${tx.color}18` }}
                    >
                      <Icon size={18} style={{ color: tx.color }} strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
                        {tx._instCount && (
                          <span className="shrink-0 rounded-full bg-amber-100 dark:bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                            {tx._instCount}x
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400">{tx.category} · {formatDate(tx.date)}</p>
                    </div>
                    <span className={`shrink-0 text-sm font-bold ${isIncome ? 'text-green-600' : 'text-slate-800 dark:text-slate-200'}`}>
                      {isIncome ? '+' : ''}{fmtCur.format(displayAmount)}
                    </span>
                  </button>
                  {i < recent.length - 1 && <div className="mx-2 h-px bg-slate-50 dark:bg-white/5" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <TransactionFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditTx(undefined);
        }}
        editTransaction={editTx}
      />
    </>
  );
}
