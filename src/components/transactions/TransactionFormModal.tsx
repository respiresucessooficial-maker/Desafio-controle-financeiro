'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, HelpCircle, Calculator, ChevronDown, ChevronLeft, ChevronRight,
  ShoppingCart, Home, Car, Tv, Heart, TrendingUp, BarChart2, BookOpen, Package,
  Store, Calendar, CreditCard, DollarSign, ArrowDownCircle, ArrowUpCircle, Building2, Minus, Plus,
} from 'lucide-react';
import { Transaction, Account, Bank } from '@/types';
import { CATEGORIES } from '@/data/categories';
import { useAppData } from '@/contexts/AppDataContext';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/currencyInput';
import { INSTITUTIONS } from '@/data/institutions';
import { getInstitutionLogoSources } from '@/utils/logoSources';

const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingCart, Home, Car, Tv, Heart, TrendingUp, BarChart2, BookOpen, Package,
};

const MONTHS_PT = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
const DAYS_PT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function buildCalendarCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells: Array<{ day: number; offset: -1 | 0 | 1 }> = [];

  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ day: daysInPrevMonth - i, offset: -1 });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, offset: 0 });
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++)
    cells.push({ day: d, offset: 1 });

  return cells;
}

// ── Logo helpers ─────────────────────────────────────────────────────────────
function AccountLogo({ account }: { account: Account }) {
  const inst = account.institutionId
    ? INSTITUTIONS.find((i) => i.id === account.institutionId)
    : INSTITUTIONS.find((i) => i.code === account.code && i.code !== '000');
  const sources = inst ? getInstitutionLogoSources(inst) : account.logo ? [account.logo] : [];
  const [idx, setIdx] = useState(0);
  const failed = idx >= sources.length;
  return (
    <div className="w-7 h-7 rounded-lg bg-white dark:bg-white/90 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
      {!failed && sources.length > 0 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={sources[idx]} alt={account.name} width={20} height={20} className="w-5 h-5 object-contain" onError={() => setIdx((i) => i + 1)} />
      ) : (
        <Building2 size={14} className="text-slate-400" />
      )}
    </div>
  );
}

function BankLogo({ bank }: { bank: Bank }) {
  const inst = INSTITUTIONS.find((i) => i.code === bank.code);
  const sources = inst ? getInstitutionLogoSources(inst) : bank.logo ? [bank.logo] : [];
  const [idx, setIdx] = useState(0);
  const failed = idx >= sources.length;
  return (
    <div className="w-7 h-7 rounded-lg bg-white dark:bg-white/90 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
      {!failed && sources.length > 0 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={sources[idx]} alt={bank.name} width={20} height={20} className="w-5 h-5 object-contain" onError={() => setIdx((i) => i + 1)} />
      ) : (
        <CreditCard size={14} className="text-slate-400" />
      )}
    </div>
  );
}

// ── Props / form ─────────────────────────────────────────────────────────────
interface Props {
  isOpen: boolean;
  onClose: () => void;
  editTransaction?: Transaction;
}

const emptyForm = {
  type: 'expense' as 'income' | 'expense',
  label: '',
  amount: '',
  category: 'Alimentação',
  date: new Date().toISOString().slice(0, 10),
  bankId: '',
  description: '',
};

export default function TransactionFormModal({ isOpen, onClose, editTransaction }: Props) {
  const { addTransaction, updateTransaction, banks, accounts } = useAppData();
  const [form, setForm]           = useState(emptyForm);
  const [accountId, setAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [paymentType, setPaymentType] = useState<'debit' | 'credit'>('debit');
  const [installments, setInstallments] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<'category' | 'account' | 'card' | 'date' | null>(null);
  const [calView, setCalView]     = useState({ year: new Date().getFullYear(), month: new Date().getMonth() });

  const categoryRef = useRef<HTMLDivElement>(null);
  const accountRef  = useRef<HTMLDivElement>(null);
  const cardRef     = useRef<HTMLDivElement>(null);
  const dateRef     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (editTransaction) {
        setForm({
          type: editTransaction.type,
          label: editTransaction.label,
          amount: formatCurrencyInput(String(Math.abs(editTransaction.amount))),
          category: editTransaction.category,
          date: editTransaction.date,
          bankId: editTransaction.bankId ?? '',
          description: editTransaction.description ?? '',
        });
        // try to recover accountId from the bank
        const bank = banks.find((b) => b.id === editTransaction.bankId);
        const recoveredAccountId = bank?.accountId ?? '';
        setAccountId(recoveredAccountId);
        setPaymentMethod(editTransaction.bankId ? 'card' : 'pix');
        setPaymentType('debit');
        setInstallments(1);
      } else {
        setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) });
        setAccountId('');
        setPaymentMethod('pix');
        setPaymentType('debit');
        setInstallments(1);
      }
    } else {
      setOpenDropdown(null);
    }
  }, [isOpen, editTransaction, banks]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (categoryRef.current && !categoryRef.current.contains(t))
        setOpenDropdown((p) => (p === 'category' ? null : p));
      if (accountRef.current && !accountRef.current.contains(t))
        setOpenDropdown((p) => (p === 'account' ? null : p));
      if (cardRef.current && !cardRef.current.contains(t))
        setOpenDropdown((p) => (p === 'card' ? null : p));
      if (dateRef.current && !dateRef.current.contains(t))
        setOpenDropdown((p) => (p === 'date' ? null : p));
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Cards linked to the selected account
  const accountCards = useMemo(
    () => (accountId ? banks.filter((b) => b.accountId === accountId) : []),
    [accountId, banks],
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const amt = parseCurrencyInput(form.amount);
    if (!form.label || isNaN(amt) || amt <= 0) return;

    const finalAmt       = form.type === 'expense' ? -Math.abs(amt) : Math.abs(amt);
    const installCount   = paymentType === 'credit' && form.bankId ? installments : 1;
    const installmentAmt = parseFloat((finalAmt / installCount).toFixed(2));

    const base = {
      type:        form.type,
      category:    form.category,
      bankId:      form.bankId || undefined,
      description: form.description || undefined,
      icon:        catDef.icon,
      color:       catDef.color,
    };

    if (editTransaction) {
      updateTransaction(editTransaction.id, {
        ...base,
        label:  form.label,
        amount: finalAmt,
        date:   form.date,
      });
    } else {
      for (let i = 0; i < installCount; i++) {
        const d = new Date(form.date + 'T00:00:00');
        d.setMonth(d.getMonth() + i);
        addTransaction({
          ...base,
          label:  installCount > 1 ? `${form.label} (${i + 1}/${installCount})` : form.label,
          amount: installmentAmt,
          date:   d.toISOString().slice(0, 10),
        });
      }
    }

    onClose();
  }

  const set = (k: keyof typeof emptyForm, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const isExpense    = form.type === 'expense';
  const catDef       = useMemo(() => CATEGORIES.find((c) => c.name === form.category) ?? CATEGORIES[0], [form.category]);
  const CategoryIcon = ICON_MAP[catDef.icon] ?? Package;
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const selectedCard    = banks.find((b) => b.id === form.bankId);

  const formattedDate = useMemo(() => {
    if (!form.date) return '';
    const d = new Date(form.date + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  }, [form.date]);

  const calCells = useMemo(() => buildCalendarCells(calView.year, calView.month), [calView]);
  const today    = new Date().toISOString().slice(0, 10);

  function openDatePicker() {
    if (form.date) {
      const d = new Date(form.date + 'T00:00:00');
      setCalView({ year: d.getFullYear(), month: d.getMonth() });
    }
    setOpenDropdown((p) => (p === 'date' ? null : 'date'));
  }

  function selectDay(day: number, offset: -1 | 0 | 1) {
    const d = new Date(calView.year, calView.month + offset, day);
    set('date', d.toISOString().slice(0, 10));
    setOpenDropdown(null);
  }

  const dropdownMotion = {
    initial:    { opacity: 0, y: -6, scale: 0.97 },
    animate:    { opacity: 1, y: 0,  scale: 1    },
    exit:       { opacity: 0, y: -6, scale: 0.97 },
    transition: { type: 'spring' as const, stiffness: 420, damping: 28 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 48, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:w-105 bg-white dark:bg-[#181c27] rounded-t-3xl sm:rounded-2xl shadow-2xl"
          >
            <form onSubmit={handleSubmit}>

              {/* ── Header ── */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/6 rounded-t-3xl sm:rounded-t-2xl">
                <button
                  type="button" onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X size={18} className="text-slate-500 dark:text-slate-400" />
                </button>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {editTransaction ? 'Editar Transação' : isExpense ? 'Despesa rápida' : 'Receita rápida'}
                </h2>
                <motion.button
                  type="submit" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }}
                  className={`px-5 py-1.5 rounded-full text-sm font-semibold text-white transition-colors ${
                    isExpense ? 'bg-red-400 hover:bg-red-500' : 'bg-emerald-500 hover:bg-emerald-600'
                  }`}
                >
                  Salvar
                </motion.button>
              </div>

              {/* ── Type toggle ── */}
              <div className="flex gap-2 mx-5 mt-4">
                <button
                  type="button" onClick={() => set('type', 'expense')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isExpense
                      ? 'bg-red-500/15 text-red-500 dark:text-red-400 border border-red-500/25'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <ArrowDownCircle size={13} /> Despesa
                </button>
                <button
                  type="button" onClick={() => set('type', 'income')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    !isExpense
                      ? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/25'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <ArrowUpCircle size={13} /> Receita
                </button>
              </div>

              {/* ── Fields ── */}
              <div className="px-5 pt-3 pb-6 flex flex-col">

                {/* Description */}
                <div className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-white/6">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/7 flex items-center justify-center shrink-0">
                    <Store size={17} className="text-slate-500 dark:text-slate-400" />
                  </div>
                  <input
                    type="text" value={form.label}
                    onChange={(e) => set('label', e.target.value)}
                    placeholder="Estabelecimento ou descrição"
                    required
                    className="flex-1 min-w-0 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-0.5 shrink-0">
                    {form.label && (
                      <button type="button" onClick={() => set('label', '')}
                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                      >
                        <X size={12} className="text-slate-400" />
                      </button>
                    )}
                    <button type="button" tabIndex={-1}
                      className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <HelpCircle size={14} className="text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-white/6">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/7 flex items-center justify-center shrink-0">
                    <DollarSign size={17} className="text-slate-500 dark:text-slate-400" />
                  </div>
                  <div className="flex-1 flex items-center gap-1.5 min-w-0">
                    <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 shrink-0">R$</span>
                    <input
                      type="text" inputMode="decimal" value={form.amount}
                      onChange={(e) => set('amount', formatCurrencyInput(e.target.value))}
                      placeholder="0,00" required
                      className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                    />
                  </div>
                  <button type="button" tabIndex={-1}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0"
                  >
                    <Calculator size={15} className="text-slate-400" />
                  </button>
                </div>

                {/* ── Category ── */}
                <div className="pt-4">
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Categoria</p>
                  <div ref={categoryRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenDropdown((p) => (p === 'category' ? null : 'category'))}
                      className="w-full flex items-center gap-3 py-2 px-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: catDef.color + '28' }}>
                        <CategoryIcon size={17} style={{ color: catDef.color }} />
                      </div>
                      <span className="flex-1 text-left text-sm font-medium text-slate-900 dark:text-slate-100">{form.category}</span>
                      <ChevronDown size={15} className={`text-slate-400 transition-transform ${openDropdown === 'category' ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {openDropdown === 'category' && (
                        <motion.div {...dropdownMotion}
                          className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-[#222736] rounded-2xl shadow-xl border border-slate-100 dark:border-white/8 overflow-hidden py-1 max-h-60 overflow-y-auto styled-scrollbar"
                        >
                          {CATEGORIES.map((cat) => {
                            const CatIcon  = ICON_MAP[cat.icon] ?? Package;
                            const isSelected = form.category === cat.name;
                            return (
                              <button key={cat.name} type="button"
                                onClick={() => { set('category', cat.name); setOpenDropdown(null); }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${isSelected ? 'bg-slate-50 dark:bg-white/6' : 'hover:bg-slate-50 dark:hover:bg-white/4'}`}
                              >
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: cat.color + '22' }}>
                                  <CatIcon size={14} style={{ color: cat.color }} />
                                </div>
                                <span className="flex-1 text-left text-sm text-slate-700 dark:text-slate-200">{cat.name}</span>
                                {isSelected && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* ── Account ── */}
                <div className="pt-3">
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Conta</p>
                  <div ref={accountRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenDropdown((p) => (p === 'account' ? null : 'account'))}
                      className="w-full flex items-center gap-3 py-2 px-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      {selectedAccount ? (
                        <AccountLogo account={selectedAccount} />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                          <Building2 size={14} className="text-slate-400" />
                        </div>
                      )}
                      <span className="flex-1 text-left text-sm font-medium text-slate-900 dark:text-slate-100">
                        {selectedAccount ? selectedAccount.name : 'Não especificar'}
                      </span>
                      <ChevronDown size={15} className={`text-slate-400 transition-transform ${openDropdown === 'account' ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {openDropdown === 'account' && (
                        <motion.div {...dropdownMotion}
                          className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-[#222736] rounded-2xl shadow-xl border border-slate-100 dark:border-white/8 overflow-hidden py-1 max-h-64 overflow-y-auto styled-scrollbar"
                        >
                          <button type="button"
                            onClick={() => { setAccountId(''); set('bankId', ''); setPaymentMethod('pix'); setPaymentType('debit'); setInstallments(1); setOpenDropdown(null); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/4 transition-colors"
                          >
                            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                              <Building2 size={14} className="text-slate-400" />
                            </div>
                            <span className="text-sm text-slate-500 dark:text-slate-400">Não especificar</span>
                            {!accountId && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />}
                          </button>
                          {accounts.map((acc) => (
                            <button key={acc.id} type="button"
                              onClick={() => {
                                const hasCards = banks.some((b) => b.accountId === acc.id);
                                setAccountId(acc.id);
                                set('bankId', '');
                                setPaymentMethod(hasCards ? 'card' : 'pix');
                                setPaymentType('debit');
                                setInstallments(1);
                                setOpenDropdown(null);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${accountId === acc.id ? 'bg-slate-50 dark:bg-white/6' : 'hover:bg-slate-50 dark:hover:bg-white/4'}`}
                            >
                              <AccountLogo account={acc} />
                              <span className="flex-1 text-left text-sm text-slate-700 dark:text-slate-200">{acc.name}</span>
                              {accountId === acc.id && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* ── Pix / Cartão toggle ── */}
                {accountId && (
                  <div className="pt-3">
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Forma de pagamento</p>
                    <div className="flex gap-2">
                      {(['pix', 'card'] as const).map((pm) => (
                        <button key={pm} type="button"
                          onClick={() => {
                            setPaymentMethod(pm);
                            set('bankId', '');
                            setPaymentType('debit');
                            setInstallments(1);
                          }}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                            paymentMethod === pm
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              : 'text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-white/5'
                          }`}
                        >
                          {pm === 'pix'
                            ? <><DollarSign size={12} />Pix</>
                            : <><CreditCard size={12} />Cartão</>
                          }
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Card selector (only when "card" method selected) ── */}
                {accountId && paymentMethod === 'card' && (
                  <div className="pt-3">
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Cartão</p>
                    <div ref={cardRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenDropdown((p) => (p === 'card' ? null : 'card'))}
                        className="w-full flex items-center gap-3 py-2 px-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                      >
                        {selectedCard ? (
                          <BankLogo bank={selectedCard} />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                            <CreditCard size={14} className="text-slate-400" />
                          </div>
                        )}
                        <span className="flex-1 text-left text-sm font-medium text-slate-900 dark:text-slate-100">
                          {selectedCard ? `${selectedCard.name} •••• ${selectedCard.number.slice(-4)}` : 'Selecionar cartão'}
                        </span>
                        <ChevronDown size={15} className={`text-slate-400 transition-transform ${openDropdown === 'card' ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {openDropdown === 'card' && (
                          <motion.div {...dropdownMotion}
                            className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-[#222736] rounded-2xl shadow-xl border border-slate-100 dark:border-white/8 overflow-hidden py-1 max-h-56 overflow-y-auto styled-scrollbar"
                          >
                            {accountCards.length === 0 ? (
                              <div className="px-4 py-3 text-sm text-slate-400 text-center">
                                Nenhum cartão vinculado a esta conta
                              </div>
                            ) : (
                              accountCards.map((card) => (
                                <button key={card.id} type="button"
                                  onClick={() => { set('bankId', card.id); setPaymentType('debit'); setInstallments(1); setOpenDropdown(null); }}
                                  className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${form.bankId === card.id ? 'bg-slate-50 dark:bg-white/6' : 'hover:bg-slate-50 dark:hover:bg-white/4'}`}
                                >
                                  <BankLogo bank={card} />
                                  <span className="flex-1 text-left text-sm text-slate-700 dark:text-slate-200">
                                    {card.name} <span className="text-slate-400">•••• {card.number.slice(-4)}</span>
                                  </span>
                                  {form.bankId === card.id && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                                </button>
                              ))
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* ── Debit / Credit toggle (card selected) ── */}
                {form.bankId && paymentMethod === 'card' && (
                  <div className="pt-3">
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Modalidade</p>
                    <div className="flex gap-2">
                      {(['debit', 'credit'] as const).map((pt) => (
                        <button key={pt} type="button"
                          onClick={() => { setPaymentType(pt); if (pt === 'debit') setInstallments(1); }}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all border ${
                            paymentType === pt
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              : 'text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-white/5'
                          }`}
                        >
                          {pt === 'debit' ? 'Débito' : 'Crédito'}
                        </button>
                      ))}
                    </div>

                    {/* ── Installments (credit only) ── */}
                    {paymentType === 'credit' && (
                      <div className="pt-3">
                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Parcelas</p>
                        <div className="flex items-center gap-3">
                          <button type="button"
                            onClick={() => setInstallments((n) => Math.max(1, n - 1))}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors shrink-0"
                          >
                            <Minus size={13} />
                          </button>
                          <div className="flex-1 text-center">
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {installments}x
                            </span>
                            {installments > 1 && form.amount && (
                              <span className="text-xs text-slate-400 ml-1.5">
                                de R$ {(parseCurrencyInput(form.amount) / installments).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>
                          <button type="button"
                            onClick={() => setInstallments((n) => Math.min(24, n + 1))}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors shrink-0"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        {installments > 1 && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 text-center">
                            Lançado em {installments} faturas a partir de {formattedDate}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Date ── */}
                <div className="pt-3">
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Data</p>
                  <div ref={dateRef} className="relative">
                    <button
                      type="button" onClick={openDatePicker}
                      className="w-full flex items-center gap-3 py-2 px-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/7 flex items-center justify-center shrink-0">
                        <Calendar size={17} className="text-slate-500 dark:text-slate-400" />
                      </div>
                      <span className="flex-1 text-left text-sm font-medium text-slate-900 dark:text-slate-100">
                        {formattedDate || 'Selecionar data'}
                      </span>
                      <ChevronDown size={15} className={`text-slate-400 transition-transform ${openDropdown === 'date' ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {openDropdown === 'date' && (
                        <motion.div {...dropdownMotion}
                          className="absolute z-20 bottom-full left-0 right-0 mb-1 bg-white dark:bg-[#222736] rounded-2xl shadow-xl border border-slate-100 dark:border-white/8 overflow-hidden p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <button type="button" onClick={() => setCalView(({ year, month }) => month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 })}
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                            >
                              <ChevronLeft size={15} className="text-slate-500 dark:text-slate-400" />
                            </button>
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 capitalize">
                              {MONTHS_PT[calView.month]} de {calView.year}
                            </span>
                            <button type="button" onClick={() => setCalView(({ year, month }) => month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 })}
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                            >
                              <ChevronRight size={15} className="text-slate-500 dark:text-slate-400" />
                            </button>
                          </div>

                          <div className="grid grid-cols-7 mb-1">
                            {DAYS_PT.map((d, i) => (
                              <div key={i} className="h-8 flex items-center justify-center text-[10px] font-semibold text-slate-400 dark:text-slate-500">{d}</div>
                            ))}
                          </div>

                          <div className="grid grid-cols-7 gap-y-0.5">
                            {calCells.map((cell, i) => {
                              const cellDate = new Date(calView.year, calView.month + cell.offset, cell.day).toISOString().slice(0, 10);
                              const isSelected   = cellDate === form.date;
                              const isToday      = cellDate === today;
                              const isOtherMonth = cell.offset !== 0;
                              return (
                                <button key={i} type="button" onClick={() => selectDay(cell.day, cell.offset)}
                                  className={`h-8 w-full flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                                    isSelected
                                      ? isExpense ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                                      : isToday
                                      ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-slate-100 font-bold'
                                      : isOtherMonth
                                      ? 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-white/4'
                                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/8'
                                  }`}
                                >
                                  {cell.day}
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-white/6">
                            <button type="button" onClick={() => { set('date', ''); setOpenDropdown(null); }}
                              className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                              Limpar
                            </button>
                            <button type="button" onClick={() => { set('date', today); setOpenDropdown(null); }}
                              className="text-xs font-semibold text-amber-500 hover:text-amber-600 transition-colors"
                            >
                              Hoje
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
