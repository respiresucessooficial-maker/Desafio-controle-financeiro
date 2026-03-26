'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { isDark } = useTheme();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [canResetPassword, setCanResetPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function validateRecoverySession() {
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (sessionError || !data.session?.user) {
        setError('Este link de recuperacao e invalido ou expirou. Solicite um novo link.');
        setCanResetPassword(false);
        setCheckingAccess(false);
        return;
      }

      setCanResetPassword(true);
      setCheckingAccess(false);
    }

    validateRecoverySession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!canResetPassword) {
      setError('Este link de recuperacao nao esta mais disponivel.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Os campos de senha precisam ser iguais.');
      return;
    }

    setSubmitting(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user?.email) {
        throw new Error('Nao foi possivel identificar o usuario da recuperacao.');
      }

      const signInAttempt = await supabase.auth.signInWithPassword({
        email: userData.user.email,
        password,
      });

      if (!signInAttempt.error) {
        throw new Error('A nova senha nao pode ser igual a senha anterior.');
      }

      if (!signInAttempt.error.message.includes('Invalid login credentials')) {
        throw signInAttempt.error;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        throw updateError;
      }

      await supabase.auth.signOut();
      setSuccess(true);
      setCanResetPassword(false);
      setPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ocorreu um erro ao redefinir a senha.';
      if (message.includes('same as the old password') || message.includes('A nova senha nao pode ser igual')) {
        setError('A nova senha nao pode ser igual a senha anterior.');
      } else if (message.includes('Password should be')) {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const logoSrc = isDark ? '/Logo-loading-branca.png' : '/Logo-loading-preta.png';
  const inputCls = 'w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-50 text-sm placeholder:text-slate-400 focus:outline-none focus:border-amber-400 transition-colors';

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
            {success ? (
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-green-100 p-3 text-green-600 dark:bg-green-500/10 dark:text-green-400">
                  <CheckCircle2 size={28} />
                </div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 mb-2">
                  Senha alterada com sucesso
                </h1>
                <p className="text-sm text-slate-400 mb-6">
                  Sua nova senha ja esta pronta para uso. Volte para a tela inicial para entrar no sistema.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="w-full rounded-2xl bg-amber-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-colors"
                >
                  Voltar para a tela inicial
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 mb-1">
                    Redefinir senha
                  </h1>
                  <p className="text-sm text-slate-400">
                    Digite e confirme sua nova senha para concluir a recuperacao.
                  </p>
                </div>

                {checkingAccess ? (
                  <div className="flex items-center justify-center py-10 text-slate-400">
                    <Loader2 size={22} className="animate-spin" />
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Nova senha"
                        required
                        autoComplete="new-password"
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((state) => !state)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 transition-colors"
                      >
                        {showPassword ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                    </div>

                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirmar nova senha"
                        required
                        autoComplete="new-password"
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((state) => !state)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 transition-colors"
                      >
                        {showConfirmPassword ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                    </div>

                    {error && (
                      <p className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-2.5 rounded-xl">
                        {error}
                      </p>
                    )}

                    <motion.button
                      type="submit"
                      disabled={submitting || !canResetPassword}
                      whileHover={!submitting && canResetPassword ? { scale: 1.02 } : {}}
                      whileTap={!submitting && canResetPassword ? { scale: 0.98 } : {}}
                      className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-colors mt-1"
                    >
                      {submitting ? (
                        <Loader2 size={17} className="animate-spin" />
                      ) : (
                        'Alterar senha'
                      )}
                    </motion.button>
                  </form>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
