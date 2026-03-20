'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export default function ContaConfirmadaPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 4000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0f] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white dark:bg-card rounded-3xl border border-slate-100 dark:border-white/8 shadow-2xl shadow-black/5 dark:shadow-black/40 p-10 flex flex-col items-center text-center max-w-sm w-full"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
          className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center mb-6"
        >
          <CheckCircle size={32} className="text-green-500" />
        </motion.div>

        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 mb-2">
          Conta confirmada!
        </h1>
        <p className="text-sm text-slate-400 mb-8">
          Seu e-mail foi verificado com sucesso. Você será redirecionado para o login em instantes.
        </p>

        <motion.div className="w-full bg-slate-100 dark:bg-white/8 rounded-full h-1 overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 4, ease: 'linear' }}
            className="h-full bg-amber-500 rounded-full"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
