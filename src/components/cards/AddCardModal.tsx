'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, CreditCard, ChevronLeft, Pencil, Minus, Plus, Search } from 'lucide-react';
import { useAppData } from '@/contexts/AppDataContext';
import { Bank } from '@/types';
import { INSTITUTIONS, Institution } from '@/data/institutions';
import InstitutionTile from '@/components/ui/InstitutionTile';

// ── Day stepper ───────────────────────────────────────────────────────────────
function DayStepper({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const num = parseInt(value) || 0;
  const dec = () => onChange(String(Math.max(1, num - 1)));
  const inc = () => onChange(String(Math.min(31, num + 1)));
  return (
    <div className="flex items-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 overflow-hidden h-10">
      <button type="button" onClick={dec} className="w-10 h-full flex items-center justify-center text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors shrink-0">
        <Minus size={14} />
      </button>
      <input
        type="number" min="1" max="31" value={value} placeholder="—"
        onChange={(e) => {
          const v = parseInt(e.target.value);
          if (!e.target.value) { onChange(''); return; }
          if (v >= 1 && v <= 31) onChange(String(v));
        }}
        className="flex-1 min-w-0 text-center text-sm font-bold text-slate-800 dark:text-slate-100 bg-transparent outline-none"
      />
      <button type="button" onClick={inc} className="w-10 h-full flex items-center justify-center text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors shrink-0">
        <Plus size={14} />
      </button>
    </div>
  );
}

// ── Custom color presets ──────────────────────────────────────────────────────
const CUSTOM_COLORS = [
  { label: 'Roxo',         value: 'from-[#820AD1] to-[#4A0080]', text: 'text-white',         accent: '#820AD1' },
  { label: 'Laranja',      value: 'from-[#EC7000] to-[#B84E00]', text: 'text-white',         accent: '#EC7000' },
  { label: 'Vermelho',     value: 'from-[#CC092F] to-[#8A0020]', text: 'text-white',         accent: '#CC092F' },
  { label: 'Azul royal',   value: 'from-[#00509F] to-[#003778]', text: 'text-white',         accent: '#00509F' },
  { label: 'Preto fosco',  value: 'from-[#121212] to-[#2C2C2C]', text: 'text-slate-300',     accent: '#121212' },
  { label: 'Amarelo',      value: 'from-[#FCFD01] to-[#D4D800]', text: 'text-[#0038A8]',     accent: '#FCFD01' },
  { label: 'Verde',        value: 'from-[#009B3A] to-[#006B28]', text: 'text-white',         accent: '#009B3A' },
  { label: 'Azul marinho', value: 'from-[#001D3D] to-[#000C18]', text: 'text-white',         accent: '#001D3D' },
  { label: 'Ciano',        value: 'from-[#00E5FF] to-[#0099BB]', text: 'text-slate-900',     accent: '#00E5FF' },
  { label: 'Grafite',      value: 'from-[#4B5563] to-[#1F2937]', text: 'text-white',         accent: '#4B5563' },
  { label: 'Rosa',         value: 'from-[#EC4899] to-[#9D174D]', text: 'text-white',         accent: '#EC4899' },
  { label: 'Índigo',       value: 'from-[#6366F1] to-[#3730A3]', text: 'text-white',         accent: '#6366F1' },
];

const emptyForm = {
  name: '', brand: '', code: '', number: '',
  balance: '', creditLimit: '', creditUsed: '',
  closingDay: '', dueDay: '', colorIndex: 0,
  invoiceStatus: 'open' as 'open' | 'paid' | 'overdue',
  accountId: '',
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editBank?: Bank;
}

export default function AddCardModal({ isOpen, onClose, editBank }: Props) {
  const { addBank, updateBank, accounts } = useAppData();
  const [form, setForm]             = useState(emptyForm);
  const [selectedId, setSelectedId] = useState<string>('');   // '' = picking
  const [search, setSearch]         = useState('');
  const isEditing = !!editBank;

  useEffect(() => {
    if (!isOpen) return;
    setSearch('');
    if (editBank) {
      const match = INSTITUTIONS.find((p) => p.code === editBank.code);
      const colorIndex = CUSTOM_COLORS.findIndex((c) => c.value === editBank.color);
      setSelectedId(match ? match.id : 'outro');
      setForm({
        name: editBank.name, brand: editBank.brand, code: editBank.code,
        number: editBank.number.replace(/\*/g, '').trim(),
        balance: String(editBank.balance),
        creditLimit: editBank.creditLimit ? String(editBank.creditLimit) : '',
        creditUsed:  editBank.creditUsed  ? String(editBank.creditUsed)  : '',
        closingDay:  editBank.closingDay  ? String(editBank.closingDay)  : '',
        dueDay:      editBank.dueDay      ? String(editBank.dueDay)      : '',
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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const balance     = parseFloat(form.balance.replace(',', '.'));
    const creditLimit = parseFloat(form.creditLimit.replace(',', '.'));
    const creditUsed  = parseFloat((form.creditUsed || '0').replace(',', '.'));
    const closingDay  = parseInt(form.closingDay);
    const dueDay      = parseInt(form.dueDay);
    if (!form.name || isNaN(balance)) return;

    const custom = selectedId === 'outro' ? CUSTOM_COLORS[form.colorIndex] : null;
    const color       = inst ? inst.color       : custom?.value ?? CUSTOM_COLORS[0].value;
    const textColor   = inst ? inst.textColor   : custom?.text  ?? 'text-white';
    const accentColor = inst ? inst.accentColor : custom?.accent ?? '#6B7280';
    const logo        = inst ? inst.logo : undefined;

    const rawNumber = form.number.replace(/\D/g, '').slice(-4).padStart(4, '0');
    const data = {
      name: form.name,
      brand: form.brand || form.name.slice(0, 6),
      code: form.code || '000',
      number: `**** **** **** ${rawNumber}`,
      balance, color, textColor, accentColor, logo,
      network: inst?.network,
      creditLimit: isNaN(creditLimit) ? undefined : creditLimit,
      creditUsed:  isNaN(creditUsed)  ? undefined : creditUsed,
      closingDay:  isNaN(closingDay)  ? undefined : closingDay,
      dueDay:      isNaN(dueDay)      ? undefined : dueDay,
      invoiceStatus: form.invoiceStatus,
      lastInvoiceAmount: editBank?.lastInvoiceAmount,
      accountId: form.accountId || undefined,
    };

    if (editBank) updateBank(editBank.id, data);
    else addBank(data);

    setForm(emptyForm);
    setSelectedId('');
    onClose();
  }

  const inst        = useMemo(() => INSTITUTIONS.find((p) => p.id === selectedId), [selectedId]);
  const linkedAccounts = useMemo(
    () => accounts.filter((a) => a.code === inst?.code || a.institutionId === selectedId),
    [accounts, inst, selectedId]
  );
  const customColor = CUSTOM_COLORS[form.colorIndex];
  const previewColor  = inst ? inst.color      : customColor?.value ?? CUSTOM_COLORS[0].value;
  const previewText   = inst ? inst.textColor  : customColor?.text  ?? 'text-white';
  const showForm      = selectedId !== '';

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
                  <CreditCard size={18} className="text-amber-500" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                  {isEditing ? 'Editar Cartão' : showForm ? (inst?.name ?? 'Outro banco') : 'Novo Cartão'}
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

                {/* ── STEP 1: Institution picker ── */}
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
                      Selecione sua instituição para configurar o cartão automaticamente.
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

                    {/* Logo grid — pb-8 gives space for tooltips */}
                    <div className="grid grid-cols-5 gap-1 pb-8">
                      {filteredInstitutions.map((inst) => (
                        <InstitutionTile
                          key={inst.id}
                          inst={inst}
                          selected={selectedId === inst.id}
                          onClick={() => selectInstitution(inst)}
                        />
                      ))}

                      {/* Outro */}
                      {(!search || 'outro'.includes(search.toLowerCase())) && (
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}
                          onClick={() => { setSelectedId('outro'); setForm(emptyForm); }}
                          className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center shadow-sm">
                            <Pencil size={18} className="text-slate-500 dark:text-slate-400" />
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 text-center">Outro</span>
                        </motion.button>
                      )}

                      {filteredInstitutions.length === 0 && search && (
                        <p className="col-span-5 text-center text-xs text-slate-400 py-6">
                          Nenhuma instituição encontrada. Use &quot;Outro&quot; para cadastrar manualmente.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 2: Form ── */}
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
                    {/* Card preview */}
                    <div className={`w-full h-27.5 rounded-2xl bg-linear-to-br ${previewColor} relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: 'rgba(255,255,255,0.5)', filter: 'blur(20px)', transform: 'translate(30%,-30%)' }} />
                      <div className="absolute inset-0 flex flex-col justify-between p-4 z-10">
                        <p className={`text-base font-bold ${previewText} opacity-90`}>
                          {form.brand || form.name || inst?.brand || 'Banco'}
                        </p>
                        <p className={`text-sm font-mono ${previewText} opacity-60`}>
                          **** **** **** {form.number.replace(/\D/g, '').slice(-4).padStart(4, '0') || '0000'}
                        </p>
                      </div>
                    </div>

                    {/* Manual fields — only for "Outro" */}
                    {selectedId === 'outro' && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Nome do banco *</label>
                            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex: Nubank, Itaú..." required className={inputCls} />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Exibição no cartão</label>
                            <input type="text" value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder="Ex: Nu, BB, C6..." maxLength={10} className={inputCls} />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Código COMPE do banco</label>
                          <input type="text" value={form.code} onChange={(e) => set('code', e.target.value.replace(/\D/g, '').slice(0, 3))} placeholder="Ex: 260" maxLength={3} className={inputCls} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">Cor do cartão</label>
                          <div className="flex flex-wrap gap-2">
                            {CUSTOM_COLORS.map((c, i) => (
                              <button key={i} type="button" onClick={() => set('colorIndex', i)} title={c.label}
                                className={`w-8 h-8 rounded-xl bg-linear-to-br ${c.value} transition-all ${form.colorIndex === i ? 'scale-110 ring-2 ring-offset-2 ring-amber-400 dark:ring-offset-card' : 'hover:scale-105'}`}
                              />
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Selected institution info pill */}
                    {selectedId !== 'outro' && inst && (
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/8">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/90 flex items-center justify-center shadow overflow-hidden shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={inst.logo} alt={inst.name} width={24} height={24} className="w-6 h-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{inst.name}</span>
                        <span className="ml-auto text-xs text-slate-400 font-mono shrink-0">COMPE {inst.code}</span>
                      </div>
                    )}

                    {/* Account linking — only for known institutions */}
                    {selectedId !== 'outro' && inst && (
                      <div>
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">Conta vinculada</label>
                        {linkedAccounts.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {linkedAccounts.map((acc) => (
                              <button
                                key={acc.id}
                                type="button"
                                onClick={() => set('accountId', form.accountId === acc.id ? '' : acc.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                                  form.accountId === acc.id
                                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-400 text-amber-600 dark:text-amber-400'
                                    : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-amber-300'
                                }`}
                              >
                                {acc.name}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                            Nenhuma conta cadastrada para este banco
                          </p>
                        )}
                      </div>
                    )}

                    {/* Last 4 digits */}
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Últimos 4 dígitos do cartão</label>
                      <input type="text" value={form.number} onChange={(e) => set('number', e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" maxLength={4} className={`${inputCls} font-mono`} />
                    </div>

                    {/* Balance */}
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Saldo atual (R$) *</label>
                      <input type="number" step="0.01" min="0" value={form.balance} onChange={(e) => set('balance', e.target.value)} placeholder="0,00" required className={`${inputCls} font-bold`} />
                    </div>

                    {/* Credit limit */}
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Limite de crédito (R$)</label>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="number" step="0.01" min="0" value={form.creditLimit} onChange={(e) => set('creditLimit', e.target.value)} placeholder="Limite total" className={inputCls} />
                        <input type="number" step="0.01" min="0" value={form.creditUsed}  onChange={(e) => set('creditUsed',  e.target.value)} placeholder="Fatura atual"  className={inputCls} />
                      </div>
                    </div>

                    {/* Closing + Due */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Dia de fechamento</label>
                        <DayStepper value={form.closingDay} onChange={(v) => set('closingDay', v)} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">Dia de vencimento</label>
                        <DayStepper value={form.dueDay} onChange={(v) => set('dueDay', v)} />
                      </div>
                    </div>

                    {/* Invoice status */}
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">Status da fatura</label>
                      <div className="flex gap-2">
                        {(['open', 'paid', 'overdue'] as const).map((s) => {
                          const labels      = { open: 'Em aberto', paid: 'Paga', overdue: 'Atrasada' };
                          const activeColor = { open: 'bg-amber-500 text-white', paid: 'bg-green-500 text-white', overdue: 'bg-red-500 text-white' };
                          return (
                            <button key={s} type="button" onClick={() => set('invoiceStatus', s)}
                              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${form.invoiceStatus === s ? activeColor[s] : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'}`}
                            >
                              {labels[s]}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="w-full py-3.5 rounded-2xl font-bold text-white bg-amber-500 hover:bg-amber-600 flex items-center justify-center gap-2 shadow-lg mt-1 transition-colors"
                    >
                      <Check size={18} />
                      {isEditing ? 'Salvar alterações' : 'Adicionar cartão'}
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
