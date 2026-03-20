'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Loader2, ArrowLeft, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

type Mode = 'login' | 'register';

function formatCPF(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function isValidCPF(cpf: string) {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let check = (sum * 10) % 11;
  if (check === 10 || check === 11) check = 0;
  if (check !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  check = (sum * 10) % 11;
  if (check === 10 || check === 11) check = 0;
  return check === parseInt(digits[10]);
}

export default function LoginPage() {
  const { user, loading } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();

  const [mode, setMode]         = useState<Mode>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [cpf, setCpf]           = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  function resetState() { setError(''); setSuccess(''); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace('/dashboard');
      } else {
        if (!isValidCPF(cpf)) {
          setError('CPF inválido. Verifique e tente novamente.');
          setSubmitting(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name, cpf: cpf.replace(/\D/g, '') } },
        });
        if (error) throw error;
        setSuccess('Conta criada! Verifique seu e-mail para confirmar o cadastro.');
      }
    } catch (err: unknown) {
      setError(translateError(err instanceof Error ? err.message : 'Ocorreu um erro.'));
    } finally {
      setSubmitting(false);
    }
  }

  function translateError(msg: string): string {
    if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
    if (msg.includes('Email not confirmed'))        return 'Confirme seu e-mail antes de entrar.';
    if (msg.includes('User already registered'))    return 'Este e-mail já está cadastrado.';
    if (msg.includes('Password should be'))         return 'A senha deve ter pelo menos 6 caracteres.';
    return msg;
  }

  const logoSrc = isDark ? '/Logo-loading-branca.png' : '/Logo-loading-preta.png';

  const inputCls = 'w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-50 text-sm placeholder:text-slate-400 focus:outline-none focus:border-amber-400 transition-colors';

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
        <Link href="/">
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
          <div className="flex border-b border-slate-100 dark:border-white/8">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); resetState(); }}
                className={`relative flex-1 py-4 text-sm font-semibold transition-colors ${
                  mode === m
                    ? 'text-slate-900 dark:text-slate-50'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {mode === m && (
                  <motion.span
                    layoutId="tabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                {m === 'login' ? 'Entrar' : 'Cadastrar'}
              </button>
            ))}
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="mb-6"
              >
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 mb-1">
                  {mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
                </h1>
                <p className="text-sm text-slate-400">
                  {mode === 'login'
                    ? 'Entre com seu e-mail e senha para continuar.'
                    : 'Preencha os dados abaixo para criar sua conta grátis.'}
                </p>
              </motion.div>
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">

              <div style={{ overflow: 'hidden' }}>
                <AnimatePresence initial={false}>
                  {mode === 'register' && (
                    <motion.div
                      key="register-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="flex flex-col gap-3.5 pb-3.5"
                    >
                      <div className="relative">
                        <User size={15} className="absolute left-3 top-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Seu nome completo"
                          required={mode === 'register'}
                          className={inputCls}
                        />
                      </div>
                      <div className="relative">
                        <CreditCard size={15} className="absolute left-3 top-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={cpf}
                          onChange={(e) => setCpf(formatCPF(e.target.value))}
                          placeholder="CPF (000.000.000-00)"
                          required={mode === 'register'}
                          inputMode="numeric"
                          className={inputCls}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu e-mail"
                  required
                  autoComplete="email"
                  className={inputCls}
                />
              </div>

              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-2.5 rounded-xl"
                  >
                    {error}
                  </motion.p>
                )}
                {success && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-green-600 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 px-4 py-2.5 rounded-xl"
                  >
                    {success}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={!submitting ? { scale: 1.02 } : {}}
                whileTap={!submitting ? { scale: 0.98 } : {}}
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-colors mt-1"
              >
                {submitting
                  ? <Loader2 size={17} className="animate-spin" />
                  : <>{mode === 'login' ? 'Entrar' : 'Criar conta'}<ArrowRight size={16} /></>
                }
              </motion.button>
            </form>
          </div>
        </motion.div>

        <p className="text-center text-xs text-slate-400 mt-5">
          Ao continuar, você concorda com nossos termos de uso e política de privacidade.
        </p>
      </div>
    </div>
  );
}
