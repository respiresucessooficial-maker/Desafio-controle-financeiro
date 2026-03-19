'use client';

import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Building2, CreditCard, X, Pencil } from 'lucide-react';
import BankCard from '@/components/cards/BankCard';
import CardDetailDrawer from '@/components/cards/CardDetailDrawer';
import AddCardModal from '@/components/cards/AddCardModal';
import AddAccountModal from '@/components/cards/AddAccountModal';
import { useAppData } from '@/contexts/AppDataContext';
import { Account, Bank } from '@/types';
import { useFabAction } from '@/contexts/FabContext';
import { INSTITUTIONS } from '@/data/institutions';
import { getInstitutionLogoSources } from '@/utils/logoSources';
import { ACCOUNT_TYPE_LABELS } from '@/data/accountTypes';

// Currency formatter — created once, not per render
const tileFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

// ── Account tile ──────────────────────────────────────────────────────────────
function AccountTile({
  account,
  selected,
  onClick,
  onEdit,
}: {
  account: Account;
  selected: boolean;
  onClick: () => void;
  onEdit: () => void;
}) {
  const inst = account.institutionId
    ? INSTITUTIONS.find((i) => i.id === account.institutionId)
    : INSTITUTIONS.find((i) => i.code === account.code && i.code !== '000');

  const sources = inst
    ? getInstitutionLogoSources(inst)
    : account.logo ? [account.logo] : [];

  const [srcIdx, setSrcIdx] = useState(0);
  const prevId = useRef(account.id);
  if (prevId.current !== account.id) { prevId.current = account.id; if (srcIdx !== 0) setSrcIdx(0); }
  const failed = srcIdx >= sources.length;

  function handleLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    if (img.naturalWidth <= 16 || img.naturalHeight <= 16) setSrcIdx((i) => i + 1);
  }

  const typeLabel = ACCOUNT_TYPE_LABELS[account.type] ?? account.type;

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-2xl border shrink-0 w-56 text-left transition-colors ${
        selected
          ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-400 dark:border-amber-500/60'
          : 'bg-white dark:bg-card border-slate-100 dark:border-white/8 hover:border-amber-200 dark:hover:border-amber-500/30'
      }`}
    >
      {/* Logo */}
      <div className="w-11 h-11 rounded-full bg-white dark:bg-white/90 flex items-center justify-center shadow-sm overflow-hidden shrink-0">
        {!failed && sources.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sources[srcIdx]}
            alt={account.name}
            width={44}
            height={44}
            className="w-11 h-11 object-cover"
            onError={() => setSrcIdx((i) => i + 1)}
            onLoad={handleLoad}
          />
        ) : (
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-extrabold text-white"
            style={{ background: account.accentColor }}
          >
            {account.brand.slice(0, 2)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{account.name}</p>
        <p className="text-base font-bold text-slate-900 dark:text-slate-50 mt-0.5">
          {tileFmt.format(account.balance)}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400">
            {typeLabel}
          </span>
          {account.agency && (
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              Ag. **{account.agency.slice(-2)}
            </span>
          )}
          {account.accountNumber && (
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              ···{account.accountNumber.slice(-3)}
            </span>
          )}
        </div>
      </div>

      {/* Edit button — shown on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="absolute bottom-2 right-2 w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-all"
      >
        <Pencil size={11} />
      </button>

      {/* Selected indicator */}
      {selected && (
        <div className="absolute top-2 right-2 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
          <X size={8} className="text-white" strokeWidth={3} />
        </div>
      )}
    </motion.button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CardsPage() {
  const { banks, accounts, transactions } = useAppData();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [detailBank, setDetailBank]               = useState<Bank | null>(null);
  const [accountModalOpen, setAccountModalOpen]   = useState(false);
  const [cardModalOpen, setCardModalOpen]         = useState(false);
  const [editAccount, setEditAccount]             = useState<Account | undefined>();

  useFabAction({ label: 'Novo cartão', onClick: () => setCardModalOpen(true) });

  // ── Drag-to-scroll for accounts row ────────────────────────────────────────
  const scrollRef  = useRef<HTMLDivElement>(null);
  const drag       = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });

  function onDragStart(e: React.MouseEvent) {
    const el = scrollRef.current; if (!el) return;
    drag.current = { active: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft, moved: false };
    el.style.cursor = 'grabbing';
  }
  function onDragMove(e: React.MouseEvent) {
    const d = drag.current; if (!d.active) return;
    e.preventDefault();
    const el = scrollRef.current; if (!el) return;
    const delta = e.pageX - el.offsetLeft - d.startX;
    if (Math.abs(delta) > 4) d.moved = true;
    el.scrollLeft = d.scrollLeft - delta;
  }
  function onDragEnd() {
    drag.current.active = false;
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab';
  }
  function onClickCapture(e: React.MouseEvent) {
    if (drag.current.moved) { e.stopPropagation(); drag.current.moved = false; }
  }

  // Filter cards by selected account (via accountId link)
  const filteredCards = selectedAccountId
    ? banks.filter((b) => b.accountId === selectedAccountId)
    : banks;

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  const fmt = (v: number) => tileFmt.format(v);

  const totalBalance     = useMemo(() => accounts.reduce((s, a) => s + a.balance, 0), [accounts]);
  const totalCreditAvail = useMemo(() => banks.reduce((s, b) => s + Math.max(0, (b.creditLimit ?? 0) - (b.creditUsed ?? 0)), 0), [banks]);

  const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
  const itemVariants      = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="p-8"
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Gerenciar</p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Contas e Cartões</h1>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setAccountModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold bg-white dark:bg-card border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-amber-300 dark:hover:border-amber-500/40 transition-colors shadow-sm"
            >
              <Building2 size={15} className="text-amber-500" />
              Nova conta
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setCardModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-sm"
            >
              <CreditCard size={15} />
              Novo cartão
            </motion.button>
          </div>
        </div>

        {/* ── Summary ── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-card rounded-2xl p-5 border border-slate-100 dark:border-white/8">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Total em contas</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{fmt(totalBalance)}</p>
          </div>
          <div className="bg-white dark:bg-card rounded-2xl p-5 border border-slate-100 dark:border-white/8">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Crédito disponível</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{fmt(totalCreditAvail)}</p>
          </div>
          <div className="bg-white dark:bg-card rounded-2xl p-5 border border-slate-100 dark:border-white/8">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Contas ativas</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{accounts.length}</p>
          </div>
        </div>

        {/* ── Contas ── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-700 dark:text-slate-200">Contas</h2>
            <AnimatePresence>
              {selectedAccountId && (
                <motion.button
                  initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                  onClick={() => setSelectedAccountId(null)}
                  className="text-xs font-semibold text-amber-500 hover:text-amber-600 transition-colors"
                >
                  Ver todos os cartões
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <div
            ref={scrollRef}
            onMouseDown={onDragStart}
            onMouseMove={onDragMove}
            onMouseUp={onDragEnd}
            onMouseLeave={onDragEnd}
            onClickCapture={onClickCapture}
            className="overflow-x-auto no-scrollbar cursor-grab select-none"
          >
          <div className="flex gap-3 px-1 py-3">
            {accounts.map((account) => (
              <AccountTile
                key={account.id}
                account={account}
                selected={selectedAccountId === account.id}
                onClick={() => setSelectedAccountId((prev) => (prev === account.id ? null : account.id))}
                onEdit={() => { setEditAccount(account); setAccountModalOpen(true); }}
              />
            ))}

            {/* Add account */}
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}
              onClick={() => setAccountModalOpen(true)}
              className="flex flex-col items-center justify-center gap-2 w-56 shrink-0 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-white dark:bg-card hover:border-amber-300 dark:hover:border-amber-500/40 hover:bg-amber-50/30 dark:hover:bg-amber-500/5 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                <Plus size={18} className="text-amber-500" />
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Nova conta</span>
            </motion.button>
          </div>
          </div>
        </section>

        {/* ── Cartões ── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-base font-bold text-slate-700 dark:text-slate-200">Cartões</h2>
            <AnimatePresence>
              {selectedAccount && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-full text-xs font-semibold text-amber-600 dark:text-amber-400"
                >
                  {selectedAccount.name}
                  <button onClick={() => setSelectedAccountId(null)}>
                    <X size={11} />
                  </button>
                </motion.span>
              )}
            </AnimatePresence>
            <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
              {filteredCards.length} {filteredCards.length === 1 ? 'cartão' : 'cartões'}
            </span>
          </div>

          <motion.div
            key={selectedAccountId ?? 'all'}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-8"
          >
            {filteredCards.map((bank) => (
              <motion.div key={bank.id} variants={itemVariants}>
                <BankCard bank={bank} onClick={() => setDetailBank(bank)} showCreditBar />
              </motion.div>
            ))}

            {/* Add card */}
            {!selectedAccountId && (
              <motion.div variants={itemVariants}>
                <motion.div
                  onClick={() => setCardModalOpen(true)}
                  whileHover={{ scale: 1.03, y: -4 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-70 h-41.25 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-white dark:bg-card flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-amber-300 dark:hover:border-amber-500/50 hover:bg-amber-50/30 dark:hover:bg-amber-500/5 transition-colors"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                    <Plus size={22} className="text-amber-500" />
                  </div>
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Adicionar cartão</span>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </section>
      </motion.div>

      {/* Modals */}
      <CardDetailDrawer
        bank={detailBank}
        transactions={transactions}
        onClose={() => setDetailBank(null)}
      />
      <AddAccountModal
        isOpen={accountModalOpen}
        onClose={() => { setAccountModalOpen(false); setEditAccount(undefined); }}
        editAccount={editAccount}
      />
      <AddCardModal
        isOpen={cardModalOpen}
        onClose={() => setCardModalOpen(false)}
      />
    </>
  );
}
