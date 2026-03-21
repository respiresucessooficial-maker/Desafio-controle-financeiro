'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, CreditCard, ChevronLeft, Pencil, Minus, Plus, Search, Trash2, AlertTriangle } from 'lucide-react';
import { useAppData } from '@/contexts/AppDataContext';
import { Bank } from '@/types';
import { INSTITUTIONS, Institution } from '@/data/institutions';
import InstitutionTile from '@/components/ui/InstitutionTile';
import { formatCurrencyInput, parseCurrencyInput } from '@/lib/currencyInput';
import { getInstitutionLogoSources } from '@/utils/logoSources';
import { getCardCurrentInvoiceFromTransactions } from '@/lib/cardLimits';

function InstitutionLogo({ inst }: { inst: Institution }) {
  const sources = getInstitutionLogoSources(inst);
  const [idx, setIdx] = useState(0);
  const failed = idx >= sources.length;
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow dark:bg-white/90">
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sources[idx]}
          alt={inst.name}
          width={24}
          height={24}
          className="h-6 w-6 object-contain"
          onError={() => setIdx((i) => i + 1)}
        />
      )}
      {failed && <CreditCard size={16} className="text-slate-400" />}
    </div>
  );
}

function DayStepper({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const num = parseInt(value) || 0;
  const dec = () => onChange(String(Math.max(1, num - 1)));
  const inc = () => onChange(String(Math.min(31, num + 1)));
  return (
    <div className="flex h-10 items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
      <button type="button" onClick={dec} className="flex h-full w-10 shrink-0 items-center justify-center text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-500 dark:hover:bg-amber-500/10">
        <Minus size={14} />
      </button>
      <input
        type="number"
        min="1"
        max="31"
        value={value}
        placeholder="-"
        onChange={(e) => {
          const v = parseInt(e.target.value);
          if (!e.target.value) {
            onChange('');
            return;
          }
          if (v >= 1 && v <= 31) onChange(String(v));
        }}
        className="min-w-0 flex-1 bg-transparent text-center text-sm font-bold text-slate-800 outline-none dark:text-slate-100"
      />
      <button type="button" onClick={inc} className="flex h-full w-10 shrink-0 items-center justify-center text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-500 dark:hover:bg-amber-500/10">
        <Plus size={14} />
      </button>
    </div>
  );
}

const CUSTOM_COLORS = [
  { label: 'Roxo', value: 'from-[#820AD1] to-[#4A0080]', text: 'text-white', accent: '#820AD1' },
  { label: 'Laranja', value: 'from-[#EC7000] to-[#B84E00]', text: 'text-white', accent: '#EC7000' },
  { label: 'Vermelho', value: 'from-[#CC092F] to-[#8A0020]', text: 'text-white', accent: '#CC092F' },
  { label: 'Azul royal', value: 'from-[#00509F] to-[#003778]', text: 'text-white', accent: '#00509F' },
  { label: 'Preto fosco', value: 'from-[#121212] to-[#2C2C2C]', text: 'text-slate-300', accent: '#121212' },
  { label: 'Amarelo', value: 'from-[#FCFD01] to-[#D4D800]', text: 'text-[#0038A8]', accent: '#FCFD01' },
  { label: 'Verde', value: 'from-[#009B3A] to-[#006B28]', text: 'text-white', accent: '#009B3A' },
  { label: 'Azul marinho', value: 'from-[#001D3D] to-[#000C18]', text: 'text-white', accent: '#001D3D' },
  { label: 'Ciano', value: 'from-[#00E5FF] to-[#0099BB]', text: 'text-slate-900', accent: '#00E5FF' },
  { label: 'Grafite', value: 'from-[#4B5563] to-[#1F2937]', text: 'text-white', accent: '#4B5563' },
  { label: 'Rosa', value: 'from-[#EC4899] to-[#9D174D]', text: 'text-white', accent: '#EC4899' },
  { label: 'Indigo', value: 'from-[#6366F1] to-[#3730A3]', text: 'text-white', accent: '#6366F1' },
];

const emptyForm = {
  name: '',
  brand: '',
  code: '',
  number: '',
  balance: '',
  creditLimit: '',
  creditUsed: '',
  closingDay: '',
  dueDay: '',
  colorIndex: 0,
  invoiceStatus: 'open' as 'open' | 'paid' | 'overdue',
  accountId: '',
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editBank?: Bank;
}

export default function AddCardModal({ isOpen, onClose, editBank }: Props) {
  const { addBank, updateBank, deleteBank, accounts, transactions } = useAppData();
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEditing = !!editBank;

  useEffect(() => {
    if (!isOpen) { setConfirmDelete(false); return; }
    setSearch('');
    if (editBank) {
      const match = INSTITUTIONS.find((p) => p.code === editBank.code);
      const colorIndex = CUSTOM_COLORS.findIndex((c) => c.value === editBank.color);
      setSelectedId(match ? match.id : 'outro');
      setForm({
        name: editBank.name,
        brand: editBank.brand,
        code: editBank.code,
        number: editBank.number.replace(/\*/g, '').trim(),
        balance: formatCurrencyInput(String(Math.round(editBank.balance * 100))),
        creditLimit: editBank.creditLimit != null ? formatCurrencyInput(String(Math.round(editBank.creditLimit * 100))) : '',
        creditUsed: editBank.creditUsed != null ? formatCurrencyInput(String(Math.round(editBank.creditUsed * 100))) : '',
        closingDay: editBank.closingDay ? String(editBank.closingDay) : '',
        dueDay: editBank.dueDay ? String(editBank.dueDay) : '',
        colorIndex: colorIndex >= 0 ? colorIndex : 0,
        invoiceStatus: editBank.invoiceStatus ?? 'open',
        accountId: editBank.accountId ?? '',
      });
    } else {
      setSelectedId('');
      setForm(emptyForm);
    }
  }, [isOpen, editBank]);

  const set = <K extends keyof typeof emptyForm>(k: K, v: typeof emptyForm[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const filteredInstitutions = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return INSTITUTIONS;
    return INSTITUTIONS.filter(
      (i) => i.name.toLowerCase().includes(q) || i.brand.toLowerCase().includes(q),
    );
  }, [search]);

  function selectInstitution(inst: Institution) {
    setSelectedId(inst.id);
    setForm((prev) => ({ ...prev, name: inst.name, brand: inst.brand, code: inst.code, accountId: '' }));
  }

  const inst = useMemo(() => INSTITUTIONS.find((p) => p.id === selectedId), [selectedId]);
  const linkedAccounts = useMemo(
    () => accounts.filter((a) => a.code === inst?.code || a.institutionId === selectedId),
    [accounts, inst, selectedId],
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const balance = parseCurrencyInput(form.balance);
    const creditLimit = form.creditLimit ? parseCurrencyInput(form.creditLimit) : NaN;
    const creditUsed = form.creditUsed ? parseCurrencyInput(form.creditUsed) : 0;
    const closingDay = parseInt(form.closingDay);
    const dueDay = parseInt(form.dueDay);
    if (!form.name || isNaN(balance)) return;
    const launchedAmount = editBank ? getCardCurrentInvoiceFromTransactions(transactions, editBank.id) : 0;
    const baseInvoiceAmount = form.invoiceStatus === 'paid'
      ? 0
      : Math.max(0, creditUsed - launchedAmount);

    const custom = selectedId === 'outro' ? CUSTOM_COLORS[form.colorIndex] : null;
    const color = inst ? inst.color : custom?.value ?? CUSTOM_COLORS[0].value;
    const textColor = inst ? inst.textColor : custom?.text ?? 'text-white';
    const accentColor = inst ? inst.accentColor : custom?.accent ?? '#6B7280';
    const logo = inst ? inst.logo : undefined;

    const rawNumber = form.number.replace(/\D/g, '').slice(-4).padStart(4, '0');
    const data = {
      name: form.name,
      brand: form.brand || form.name.slice(0, 6),
      code: form.code || '000',
      number: `**** **** **** ${rawNumber}`,
      balance,
      color,
      textColor,
      accentColor,
      logo,
      network: inst?.network,
      creditLimit: isNaN(creditLimit) ? undefined : creditLimit,
      creditUsed: isNaN(creditUsed) ? undefined : creditUsed,
      closingDay: isNaN(closingDay) ? undefined : closingDay,
      dueDay: isNaN(dueDay) ? undefined : dueDay,
      invoiceStatus: form.invoiceStatus,
      lastInvoiceAmount: isNaN(creditUsed) ? undefined : baseInvoiceAmount,
      accountId: form.accountId || undefined,
    };

    if (editBank) updateBank(editBank.id, data);
    else addBank(data);

    setForm(emptyForm);
    setSelectedId('');
    onClose();
  }

  const customColor = CUSTOM_COLORS[form.colorIndex];
  const previewColor = inst ? inst.color : customColor?.value ?? CUSTOM_COLORS[0].value;
  const previewText = inst ? inst.textColor : customColor?.text ?? 'text-white';
  const showForm = selectedId !== '';

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-50 text-sm focus:outline-none focus:border-amber-400 transition-colors';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 48, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-140 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl dark:bg-card"
          >
            <div className="shrink-0 px-6 pb-4 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {showForm && !isEditing && (
                    <motion.button
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      type="button"
                      onClick={() => {
                        setSelectedId('');
                        setSearch('');
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15"
                    >
                      <ChevronLeft size={16} />
                    </motion.button>
                  )}
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10">
                    <CreditCard size={18} className="text-amber-500" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                    {isEditing ? 'Editar cartao' : showForm ? (inst?.name ?? 'Outro banco') : 'Novo cartao'}
                  </h2>
                </div>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20"
                >
                  <X size={18} />
                </motion.button>
              </div>
            </div>

            <div className="styled-scrollbar flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {!showForm && (
                  <motion.div
                    key="selector"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.18 }}
                    className="px-6 pb-8"
                  >
                    <p className="mb-3 text-xs text-slate-400">
                      Selecione sua instituicao para configurar o cartao automaticamente.
                    </p>

                    <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
                      <Search size={15} className="shrink-0 text-slate-400" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar instituicao..."
                        className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
                      />
                      {search && (
                        <button type="button" onClick={() => setSearch('')}>
                          <X size={13} className="text-slate-400" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-5 gap-1 pb-8">
                      {filteredInstitutions.map((institution) => (
                        <InstitutionTile
                          key={institution.id}
                          inst={institution}
                          selected={selectedId === institution.id}
                          onClick={() => selectInstitution(institution)}
                        />
                      ))}

                      {(!search || 'outro'.includes(search.toLowerCase())) && (
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.93 }}
                          onClick={() => {
                            setSelectedId('outro');
                            setForm(emptyForm);
                          }}
                          className="flex flex-col items-center gap-1.5 rounded-2xl p-2 transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 shadow-sm dark:bg-white/10">
                            <Pencil size={18} className="text-slate-500 dark:text-slate-400" />
                          </div>
                          <span className="text-center text-[10px] font-semibold text-slate-500 dark:text-slate-400">Outro</span>
                        </motion.button>
                      )}

                      {filteredInstitutions.length === 0 && search && (
                        <p className="col-span-5 py-6 text-center text-xs text-slate-400">
                          Nenhuma instituicao encontrada. Use &quot;Outro&quot; para cadastrar manualmente.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {showForm && (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.18 }}
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-5 px-6 pb-8"
                  >
                    <div className={`relative h-27.5 w-full overflow-hidden rounded-2xl bg-linear-to-br ${previewColor}`}>
                      <div
                        className="absolute right-0 top-0 h-32 w-32 rounded-full opacity-10"
                        style={{ background: 'rgba(255,255,255,0.5)', filter: 'blur(20px)', transform: 'translate(30%,-30%)' }}
                      />
                      <div className="absolute inset-0 z-10 flex flex-col justify-between p-4">
                        <p className={`text-base font-bold opacity-90 ${previewText}`}>
                          {form.brand || form.name || inst?.brand || 'Banco'}
                        </p>
                        <p className={`font-mono text-sm opacity-60 ${previewText}`}>
                          **** **** **** {form.number.replace(/\D/g, '').slice(-4).padStart(4, '0') || '0000'}
                        </p>
                      </div>
                    </div>

                    {selectedId === 'outro' && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Nome do banco *</label>
                            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex: Nubank, Itau..." required className={inputCls} />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Exibicao no cartao</label>
                            <input type="text" value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder="Ex: Nu, BB, C6..." maxLength={10} className={inputCls} />
                          </div>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Codigo COMPE do banco</label>
                          <input type="text" value={form.code} onChange={(e) => set('code', e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="Ex: 260" maxLength={3} className={inputCls} />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Cor do cartao</label>
                          <div className="flex flex-wrap gap-2">
                            {CUSTOM_COLORS.map((c, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => set('colorIndex', i)}
                                title={c.label}
                                className={`h-8 w-8 rounded-xl bg-linear-to-br ${c.value} transition-all ${
                                  form.colorIndex === i ? 'scale-110 ring-2 ring-amber-400 ring-offset-2 dark:ring-offset-card' : 'hover:scale-105'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {selectedId !== 'outro' && inst && (
                      <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-white/8 dark:bg-white/5">
                        <InstitutionLogo inst={inst} />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{inst.name}</span>
                        <span className="ml-auto shrink-0 font-mono text-xs text-slate-400">COMPE {inst.code}</span>
                      </div>
                    )}

                    {selectedId !== 'outro' && inst && (
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Conta vinculada</label>
                        {linkedAccounts.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {linkedAccounts.map((acc) => (
                              <button
                                key={acc.id}
                                type="button"
                                onClick={() => set('accountId', form.accountId === acc.id ? '' : acc.id)}
                                className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                  form.accountId === acc.id
                                    ? 'border-amber-400 bg-amber-50 text-amber-600 dark:border-amber-400 dark:bg-amber-500/10 dark:text-amber-400'
                                    : 'border-slate-200 text-slate-600 hover:border-amber-300 dark:border-white/10 dark:text-slate-300'
                                }`}
                              >
                                {acc.name}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs italic text-slate-400 dark:text-slate-500">
                            Nenhuma conta cadastrada para este banco
                          </p>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Ultimos 4 digitos do cartao</label>
                      <input type="text" value={form.number} onChange={(e) => set('number', e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" maxLength={4} className={`${inputCls} font-mono`} />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Limite de credito disponivel (R$) *</label>
                      <input type="text" inputMode="decimal" value={form.balance} onChange={(e) => set('balance', formatCurrencyInput(e.target.value))} placeholder="0,00" required className={`${inputCls} font-bold`} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Limite de credito aprovado (R$)</label>
                        <input type="text" inputMode="decimal" value={form.creditLimit} onChange={(e) => set('creditLimit', formatCurrencyInput(e.target.value))} placeholder="Limite aprovado" className={inputCls} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Fatura atual (R$)</label>
                        <input type="text" inputMode="decimal" value={form.creditUsed} onChange={(e) => set('creditUsed', formatCurrencyInput(e.target.value))} placeholder="Fatura atual" className={inputCls} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Dia de fechamento</label>
                        <DayStepper value={form.closingDay} onChange={(v) => set('closingDay', v)} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Dia de vencimento</label>
                        <DayStepper value={form.dueDay} onChange={(v) => set('dueDay', v)} />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status da fatura</label>
                      <div className="flex gap-2">
                        {(['open', 'paid', 'overdue'] as const).map((s) => {
                          const labels = { open: 'Em aberto', paid: 'Paga', overdue: 'Atrasada' };
                          const activeColor = { open: 'bg-amber-500 text-white', paid: 'bg-green-500 text-white', overdue: 'bg-red-500 text-white' };
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => set('invoiceStatus', s)}
                              className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${
                                form.invoiceStatus === s ? activeColor[s] : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                              }`}
                            >
                              {labels[s]}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3.5 font-bold text-white shadow-lg transition-colors hover:bg-amber-600"
                    >
                      <Check size={18} />
                      {isEditing ? 'Salvar alteracoes' : 'Adicionar cartao'}
                    </motion.button>

                    {isEditing && (
                      <AnimatePresence mode="wait">
                        {!confirmDelete ? (
                          <motion.button
                            key="del-btn"
                            type="button"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setConfirmDelete(true)}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 dark:border-red-500/30 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={15} />
                            Apagar cartão
                          </motion.button>
                        ) : (
                          <motion.div
                            key="del-confirm"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            className="rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/8 p-4 flex flex-col gap-3"
                          >
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                              <AlertTriangle size={15} className="shrink-0" />
                              <p className="text-sm font-semibold">Confirmar exclusão?</p>
                            </div>
                            <p className="text-xs text-red-500/80 dark:text-red-400/70">
                              O cartão será removido permanentemente. Esta ação não pode ser desfeita.
                            </p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setConfirmDelete(false)}
                                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => { deleteBank(editBank!.id); onClose(); }}
                                className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-xs font-bold text-white transition-colors"
                              >
                                Sim, apagar
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
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
