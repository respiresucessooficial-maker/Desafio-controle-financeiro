'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CreditCard,
  Calendar,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Clock,
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
  TrendingUp,
  Pencil,
  ChevronDown,
  CalendarDays,
} from 'lucide-react';
import { Bank, Transaction } from '@/types';
import {
  getCardConfiguredAvailableLimit,
  getCardInvoiceAmount,
  isInvoicePaymentTransaction,
} from '@/lib/cardLimits';
import BankCard from './BankCard';
import AddCardModal from './AddCardModal';
import { useAppData } from '@/contexts/AppDataContext';

const iconMap: Record<string, React.ElementType> = {
  ShoppingCart, TrendingUp, Car, Tv, UtensilsCrossed, Briefcase,
  Dumbbell, Package, Music, Zap, Cross, BarChart2, Heart, Home, BookOpen,
};

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

type DisplayTx = Transaction & { _instCount?: number; _instTotal?: number; _baseLabel?: string };
type InvoiceStatus = 'paid' | 'open' | 'overdue';
type InvoiceHistoryItem = { month: string; amount: number; status: InvoiceStatus; sortKey: string };

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

function formatDate(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00');
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date: Date) {
  const formatted = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

interface Props {
  bank: Bank | null;
  transactions: Transaction[];
  onClose: () => void;
}

export default function CardDetailDrawer({ bank, transactions, onClose }: Props) {
  const { addTransaction, updateBank, accounts } = useAppData();
  const [editOpen, setEditOpen] = useState(false);
  const [futureOpen, setFutureOpen] = useState(false);
  const [payConfirmOpen, setPayConfirmOpen] = useState(false);

  if (!bank) return null;
  const currentBank = bank;

  const linkedAccount = accounts.find((account) => account.id === currentBank.accountId);

  const cardExpenseTransactions = transactions.filter(
    (transaction) =>
      transaction.bankId === currentBank.id &&
      transaction.type === 'expense' &&
      !isInvoicePaymentTransaction(transaction, currentBank.id),
  );

  const cardTransactions = groupInstallments(cardExpenseTransactions).slice(0, 5);

  const now = new Date();
  const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthKey = monthKey(currentMonthDate);
  const currentYearMonth = now.getFullYear() * 12 + now.getMonth();

  const futureTransactions = cardExpenseTransactions
    .filter((t) => {
      const d = new Date(t.date + 'T00:00:00');
      return d.getFullYear() * 12 + d.getMonth() > currentYearMonth;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const futureByMonth = futureTransactions.reduce<Record<string, { label: string; total: number; items: Transaction[] }>>(
    (acc, t) => {
      const d = new Date(t.date + 'T00:00:00');
      const key = monthKey(d);
      if (!acc[key]) {
        acc[key] = { label: monthLabel(d), total: 0, items: [] };
      }
      acc[key].total += Math.abs(t.amount);
      acc[key].items.push(t);
      return acc;
    },
    {},
  );

  const creditLimit = currentBank.creditLimit ?? 0;
  const creditUsed = getCardInvoiceAmount(currentBank);
  const canPayInvoice = (currentBank.invoiceStatus === 'open' || currentBank.invoiceStatus === 'overdue') && creditUsed > 0 && !!linkedAccount;
  const creditAvailableConfigured = getCardConfiguredAvailableLimit(currentBank);
  const creditAvailable = Math.max(0, creditAvailableConfigured - creditUsed);
  const usagePct = creditLimit > 0 ? Math.min(100, (creditUsed / creditLimit) * 100) : 0;

  const barColor =
    usagePct >= 90 ? '#EF4444' : usagePct >= 70 ? '#F59E0B' : '#22C55E';

  const statusConfig: Record<InvoiceStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
    paid: { label: 'Paga', icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-500/10' },
    open: { label: 'Em aberto', icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    overdue: { label: 'Atrasada', icon: AlertCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
  };

  const status = statusConfig[currentBank.invoiceStatus ?? 'open'];
  const StatusIcon = status.icon;

  const paidInvoices = Object.values(
    cardExpenseTransactions.reduce<Record<string, InvoiceHistoryItem>>((acc, tx) => {
      const d = new Date(tx.date + 'T00:00:00');
      const key = monthKey(d);
      if (key >= currentMonthKey) return acc;
      if (!acc[key]) {
        acc[key] = { month: monthLabel(d), amount: 0, status: 'paid', sortKey: key };
      }
      acc[key].amount += Math.abs(tx.amount);
      return acc;
    }, {}),
  ).sort((a, b) => b.sortKey.localeCompare(a.sortKey));

  const invoiceHistory: InvoiceHistoryItem[] = [
    ...(creditUsed > 0 || currentBank.invoiceStatus !== 'paid'
      ? [{ month: monthLabel(currentMonthDate), amount: creditUsed, status: currentBank.invoiceStatus ?? 'open', sortKey: currentMonthKey }]
      : []),
    ...paidInvoices,
  ];

  function handlePayInvoice() {
    if (!linkedAccount || creditUsed <= 0) return;

    addTransaction({
      label: `Pagamento da fatura ${monthLabel(currentMonthDate)}`,
      amount: -Math.abs(creditUsed),
      date: new Date().toISOString().slice(0, 10),
      category: 'Outros',
      type: 'expense',
      icon: 'Wallet',
      color: currentBank.accentColor,
      accountId: linkedAccount.id,
      bankId: currentBank.id,
      paymentType: 'pix',
      description: `invoice_payment:${currentMonthKey}`,
    });

    updateBank(currentBank.id, {
      creditUsed: 0,
      lastInvoiceAmount: 0,
      invoiceStatus: 'paid',
    });

    setPayConfirmOpen(false);
  }

  return (
    <AnimatePresence>
      <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

        <motion.aside
          key="drawer"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="fixed right-0 top-0 h-full w-full max-w-[420px] bg-white dark:bg-card z-50 flex flex-col shadow-2xl overflow-y-auto styled-scrollbar"
        >
          <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Detalhes</p>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">{currentBank.name}</h2>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => setEditOpen(true)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                title="Editar cartao"
                className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
              >
                <Pencil size={16} />
              </motion.button>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
              >
                <X size={18} />
              </motion.button>
            </div>
            </div>

            <div className="flex justify-center px-6 pb-6">
              <BankCard bank={currentBank} />
            </div>

            <div className="flex flex-col gap-4 px-6 pb-8">
              {creditLimit > 0 && (
                <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Limite do cartao</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{usagePct.toFixed(0)}% usado</span>
                  </div>

                  <div className="h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden mb-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${usagePct}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: barColor }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 mb-0.5">Usado</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{fmt(creditUsed)}</p>
                    </div>
                    <div className="text-center border-x border-slate-200 dark:border-white/10">
                      <p className="text-[10px] text-slate-400 mb-0.5">Disponivel</p>
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">{fmt(creditAvailable)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-400 mb-0.5">Limite total</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{fmt(creditLimit)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Fatura atual</p>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{fmt(creditUsed)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Valor em aberto</p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${status.bg}`}>
                    <StatusIcon size={13} className={status.color} />
                    <span className={`text-xs font-semibold ${status.color}`}>{status.label}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2.5 p-3 bg-white dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/8">
                    <Calendar size={15} className="text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400">Fechamento</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{currentBank.closingDay ? `Dia ${currentBank.closingDay}` : '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 bg-white dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/8">
                    <TrendingDown size={15} className="text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400">Vencimento</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{currentBank.dueDay ? `Dia ${currentBank.dueDay}` : '-'}</p>
                    </div>
                  </div>
                </div>

                {(currentBank.invoiceStatus === 'open' || currentBank.invoiceStatus === 'overdue') && (
                  <div className="mt-4">
                    {payConfirmOpen ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          Confirmar pagamento da fatura?
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {linkedAccount
                            ? `Vamos descontar ${fmt(creditUsed)} da conta ${linkedAccount.name}, zerar a fatura atual e registrar a despesa no orcamento.`
                            : 'Vincule este cartao a uma conta para pagar a fatura.'}
                        </p>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setPayConfirmOpen(false)}
                            className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-white dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handlePayInvoice}
                            disabled={!canPayInvoice}
                            className="flex-1 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Pagar fatura
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPayConfirmOpen(true)}
                        disabled={!canPayInvoice}
                        className="w-full rounded-xl bg-amber-500 px-3 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {linkedAccount ? 'Pagar fatura' : 'Vincule uma conta para pagar'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard size={14} className="text-slate-400" />
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Ultimos gastos neste cartao
                  </p>
                </div>

                {cardTransactions.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">Nenhuma transacao neste cartao</p>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {cardTransactions.map((tx, i) => {
                      const Icon = iconMap[tx.icon] ?? ShoppingCart;
                      const displayLabel = tx._baseLabel ?? tx.label;
                      const displayAmount = tx._instTotal ?? Math.abs(tx.amount);
                      const isDebit = !!tx.accountId;
                      return (
                        <div key={tx.id}>
                          <div className="flex items-center gap-3 py-2.5">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                              style={{ backgroundColor: tx.color + '18' }}
                            >
                              <Icon size={14} style={{ color: tx.color }} strokeWidth={2} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{displayLabel}</p>
                                {tx._instCount && (
                                  <span className="shrink-0 rounded-full bg-amber-100 dark:bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400">
                                    {tx._instCount}x
                                  </span>
                                )}
                              </div>
                              <p className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                {formatDate(tx.date)}
                                {isDebit ? (
                                  <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                                    Débito
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                                    Crédito
                                  </span>
                                )}
                              </p>
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0">
                              {fmt(displayAmount)}
                            </span>
                          </div>
                          {i < cardTransactions.length - 1 && (
                            <div className="h-px bg-slate-100 dark:bg-white/5" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {Object.keys(futureByMonth).length > 0 && (
                <div className="bg-slate-50 dark:bg-white/5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setFutureOpen((o) => !o)}
                    className="w-full flex items-center justify-between px-4 py-4 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <CalendarDays size={14} className="text-amber-500" />
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Faturas futuras
                      </p>
                      <span className="text-[10px] font-semibold bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                        {Object.keys(futureByMonth).length} {Object.keys(futureByMonth).length === 1 ? 'mes' : 'meses'}
                      </span>
                    </div>
                    <motion.div animate={{ rotate: futureOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={15} className="text-slate-400" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {futureOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 flex flex-col gap-3">
                          {Object.entries(futureByMonth).map(([key, month]) => (
                            <div key={key} className="bg-white dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/8 overflow-hidden">
                              <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 dark:border-white/8">
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{month.label}</p>
                                <p className="text-xs font-bold text-red-500 dark:text-red-400">-{fmt(month.total)}</p>
                              </div>
                              <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/5">
                                {month.items.map((tx) => {
                                  const Icon = iconMap[tx.icon] ?? ShoppingCart;
                                  return (
                                    <div key={tx.id} className="flex items-center gap-2.5 px-3 py-2">
                                      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: tx.color + '20' }}>
                                        <Icon size={12} style={{ color: tx.color }} strokeWidth={2} />
                                      </div>
                                      <p className="flex-1 text-xs text-slate-700 dark:text-slate-200 truncate">{tx.label}</p>
                                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">{fmt(Math.abs(tx.amount))}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Historico de faturas</p>

                {invoiceHistory.length === 0 ? (
                  <p className="py-2 text-sm text-slate-400">Nenhuma fatura encontrada para este cartao.</p>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {invoiceHistory.map((inv, i) => {
                      const invoiceVisual = statusConfig[inv.status];
                      const InvoiceIcon = invoiceVisual.icon;
                      return (
                        <div key={`${inv.sortKey}-${inv.status}`}>
                          {i > 0 && <div className="h-px bg-slate-100 dark:bg-white/5" />}
                          <div className="flex items-center justify-between py-2.5">
                            <div>
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{inv.month}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <InvoiceIcon size={10} className={invoiceVisual.color} />
                                <p className={`text-[10px] font-medium ${invoiceVisual.color}`}>{invoiceVisual.label}</p>
                              </div>
                            </div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{fmt(inv.amount)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
      </>

      <AddCardModal
        key={`edit-card-${currentBank.id}`}
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        editBank={currentBank}
      />
    </AnimatePresence>
  );
}
