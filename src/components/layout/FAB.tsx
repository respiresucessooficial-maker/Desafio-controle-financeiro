'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useFab } from '@/contexts/FabContext';

export default function FAB() {
  const { config } = useFab();

  return (
    <AnimatePresence>
      {!config.hidden && (
        <motion.button
          key="fab"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={config.onClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-amber-500 text-white shadow-xl flex items-center justify-center hover:bg-amber-600 transition-colors"
          title={config.label}
        >
          <Plus size={24} strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
