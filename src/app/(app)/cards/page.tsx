'use client';

import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, CreditCard, History, Pencil, Plus, X } from 'lucide-react';
import BankCard from '@/components/cards/BankCard';
import CardDetailDrawer from '@/components/cards/CardDetailDrawer';
import AccountDetailDrawer from '@/components/cards/AccountDetailDrawer';
import AddCardModal from '@/components/cards/AddCardModal';
import AddAccountModal from '@/components/cards/AddAccountModal';
import { useAppData } from '@/contexts/AppDataContext';
import { Account, Bank } from '@/types';
import { useFabAction } from '@/contexts/FabContext';
import { INSTITUTIONS } from '@/data/institutions';
import { getInstitutionLogoSources } from '@/utils/logoSources';
import { ACCOUNT_TYPE_LABELS } from '@/data/accountTypes';
import { getCardRemainingAvailableLimit } from '@/lib/cardLimits';

const tileFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function AccountTile({
  account,
  selected,
  onClick,
  onEdit,
  onHistory,
}: {
  account: Account;
  selected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onHistory: () => void;
}) {
  const inst = account.institutionId
    ? INSTITUTIONS.find((i) => i.id === account.institutionId)
    : INSTITUTIONS.find((i) => i.code === account.code && i.code !== '000');

  const sources = inst
    ? getInstitutionLogoSources(inst)
    : account.logo ? [account.logo] : [];

  const [srcIdx, setSrcIdx] = useState(0);
  const prevId = useRef(account.id);
  if (prevId.current !== account.id) {
    prevId.current = account.id;
    if (srcIdx !== 0) setSrcIdx(0);
  }

  const failed = srcIdx >= sources.length;

  function handleLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    if (img.naturalWidth <= 16 || img.naturalHeight <= 16) {
      setSrcIdx((i) => i + 1);
    }
  }

  const typeLabel = ACCOUNT_TYPE_LABELS[account.type] ?? account.type;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`group relative flex w-56 shrink-0 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors ${
        selected
          ? 'border-amber-400 bg-amber-50 dark:border-amber-500/60 dark:bg-amber-500/10'
          : 'border-slate-100 bg-white hover:border-amber-200 dark:border-white/8 dark:bg-card dark:hover:border-amber-500/30'
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm dark:bg-white/90">
        {!failed && sources.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sources[srcIdx]}
            alt={account.name}
            width={44}
            height={44}
            className="h-11 w-11 object-cover"
            onError={() => setSrcIdx((i) => i + 1)}
            onLoad={handleLoad}
          />
        ) : (
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full text-xs font-extrabold text-white"
            style={{ background: account.accentColor }}
          >
            {account.brand.slice(0, 2)}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{account.name}</p>
        <p className="mt-0.5 text-base font-bold text-slate-900 dark:text-slate-50">
          {tileFmt.format(account.balance)}
        </p>
        <div className="mt-1 flex flex-col gap-0.5">
          <span className="self-start rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-400">
            {typeLabel}
          </span>
          {(account.agency || account.accountNumber) && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400 dark:text-slate-500">
              {account.agency && <>Ag. **{account.agency.slice(-2)}</>}
              {account.agency && account.accountNumber && <span className="opacity-40">·</span>}
              {account.accountNumber && <>...{account.accountNumber.slice(-3)}</>}
            </span>
          )}
        </div>
      </div>

      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 transition-all group-hover:opacity-100">
        <button
          onClick={(e) => { e.stopPropagation(); onHistory(); }}
          className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-400 hover:bg-amber-50 hover:text-amber-500 dark:bg-white/10 dark:hover:bg-amber-500/10 transition-colors"
          title="Ver histórico"
        >
          <History size={11} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-400 hover:bg-amber-50 hover:text-amber-500 dark:bg-white/10 dark:hover:bg-amber-500/10 transition-colors"
          title="Editar conta"
        >
          <Pencil size={11} />
        </button>
      </div>

      {selected && (
        <div className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500">
          <X size={8} className="text-white" strokeWidth={3} />
        </div>
      )}
    </motion.div>
  );
}

export default function CardsPage() {
  const { banks, accounts, transactions } = useAppData();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [detailBankId, setDetailBankId] = useState<string | null>(null);
  const [detailAccount, setDetailAccount] = useState<Account | null>(null);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | undefined>();

  useFabAction({ label: 'Novo cartao', onClick: () => setCardModalOpen(true) });

  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });

  function onDragStart(e: React.MouseEvent) {
    const el = scrollRef.current;
    if (!el) return;
    drag.current = {
      active: true,
      startX: e.pageX - el.offsetLeft,
      scrollLeft: el.scrollLeft,
      moved: false,
    };
    el.style.cursor = 'grabbing';
  }

  function onDragMove(e: React.MouseEvent) {
    const d = drag.current;
    if (!d.active) return;
    e.preventDefault();
    const el = scrollRef.current;
    if (!el) return;
    const delta = e.pageX - el.offsetLeft - d.startX;
    if (Math.abs(delta) > 4) d.moved = true;
    el.scrollLeft = d.scrollLeft - delta;
  }

  function onDragEnd() {
    drag.current.active = false;
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab';
  }

  function onClickCapture(e: React.MouseEvent) {
    if (drag.current.moved) {
      e.stopPropagation();
      drag.current.moved = false;
    }
  }

  const filteredCards = selectedAccountId
    ? banks.filter((b) => b.accountId === selectedAccountId)
    : banks;

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const detailBank = detailBankId ? banks.find((b) => b.id === detailBankId) ?? null : null;

  const fmt = (v: number) => tileFmt.format(v);

  const totalBalance = useMemo(
    () => accounts.reduce((s, a) => s + a.balance, 0),
    [accounts],
  );
  const totalCreditAvail = useMemo(
    () => banks.reduce((s, b) => s + getCardRemainingAvailableLimit(b), 0),
    [banks],
  );

  const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
  const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="p-8"
      >
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">Gerenciar</p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Contas e Cartoes</h1>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setAccountModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-amber-300 dark:border-white/10 dark:bg-card dark:text-slate-200 dark:hover:border-amber-500/40"
            >
              <Building2 size={15} className="text-amber-500" />
              Nova conta
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setCardModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-600"
            >
              <CreditCard size={15} />
              Novo cartao
            </motion.button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 dark:border-white/8 dark:bg-card">
            <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">Total em contas</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{fmt(totalBalance)}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 dark:border-white/8 dark:bg-card">
            <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">Credito disponivel</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{fmt(totalCreditAvail)}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 dark:border-white/8 dark:bg-card">
            <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">Contas ativas</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{accounts.length}</p>
          </div>
        </div>

        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-700 dark:text-slate-200">Contas</h2>
            <AnimatePresence>
              {selectedAccountId && (
                <motion.button
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  onClick={() => setSelectedAccountId(null)}
                  className="text-xs font-semibold text-amber-500 transition-colors hover:text-amber-600"
                >
                  Ver todos os cartoes
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
            className="cursor-grab select-none overflow-x-auto pb-8 no-scrollbar"
          >
            <div className="flex gap-3 px-1 py-5">
              {accounts.map((account) => (
                <AccountTile
                  key={account.id}
                  account={account}
                  selected={selectedAccountId === account.id}
                  onClick={() => setSelectedAccountId((prev) => (prev === account.id ? null : account.id))}
                  onEdit={() => {
                    setEditAccount(account);
                    setAccountModalOpen(true);
                  }}
                  onHistory={() => setDetailAccount(account)}
                />
              ))}

              {accounts.length === 0 && (
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setAccountModalOpen(true)}
                  className="group relative flex min-h-[144px] w-56 shrink-0 cursor-pointer flex-col items-center justify-center gap-4 rounded-[28px] border border-amber-200/90 bg-gradient-to-br from-amber-50 via-white to-amber-50/60 px-6 py-6 text-center shadow-[0_14px_34px_rgba(245,158,11,0.08)] transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-[0_20px_44px_rgba(245,158,11,0.14)] dark:border-amber-500/25 dark:from-amber-500/10 dark:via-card dark:to-card"
                >
                  <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent dark:via-amber-500/30" />
                  <div className="mt-1 flex h-8 w-14 items-center justify-center rounded-full bg-white/90 text-amber-500 shadow-sm ring-1 ring-amber-100 transition-transform group-hover:scale-105 dark:bg-white/10 dark:ring-amber-500/20">
                    <Plus size={20} />
                  </div>
                  <div className="max-w-[176px] space-y-1.5 px-1">
                    <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Nova conta</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      Adicione uma conta para organizar seus saldos.
                    </span>
                  </div>
                </motion.button>
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-5 flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-700 dark:text-slate-200">Cartoes</h2>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {filteredCards.length} {filteredCards.length === 1 ? 'cartao' : 'cartoes'}
            </span>
            <AnimatePresence>
              {selectedAccount && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400"
                >
                  {selectedAccount.name}
                  <button onClick={() => setSelectedAccountId(null)}>
                    <X size={11} />
                  </button>
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <motion.div
            key={selectedAccountId ?? 'all'}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-x-6 gap-y-8 xl:grid-cols-3"
          >
            {filteredCards.map((bank) => (
              <motion.div key={bank.id} variants={itemVariants}>
                <BankCard
                  bank={bank}
                  onClick={() => setDetailBankId(bank.id)}
                  showCreditBar
                />
              </motion.div>
            ))}

            {!selectedAccountId && banks.length === 0 && (
              <motion.div variants={itemVariants}>
                <motion.div
                  onClick={() => setCardModalOpen(true)}
                  whileHover={{ scale: 1.03, y: -4 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="group relative flex h-[176px] w-[280px] cursor-pointer flex-col items-center justify-center gap-4 rounded-[30px] border border-amber-200/90 bg-gradient-to-br from-amber-50 via-white to-amber-50/45 px-7 py-7 text-center shadow-[0_14px_34px_rgba(245,158,11,0.08)] transition-all hover:border-amber-300 hover:shadow-[0_20px_44px_rgba(245,158,11,0.14)] dark:border-amber-500/25 dark:from-amber-500/10 dark:via-card dark:to-card"
                >
                  <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent dark:via-amber-500/30" />
                  <div className="mt-1 flex h-8 w-14 items-center justify-center rounded-full bg-white/90 text-amber-500 shadow-sm ring-1 ring-amber-100 transition-transform group-hover:scale-105 dark:bg-white/10 dark:ring-amber-500/20">
                    <Plus size={20} strokeWidth={2.25} />
                  </div>
                  <div className="max-w-[206px] space-y-2 px-2">
                    <span className="block text-base font-semibold text-slate-700 dark:text-slate-200">Adicionar cartao</span>
                    <span className="block text-sm text-slate-500 dark:text-slate-400">
                      Cadastre um cartao para acompanhar limite e fatura.
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </section>
      </motion.div>

      <CardDetailDrawer
        bank={detailBank}
        transactions={transactions}
        onClose={() => setDetailBankId(null)}
      />
      <AccountDetailDrawer
        account={detailAccount}
        banks={banks}
        transactions={transactions}
        onClose={() => setDetailAccount(null)}
      />
      <AddAccountModal
        isOpen={accountModalOpen}
        onClose={() => {
          setAccountModalOpen(false);
          setEditAccount(undefined);
        }}
        editAccount={editAccount}
      />
      <AddCardModal
        isOpen={cardModalOpen}
        onClose={() => setCardModalOpen(false)}
      />
    </>
  );
}
