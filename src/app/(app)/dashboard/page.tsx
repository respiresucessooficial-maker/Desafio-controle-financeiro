'use client';

import { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import TransactionFormModal from '@/components/transactions/TransactionFormModal';
import { useFabAction } from '@/contexts/FabContext';
import { SlidersHorizontal, X, Plus } from 'lucide-react';
import { useWidgetConfig } from '@/hooks/useWidgetConfig';
import AlertBannerList from '@/components/dashboard/AlertBannerList';
import DashboardWidget from '@/components/dashboard/DashboardWidget';
import BalanceHeader from '@/components/dashboard/BalanceHeader';
import BankCardCarousel from '@/components/dashboard/BankCardCarousel';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import FinancialHealth from '@/components/dashboard/FinancialHealth';
import { useAuth } from '@/contexts/AuthContext';

function renderWidgetContent(isEditMode: boolean): Record<string, React.ReactNode> {
  return {
    balance: <BalanceHeader />,
    cards: <BankCardCarousel showTitle={!isEditMode} />,
    transactions: <RecentTransactions showTitle={!isEditMode} />,
    health: <FinancialHealth showTitle={!isEditMode} />,
  };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function formatFullDate() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function DashboardPage() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const { widgets, reorder, toggleVisibility } = useWidgetConfig();
  const { user } = useAuth();

  useFabAction({ label: 'Nova transação', onClick: () => setTxModalOpen(true) });

  const firstName = ((user?.user_metadata?.full_name as string | undefined) ?? user?.email?.split('@')[0] ?? '')
    .split(' ')[0];

  const cardsWidget  = widgets.find((w) => w.id === 'cards');
  const healthWidget = widgets.find((w) => w.id === 'health');
  const widgetContent = renderWidgetContent(isEditMode);

  const dateStr = formatFullDate();
  const capitalizedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  return (
    <>
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0f]">

        {/* ── Top bar ── */}
        <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-slate-100 dark:border-white/6 px-8 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{capitalizedDate}</p>
            <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight mt-0.5">
              {getGreeting()}{firstName ? `, ${firstName}` : ''}
              <span className="text-slate-400 dark:text-slate-500 font-normal text-sm"> — aqui está seu resumo financeiro</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setTxModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors shadow-sm shadow-amber-500/20"
            >
              <Plus size={15} />
              Nova transação
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setIsEditMode((e) => !e)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                isEditMode
                  ? 'bg-slate-800 dark:bg-white/15 text-white'
                  : 'bg-slate-100 dark:bg-white/8 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/12'
              }`}
            >
              {isEditMode ? <X size={15} /> : <SlidersHorizontal size={15} />}
              {isEditMode ? 'Concluir' : 'Personalizar'}
            </motion.button>
          </div>
        </div>

        <div className="p-8 pt-6">
          {/* Edit mode hint */}
          <AnimatePresence>
            {isEditMode && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 dark:bg-slate-700/80 rounded-xl text-sm text-slate-300 border border-slate-700 dark:border-white/10">
                  <SlidersHorizontal size={14} className="flex-shrink-0 text-amber-400" />
                  <span>Arraste os widgets para reordenar. Clique em <strong className="text-white">Visível / Oculto</strong> para mostrar ou esconder.</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AlertBannerList />

          {/* ── EDIT MODE ── */}
          {isEditMode ? (
            <Reorder.Group axis="y" values={widgets} onReorder={reorder} className="flex flex-col gap-6">
              {widgets.map((w) => (
                <DashboardWidget key={w.id} widget={w} onToggle={() => toggleVisibility(w.id)} isEditMode={true}>
                  {widgetContent[w.id]}
                </DashboardWidget>
              ))}
            </Reorder.Group>
          ) : (
            /* ── NORMAL MODE ── */
            <div className="flex flex-col gap-5">
              {(() => {
                let cardsHealthDone = false;
                return widgets.map((w) => {
                  if (!w.visible) return null;

                  if (w.id === 'cards' || w.id === 'health') {
                    if (cardsHealthDone) return null;
                    cardsHealthDone = true;
                    const bothHidden = !cardsWidget?.visible && !healthWidget?.visible;
                    if (bothHidden) return null;
                    return (
                      <div key="cards-health" className="flex gap-5 items-start">
                        {cardsWidget?.visible && (
                          <div className="flex-1 min-w-0">
                            <DashboardWidget widget={cardsWidget} onToggle={() => toggleVisibility(cardsWidget.id)} isEditMode={false}>
                              {widgetContent[cardsWidget.id]}
                            </DashboardWidget>
                          </div>
                        )}
                        {healthWidget?.visible && (
                          <div className="w-[380px] max-w-full shrink-0">
                            <DashboardWidget widget={healthWidget} onToggle={() => toggleVisibility(healthWidget.id)} isEditMode={false}>
                              {widgetContent[healthWidget.id]}
                            </DashboardWidget>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <DashboardWidget key={w.id} widget={w} onToggle={() => toggleVisibility(w.id)} isEditMode={false}>
                      {widgetContent[w.id]}
                    </DashboardWidget>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>

      <TransactionFormModal isOpen={txModalOpen} onClose={() => setTxModalOpen(false)} />
    </>
  );
}
