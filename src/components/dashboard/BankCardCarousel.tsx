'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import BankCard from '@/components/cards/BankCard';
import CardDetailDrawer from '@/components/cards/CardDetailDrawer';
import { useAppData } from '@/contexts/AppDataContext';
import { Bank } from '@/types';

export default function BankCardCarousel() {
  const { banks, transactions } = useAppData();
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);

  // Top 4 most-used cards (by creditUsed desc)
  const topCards = [...banks]
    .sort((a, b) => (b.creditUsed ?? 0) - (a.creditUsed ?? 0))
    .slice(0, 5);

  return (
    <>
      <div className="relative">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-4">Meus Cartões</h2>

        {/* -my-4 compensates the py-4 padding needed for hover animation room */}
        <div className="-my-4">
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-4 px-1 pr-6">
            {topCards.map((bank) => (
              <div key={bank.id} className="flex-shrink-0">
                <BankCard bank={bank} onClick={() => setSelectedBank(bank)} />
              </div>
            ))}

            {/* Ver todos */}
            <Link href="/cards" className="flex-shrink-0 self-center" title="Ver todos os cartões">
              <div className="w-10 h-10 flex items-center justify-center rounded-2xl bg-amber-500 hover:bg-amber-600 transition-colors cursor-pointer shadow-lg">
                <ArrowRight size={18} className="text-white" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      <CardDetailDrawer
        bank={selectedBank}
        transactions={transactions}
        onClose={() => setSelectedBank(null)}
      />
    </>
  );
}
