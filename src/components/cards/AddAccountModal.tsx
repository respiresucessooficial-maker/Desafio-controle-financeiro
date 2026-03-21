'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Building2, ChevronLeft, Search } from 'lucide-react';
import { useAppData } from '@/contexts/AppDataContext';
import { Account, AccountType } from '@/types';
import { INSTITUTIONS, Institution } from '@/data/institutions';
import InstitutionTile from '@/components/ui/InstitutionTile';
import { ACCOUNT_TYPES } from '@/data/accountTypes';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/currencyInput';
import { getInstitutionLogoSources } from '@/utils/logoSources';

function InstitutionLogo({ inst }: { inst: Institution }) {
  const sources = getInstitutionLogoSources(inst);
  const [idx, setIdx] = useState(0);
  const failed = idx >= sources.length;
  return (
    <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/90 flex items-center justify-center shadow overflow-hidden shrink-0">
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sources[idx]}
          alt={inst.name}
          width={24}
          height={24}
          className="w-6 h-6 object-contain"
          onError={() => setIdx((i) => i + 1)}
        />
      )}
      {failed && <Building2 size={16} className="text-slate-400" />}
    </div>
  );
}

const emptyForm = {
  type: 'corrente' as AccountType,
  balance: '',
  agency: '',
  accountNumber: '',
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editAccount?: Account;
}

export default function AddAccountModal({ isOpen, onClose, editAccount }: Props) {
  const { addAccount, updateAccount, addTransaction } = useAppData();
  const isEditing = !!editAccount;
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState<string>('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSearch('');
    if (editAccount) {
      setSelectedId(editAccount.institutionId ?? '');
      setForm({
        type: editAccount.type,
        balance: formatCurrencyInput(String(Math.round(editAccount.balance * 100))),
        agency: (editAccount.agency ?? '').slice(-2),
        accountNumber: (editAccount.accountNumber ?? '').slice(-3),
      });
    } else {
      setSelectedId('');
      setForm(emptyForm);
    }
  }, [isOpen, editAccount]);

  const set = <K extends keyof typeof emptyForm>(k: K, v: typeof emptyForm[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const filteredInstitutions = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return INSTITUTIONS;
    return INSTITUTIONS.filter(
      (i) => i.name.toLowerCase().includes(q) || i.brand.toLowerCase().includes(q),
    );
  }, [search]);

  const inst = useMemo(() => INSTITUTIONS.find((p) => p.id === selectedId), [selectedId]);
  const showForm = selectedId !== '';

  const typeLabel = ACCOUNT_TYPES.find((t) => t.value === form.type)?.label ?? 'Conta';

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!inst) return;
    const balance = parseCurrencyInput(form.balance);
    if (isNaN(balance)) return;

    const data = {
      institutionId: inst.id,
      name: `${inst.name} — ${typeLabel}`,
      type: form.type,
      balance,
      agency: form.agency || undefined,
      accountNumber: form.accountNumber || undefined,
      color: inst.color,
      textColor: inst.textColor,
      accentColor: inst.accentColor,
      brand: inst.brand,
      code: inst.code,
    };

    const today = new Date().toISOString().slice(0, 10);

    if (isEditing && editAccount) {
      updateAccount(editAccount.id, data);
      const diff = balance - editAccount.balance;
      if (diff !== 0) {
        addTransaction({
          label: 'Ajuste de saldo',
          amount: Math.abs(diff),
          type: diff > 0 ? 'income' : 'expense',
          date: today,
          category: 'Outros',
          icon: 'BarChart2',
          color: inst.accentColor,
          accountId: editAccount.id,
          description: `Ajuste de saldo: ${diff > 0 ? '+' : ''}${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(diff)}`,
        }, { skipBalanceUpdate: true });
      }
    } else {
      const newAcc = addAccount(data);
      if (balance > 0) {
        addTransaction({
          label: 'Saldo inicial',
          amount: balance,
          type: 'income',
          date: today,
          category: 'Outros',
          icon: 'Home',
          color: inst.accentColor,
          accountId: newAcc.id,
          description: 'Saldo inicial da conta',
        }, { skipBalanceUpdate: true });
      }
    }

    setForm(emptyForm);
    setSelectedId('');
    onClose();
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:border-amber-400 transition-colors';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 48, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:w-140 bg-white dark:bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                {showForm && !isEditing && (
                  <motion.button
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    type="button"
                    onClick={() => { setSelectedId(''); setSearch(''); }}
                    className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-white/15 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </motion.button>
                )}
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                  <Building2 size={18} className="text-amber-500" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                  {isEditing ? 'Editar conta' : showForm ? (inst?.name ?? 'Nova conta') : 'Nova Conta'}
                </h2>
              </div>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
              >
                <X size={18} />
              </motion.button>
            </div>

            <div className="overflow-y-auto styled-scrollbar flex-1">
              <AnimatePresence mode="wait">

                {/* ── STEP 1: Institution picker (create mode only) ── */}
                {!showForm && (
                  <motion.div
                    key="selector"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.18 }}
                    className="px-6 pb-8"
                  >
                    <p className="text-xs text-slate-400 mb-3">
                      Selecione sua instituição para cadastrar a conta automaticamente.
                    </p>

                    {/* Search bar */}
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 mb-4">
                      <Search size={15} className="text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar instituição..."
                        className="flex-1 min-w-0 bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                      />
                      {search && (
                        <button type="button" onClick={() => setSearch('')}>
                          <X size={13} className="text-slate-400" />
                        </button>
                      )}
                    </div>

                    {/* Logo grid */}
                    <div className="grid grid-cols-5 gap-1 pb-8">
                      {filteredInstitutions.map((i) => (
                        <InstitutionTile
                          key={i.id}
                          inst={i}
                          selected={selectedId === i.id}
                          onClick={() => setSelectedId(i.id)}
                        />
                      ))}

                      {filteredInstitutions.length === 0 && search && (
                        <p className="col-span-5 text-center text-xs text-slate-400 py-6">
                          Nenhuma instituição encontrada.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 2: Account form ── */}
                {showForm && (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.18 }}
                    onSubmit={handleSubmit}
                    className="px-6 pb-8 flex flex-col gap-5"
                  >
                    {/* Institution info pill */}
                    {inst && (
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/8">
                        <InstitutionLogo inst={inst} />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{inst.name}</span>
                        <span className="ml-auto text-xs text-slate-400 font-mono shrink-0">COMPE {inst.code}</span>
                      </div>
                    )}

                    {/* Account type */}
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">Tipo de conta</label>
                      <div className="flex gap-2 flex-wrap">
                        {ACCOUNT_TYPES.map((t) => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => set('type', t.value)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                              form.type === t.value
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/15'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Balance */}
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Saldo atual (R$) *</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={form.balance}
                        onChange={(e) => set('balance', formatCurrencyInput(e.target.value))}
                        placeholder="1.000,00"
                        required
                        className={`${inputCls} font-bold`}
                      />
                    </div>

                    {/* Agency + Account number */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Últimos 2 dígitos da agência</label>
                        <input
                          type="text"
                          value={form.agency}
                          onChange={(e) => set('agency', e.target.value.replace(/\D/g, '').slice(0, 2))}
                          placeholder="Ex: 45"
                          maxLength={2}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Últimos 3 dígitos da conta</label>
                        <input
                          type="text"
                          value={form.accountNumber}
                          onChange={(e) => set('accountNumber', e.target.value.slice(0, 3))}
                          placeholder="Ex: 6-7"
                          maxLength={3}
                          className={inputCls}
                        />
                      </div>
                    </div>

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="w-full py-3.5 rounded-2xl font-bold text-white bg-amber-500 hover:bg-amber-600 flex items-center justify-center gap-2 shadow-lg mt-1 transition-colors"
                    >
                      <Check size={18} />
                      {isEditing ? 'Salvar alterações' : 'Adicionar conta'}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
