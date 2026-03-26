'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, KeyRound, TriangleAlert } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function RecoveryLinkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDark } = useTheme();

  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') ?? 'recovery';
  const next = searchParams.get('next') ?? '/redefinir-senha';

  const callbackUrl = useMemo(() => {
    if (!tokenHash) return null;

    const params = new URLSearchParams({
      token_hash: tokenHash,
      type,
      next,
    });

    return `/auth/callback?${params.toString()}`;
  }, [next, tokenHash, type]);

  const logoSrc = isDark ? '/Logo-loading-branca.png' : '/Logo-loading-preta.png';

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-amber-400/10 dark:bg-amber-500/6 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-amber-300/8 dark:bg-amber-400/4 blur-[90px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed top-5 left-5 z-50"
      >
        <Link href="/login">
          <motion.span
            whileHover={{ x: -2 }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-white/6 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-semibold shadow-sm hover:border-amber-300 dark:hover:border-amber-500/30 hover:text-amber-600 dark:hover:text-amber-400 transition-all cursor-pointer"
          >
            <ArrowLeft size={13} />
            Voltar
          </motion.span>
        </Link>
      </motion.div>

      <div className="relative w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex justify-center mb-8"
        >
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt="Logo"
              style={{ height: '88px', width: '320px', objectFit: 'contain' }}
            />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="bg-white dark:bg-card rounded-3xl border border-slate-100 dark:border-white/8 shadow-2xl shadow-black/5 dark:shadow-black/40 overflow-hidden"
        >
          <div className="p-8">
            {callbackUrl ? (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                  <KeyRound size={24} />
                </div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 mb-2">
                  Recuperacao de senha
                </h1>
                <p className="text-sm text-slate-400 mb-6">
                  Para sua seguranca, confirme abaixo para abrir a tela de redefinicao de senha.
                </p>
                <button
                  type="button"
                  onClick={() => router.push(callbackUrl)}
                  className="w-full rounded-2xl bg-amber-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-colors"
                >
                  Continuar recuperacao
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  <TriangleAlert size={24} />
                </div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 mb-2">
                  Link incompleto
                </h1>
                <p className="text-sm text-slate-400 mb-6">
                  Esse link de recuperacao nao tem as informacoes necessarias. Solicite um novo e-mail.
                </p>
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-amber-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-colors"
                >
                  Voltar para o login
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
