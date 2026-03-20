'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CreditCard, Plus } from 'lucide-react';
import BankCard from '@/components/cards/BankCard';
import CardDetailDrawer from '@/components/cards/CardDetailDrawer';
import { useAppData } from '@/contexts/AppDataContext';
import { Bank } from '@/types';

interface BankCardCarouselProps {
  showTitle?: boolean;
}

export default function BankCardCarousel({ showTitle = true }: BankCardCarouselProps) {
  const { banks, transactions } = useAppData();
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);

  const topCards = [...banks]
    .sort((a, b) => (b.creditUsed ?? 0) - (a.creditUsed ?? 0))
    .slice(0, 5);

  return (
    <>
      <div className="relative">
        {showTitle && (
          <h2 className="mb-4 text-sm font-bold text-slate-900 dark:text-slate-50">Meus Cartoes</h2>
        )}

        {topCards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                <CreditCard size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Nenhum cartao cadastrado</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Adicione seu primeiro cartao para acompanhar limites, faturas e saldo em um so lugar.
                </p>
                <div className="mt-4">
                  <Link
                    href="/cards"
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
                  >
                    <Plus size={16} />
                    Adicionar cartao
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="-my-4">
            <div className="flex gap-4 overflow-x-auto no-scrollbar px-1 py-4 pr-6">
              {topCards.map((bank) => (
                <div key={bank.id} className="flex-shrink-0">
                  <BankCard bank={bank} onClick={() => setSelectedBank(bank)} />
                </div>
              ))}

              <Link href="/cards" className="flex-shrink-0 self-center" title="Ver todos os cartoes">
                <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl bg-amber-500 shadow-lg transition-colors hover:bg-amber-600">
                  <ArrowRight size={18} className="text-white" />
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>

      <CardDetailDrawer
        bank={selectedBank}
        transactions={transactions}
        onClose={() => setSelectedBank(null)}
      />
    </>
  );
}
