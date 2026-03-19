'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  // Read theme synchronously from localStorage — no context delay, no flash
  const [isDark] = useState(() => {
    if (typeof window === 'undefined') return true; // SSR: match body bg-[#0f0f0f]
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2600);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className={`fixed inset-0 z-9999 flex flex-col items-center justify-center ${isDark ? 'bg-[#0f0f0f]' : 'bg-white'}`}
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <Image
              src={isDark ? '/Logo-loading-branca.png' : '/Logo-loading-preta.png'}
              alt="Logo"
              width={160}
              height={160}
              priority
              className="object-contain"
            />
          </motion.div>

          {/* Pulsing ring */}
          <motion.div
            className="absolute rounded-full border border-amber-500/30"
            initial={{ width: 180, height: 180, opacity: 0.6 }}
            animate={{ width: 260, height: 260, opacity: 0 }}
            transition={{ duration: 1.4, ease: 'easeOut', repeat: Infinity, repeatDelay: 0.2 }}
          />

          {/* Loading bar */}
          <div className={`mt-12 w-36 h-0.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-black/10'}`}>
            <motion.div
              className="h-full rounded-full bg-amber-500"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
