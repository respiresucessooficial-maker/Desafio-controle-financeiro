'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
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
  Building2,
  Pencil,
} from 'lucide-react';
import { Account, Bank, Transaction } from '@/types';
import { getInstitutionLogoSources } from '@/utils/logoSources';
import { INSTITUTIONS } from '@/data/institutions';
import AddAccountModal from './AddAccountModal';

const iconMap: Record<string, React.ElementType> = {
  ShoppingCart, TrendingUp, Car, Tv, UtensilsCrossed, Briefcase,
  Dumbbell, Package, Music, Zap, Cross, BarChart2, Heart, Home, BookOpen,
};

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

interface Props {
  account: Account | null;
  banks: Bank[];
  transactions: Transaction[];
  onClose: () => void;
}

function AccountLogo({ account }: { account: Account }) {
  const inst = account.institutionId
    ? INSTITUTIONS.find((i) => i.id === account.institutionId)
    : undefined;
  const sources = inst ? getInstitutionLogoSources(inst) : account.logo ? [account.logo] : [];
  const [idx, setIdx] = useState(0);
  const failed = idx >= sources.length;

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow dark:bg-white/90">
      {!failed && sources.length > 0 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sources[idx]}
          alt={account.name}
          width={48}
          height={48}
          className="h-12 w-12 object-contain"
          onError={() => setIdx((i) => i + 1)}
        />
      ) : (
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl text-sm font-extrabold text-white"
          style={{ background: account.accentColor }}
        >
          {account.brand.slice(0, 2)}
        </div>
      )}
    </div>
  );
}

const PAGE_SIZE = 20;

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

export default function AccountDetailDrawer({ account, banks, transactions, onClose }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [page, setPage] = useState(1);

  if (!account) return null;

  // All transactions for this account:
  // 1. Direct account transactions (initial balance, adjustments)
  // 2. Card transactions from cards linked to this account
  const accountCardIds = new Set(banks.filter((b) => b.accountId === account.id).map((b) => b.id));
  const accountTransactions = transactions
    .filter((t) => t.accountId === account.id || (t.bankId && accountCardIds.has(t.bankId)))
    .sort((a, b) => b.date.localeCompare(a.date));

  const grouped = groupInstallments(accountTransactions);

  const totalIncome = accountTransactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = accountTransactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const paginated = grouped.slice(0, page * PAGE_SIZE);
  const hasMore = paginated.length < grouped.length;

  return (
    <AnimatePresence>
      {account && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[440px] flex-col overflow-y-auto bg-white shadow-2xl dark:bg-card styled-scrollbar"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 shrink-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Conta</p>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => setEditOpen(true)}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  title="Editar conta"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-500 transition-colors hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20"
                >
                  <Pencil size={15} />
                </motion.button>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-white/10 dark:text-slate-400 dark:hover:bg-white/20"
                >
                  <X size={18} />
                </motion.button>
              </div>
            </div>

            {/* Account identity */}
            <div className="flex items-center gap-4 px-6 pb-6">
              <AccountLogo account={account} />
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 truncate">{account.name}</h2>
                <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mt-1">
                  {fmt(account.balance)}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  {account.agency && (
                    <span className="text-[10px] font-medium text-slate-400">Ag. **{account.agency.slice(-2)}</span>
                  )}
                  {account.agency && account.accountNumber && (
                    <span className="text-[10px] text-slate-300 dark:text-slate-600">·</span>
                  )}
                  {account.accountNumber && (
                    <span className="text-[10px] font-medium text-slate-400">Conta ...{account.accountNumber.slice(-3)}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 px-6 pb-8">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/8 dark:bg-white/5">
                  <div className="mb-2 flex items-center gap-1.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/15">
                      <ArrowUpRight size={13} className="text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Entradas</span>
                  </div>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{fmt(totalIncome)}</p>
                  <p className="text-[10px] text-slate-400">
                    {accountTransactions.filter((t) => t.type === 'income').length} transações
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/8 dark:bg-white/5">
                  <div className="mb-2 flex items-center gap-1.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/15">
                      <ArrowDownRight size={13} className="text-red-500 dark:text-red-400" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Saídas</span>
                  </div>
                  <p className="text-lg font-bold text-red-500 dark:text-red-400">{fmt(totalExpense)}</p>
                  <p className="text-[10px] text-slate-400">
                    {accountTransactions.filter((t) => t.type === 'expense').length} transações
                  </p>
                </div>
              </div>

              {/* Transaction list */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 dark:border-white/8 dark:bg-white/5">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/8">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Histórico
                  </p>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-400">
                    {grouped.length}
                  </span>
                </div>

                {grouped.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/10">
                      <Building2 size={18} className="text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-400">Nenhuma movimentação ainda</p>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/5">
                    {paginated.map((tx) => {
                      const Icon = iconMap[tx.icon] ?? ShoppingCart;
                      const isIncome = tx.type === 'income';
                      const isAdjust     = tx.label === 'Ajuste de saldo' || tx.label === 'Saldo inicial';
                      const isCardDebit  = !!tx.bankId && !!tx.accountId;
                      const isCardCredit = !!tx.bankId && !tx.accountId;
                      const isCard       = isCardDebit || isCardCredit;
                      const isPix        = !isAdjust && !isCard && !!tx.accountId;
                      const displayLabel = tx._baseLabel ?? tx.label;
                      const displayAmount = tx._instTotal ?? Math.abs(tx.amount);
                      return (
                        <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                            style={{ backgroundColor: tx.color + '18' }}
                          >
                            <Icon size={15} style={{ color: tx.color }} strokeWidth={2} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                                {displayLabel}
                              </p>
                              {tx._instCount && (
                                <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                                  {tx._instCount}x
                                </span>
                              )}
                            </div>
                            <p className="flex items-center gap-1.5 text-[10px] text-slate-400">
                              {formatDate(tx.date)}
                              {isAdjust && (
                                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                                  ajuste
                                </span>
                              )}
                              {isPix && (
                                <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-semibold text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
                                  PIX
                                </span>
                              )}
                              {isCardDebit && (
                                <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                                  Débito
                                </span>
                              )}
                              {isCardCredit && (
                                <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                                  Crédito
                                </span>
                              )}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 text-sm font-bold ${
                              isIncome
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {isIncome ? '+' : '−'}{fmt(displayAmount)}
                          </span>
                        </div>
                      );
                    })}

                    {hasMore && (
                      <button
                        type="button"
                        onClick={() => setPage((p) => p + 1)}
                        className="w-full py-3 text-xs font-semibold text-amber-500 transition-colors hover:text-amber-600 hover:bg-amber-50/50 dark:hover:bg-amber-500/5"
                      >
                        Ver mais ({grouped.length - paginated.length} restantes)
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.aside>

          <AddAccountModal
            isOpen={editOpen}
            onClose={() => setEditOpen(false)}
            editAccount={account}
          />
        </>
      )}
    </AnimatePresence>
  );
}
