'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Loader2, ArrowLeft, CreditCard, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { USER_ACCESS_STATUS } from '@/lib/access-status';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { formatCPF, isValidCPF } from '@/lib/cpf';

type Mode = 'login' | 'register';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const { user, loading } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<Mode>(() =>
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validatingLogin, setValidatingLogin] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSubmitting, setForgotPasswordSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loading && user && !validatingLogin) router.replace('/dashboard');
  }, [user, loading, router, validatingLogin]);

  useEffect(() => {
    if (searchParams.get('error') === 'auth') {
      setError('O link de acesso e invalido ou expirou. Solicite uma nova recuperacao de senha.');
    }
  }, [searchParams]);

  function resetState() {
    setError('');
    setSuccess('');
  }

  function clearFormFields() {
    setName('');
    setCpf('');
    setEmail('');
    setPassword('');
    setShowPass(false);
  }

  async function validateUserAccess(authUserId: string) {
    const { data: accessUser, error: accessError } = await supabase
      .from('users')
      .select('status')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (accessError) {
      await supabase.auth.signOut();
      throw new Error('Nao foi possivel validar o acesso ao sistema. Entre em contato com o suporte.');
    }

    if (!accessUser || accessUser.status !== USER_ACCESS_STATUS.active) {
      await supabase.auth.signOut();
      setPassword('');
      throw new Error('Voce nao pode fazer login no sistema. Entre em contato com o suporte.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        setValidatingLogin(true);

        const loginCheckResponse = await fetch('/api/auth/login-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const loginCheckData = await loginCheckResponse.json();

        if (!loginCheckResponse.ok) {
          throw new Error(loginCheckData.error ?? 'Nao foi possivel validar o acesso para login.');
        }

        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) throw loginError;

        const authUserId = loginData.user?.id;
        if (!authUserId) throw new Error('Nao foi possivel identificar o usuario autenticado.');

        await validateUserAccess(authUserId);

        setValidatingLogin(false);
        router.replace('/dashboard');
        return;
      }

      if (!isValidCPF(cpf)) {
        setError('CPF invalido. Verifique e tente novamente.');
        setSubmitting(false);
        return;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, cpf }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Ocorreu um erro ao criar a conta.');
      }

      setValidatingLogin(true);
      const { data: loginData, error: autoLoginError } = await supabase.auth.signInWithPassword({ email, password });
      if (autoLoginError) throw autoLoginError;

      const authUserId = loginData.user?.id;
      if (!authUserId) throw new Error('Nao foi possivel identificar o usuario autenticado.');

      await validateUserAccess(authUserId);

      setSuccess(data.message ?? 'Conta criada com sucesso.');
      router.replace('/dashboard');
    } catch (err: unknown) {
      setError(translateError(err instanceof Error ? err.message : 'Ocorreu um erro.'));
    } finally {
      setValidatingLogin(false);
      setSubmitting(false);
    }
  }

  async function handleForgotPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setForgotPasswordSubmitting(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Nao foi possivel iniciar a recuperacao de senha.');
      }

      setForgotPasswordOpen(false);
      setForgotPasswordEmail('');
      setSuccess(data.message ?? 'Enviamos o link de recuperacao para o e-mail informado.');
    } catch (err: unknown) {
      setError(translateError(err instanceof Error ? err.message : 'Ocorreu um erro.'));
    } finally {
      setForgotPasswordSubmitting(false);
    }
  }

  function translateError(msg: string): string {
    if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
    if (msg.includes('Email not confirmed')) return 'Nao foi possivel concluir o login. Tente novamente.';
    if (msg.includes('User already registered')) return 'Este e-mail ja esta cadastrado.';
    if (msg.includes('Este e-mail ja esta cadastrado')) return 'Este e-mail ja esta cadastrado.';
    if (msg.includes('Password should be')) return 'A senha deve ter pelo menos 6 caracteres.';
    if (msg.includes('Nenhuma conta encontrada')) return 'Nenhuma conta encontrada com esse e-mail.';
    if (msg.includes('Entre em contato com o suporte')) return msg;
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
            {(['login', 'register'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setMode(tab);
                  resetState();
                  clearFormFields();
                }}
                className={`relative flex-1 py-4 text-sm font-semibold transition-colors ${
                  mode === tab
                    ? 'text-slate-900 dark:text-slate-50'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {mode === tab && (
                  <motion.span
                    layoutId="tabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                {tab === 'login' ? 'Entrar' : 'Cadastrar'}
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
                    : 'Preencha os dados abaixo para criar sua conta.'}
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
                      className="flex flex-col gap-3.5"
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
                  onClick={() => setShowPass((state) => !state)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 transition-colors"
                >
                  {showPass ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
              </div>

              {mode === 'login' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordEmail(email);
                      setForgotPasswordOpen(true);
                      setError('');
                      setSuccess('');
                    }}
                    className="text-sm font-medium text-amber-500 hover:text-amber-600 transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              )}

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-2.5 rounded-xl"
                  >
                    {error}
                  </motion.p>
                )}
                {success && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
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
                {submitting ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Entrar' : 'Criar conta'}
                    <ArrowRight size={16} />
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>

        <p className="text-center text-xs text-slate-400 mt-5">
          Ao continuar, voce concorda com nossos termos de uso e politica de privacidade.
        </p>
      </div>

      <AnimatePresence>
        {forgotPasswordOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#17171c] p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-50">
                    Recuperar senha
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Informe o e-mail da conta para enviarmos o link de recuperacao.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => !forgotPasswordSubmitting && setForgotPasswordOpen(false)}
                  className="rounded-full p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  aria-label="Fechar modal"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleForgotPasswordSubmit} className="flex flex-col gap-4">
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    placeholder="Digite seu e-mail"
                    required
                    autoFocus
                    className={inputCls}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(false)}
                    className="flex-1 rounded-2xl border border-slate-200 dark:border-white/10 px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 transition-colors"
                  >
                    Cancelar
                  </button>
                  <motion.button
                    type="submit"
                    disabled={forgotPasswordSubmitting}
                    whileHover={!forgotPasswordSubmitting ? { scale: 1.02 } : {}}
                    whileTap={!forgotPasswordSubmitting ? { scale: 0.98 } : {}}
                    className="flex-1 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/20 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                  >
                    {forgotPasswordSubmitting ? (
                      <span className="flex items-center justify-center">
                        <Loader2 size={16} className="animate-spin" />
                      </span>
                    ) : (
                      'Enviar'
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
