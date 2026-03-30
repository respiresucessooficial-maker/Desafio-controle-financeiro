'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight, TrendingUp, ShoppingCart, Car,
  ArrowRight, Wallet, BarChart3, Shield, Layers, Sun, Moon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const steps = [
  {
    n: '01',
    title: 'Crie sua conta',
    desc: 'Cadastro simples, sem burocracia.',
  },
  {
    n: '02',
    title: 'Adicione suas contas',
    desc: 'Registre suas contas bancárias e cartões para ter tudo em um lugar.',
  },
  {
    n: '03',
    title: 'Acompanhe em tempo real',
    desc: 'Dashboard, gráficos e metas se atualizam conforme você registra.',
  },
];

const modules = [
  { icon: Wallet,   label: 'Contas & Cartões',  desc: 'Saldos e limites centralizados' },
  { icon: TrendingUp, label: 'Extrato',          desc: 'Histórico categorizado' },
  { icon: BarChart3,  label: 'Analytics',        desc: 'Gráficos de fluxo de caixa' },
  { icon: Layers,     label: 'Orçamento',        desc: 'Limites por categoria' },
  { icon: Shield,     label: 'Metas',            desc: 'Objetivos com progresso' },
];

// Floating UI cards data
const recentTxs = [
  { icon: ShoppingCart, label: 'Supermercado Extra',    cat: 'Alimentação', amount: '- R$ 347,90', neg: true  },
  { icon: TrendingUp,   label: 'Freelance design',      cat: 'Renda',       amount: '+ R$ 2.800', neg: false },
  { icon: Car,          label: 'Combustível Shell',     cat: 'Transporte',  amount: '- R$ 189,50', neg: true  },
];

const fade  = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.1 } } };

export default function LandingPage() {
  const { user, loading } = useAuth();
  const { isDark, toggle } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  const logoSrc        = isDark ? '/Logo-loading-branca.png' : '/Logo-loading-preta.png';
  const logoSimplesSrc = isDark ? '/logo.svg' : '/Logo-preta.png';

  return (
    <div className="min-h-screen bg-white dark:bg-[#0c0c0e] text-slate-900 dark:text-slate-50 overflow-x-hidden selection:bg-amber-200 dark:selection:bg-amber-500/30">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0c0c0e]/90 backdrop-blur-md border-b border-slate-100 dark:border-white/6">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSimplesSrc}
              alt="Logo"
              style={{ width: '36px', height: '36px', objectFit: 'contain' }}
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {[['Funcionalidades', '#funcionalidades'], ['Como funciona', '#como-funciona']].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <motion.button
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={toggle}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors"
              aria-label="Alternar tema"
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </motion.button>

            <Link href="/login" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors px-1">
              Entrar
            </Link>
            <Link href="/login">
              <motion.span
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold cursor-pointer hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors"
              >
                Criar conta
                <ArrowUpRight size={14} />
              </motion.span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div className="grid lg:grid-cols-[1fr_420px] gap-16 items-start">

          {/* Left */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={fade} className="mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoSrc}
                alt="Logo"
                style={{ height: '112px', width: '380px', objectFit: 'contain', objectPosition: 'left' }}
              />
            </motion.div>

            <motion.h1
              variants={fade}
              className="text-[clamp(2.8rem,6vw,5rem)] font-extrabold leading-[1.06] tracking-tight text-slate-900 dark:text-white mb-8"
            >
              Clareza total<br />
              sobre o seu<br />
              <span className="text-amber-500">dinheiro.</span>
            </motion.h1>

            <motion.p
              variants={fade}
              className="text-lg text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-10"
            >
              Dashboard, cartões, orçamento e metas em um único lugar.
              Sem planilha. Sem complicação.
            </motion.p>

            <motion.div variants={fade} className="flex items-center gap-4 flex-wrap">
              <Link href="https://pay.kiwify.com.br/VMQ061I" target="_blank" rel="noopener noreferrer">
                <motion.span
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[15px] cursor-pointer transition-colors shadow-lg shadow-amber-500/25"
                >
                  Quero começar agora
                  <ArrowRight size={17} />
                </motion.span>
              </Link>
              <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline underline-offset-4 transition-colors">
                Já tenho conta
              </Link>
            </motion.div>

            <motion.div
              variants={fade}
              className="mt-12 pt-8 border-t border-slate-100 dark:border-white/8 flex items-center gap-8"
            >
              {[
                { value: '100%', label: 'gratuito' },
                { value: '< 2min', label: 'para configurar' },
                { value: '6', label: 'módulos integrados' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">{s.value}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — floating UI cards */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden lg:block"
          >
            {/* Balance card */}
            <div className="bg-slate-900 dark:bg-white/5 rounded-2xl p-6 border border-white/10 dark:border-white/8 shadow-2xl mb-3">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Saldo total</p>
              <p className="text-4xl font-extrabold text-white dark:text-slate-50 tabular-nums mb-4">R$ 18.430<span className="text-2xl text-slate-400">,00</span></p>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[10px] text-slate-500 mb-0.5">Entradas</p>
                  <p className="text-sm font-bold text-emerald-400">+ R$ 6.200</p>
                </div>
                <div className="w-px h-7 bg-white/10" />
                <div>
                  <p className="text-[10px] text-slate-500 mb-0.5">Saídas</p>
                  <p className="text-sm font-bold text-red-400">- R$ 2.890</p>
                </div>
                <div className="ml-auto">
                  <div className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/15 px-2 py-1 rounded-full">
                    +53,3% guardado
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions card */}
            <div className="bg-white dark:bg-[#18181c] rounded-2xl border border-slate-100 dark:border-white/8 shadow-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-white/6 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Últimas transações</p>
                <span className="text-[10px] font-semibold text-amber-500 cursor-pointer">Ver todas →</span>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-white/5">
                {recentTxs.map((tx) => (
                  <div key={tx.label} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/8 flex items-center justify-center flex-shrink-0">
                      <tx.icon size={14} className="text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{tx.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{tx.cat}</p>
                    </div>
                    <p className={`text-xs font-bold flex-shrink-0 ${tx.neg ? 'text-slate-700 dark:text-slate-300' : 'text-emerald-500'}`}>
                      {tx.amount}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating badge */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="absolute -right-4 top-1/2 -translate-y-1/2 bg-amber-500 text-white rounded-xl px-3.5 py-2.5 shadow-xl shadow-amber-500/30"
            >
              <p className="text-[10px] font-semibold opacity-80">Taxa de poupança</p>
              <p className="text-xl font-extrabold tabular-nums">53,3%</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Divider strip ── */}
      <div className="border-y border-slate-100 dark:border-white/6 bg-slate-50/50 dark:bg-white/2 py-5 overflow-hidden">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
          className="flex items-center gap-12 whitespace-nowrap w-max"
        >
          {[...Array(2)].map((_, outer) => (
            <div key={outer} className="flex items-center gap-12">
              {['Dashboard', 'Cartões', 'Extrato', 'Analytics', 'Orçamento', 'Metas', 'Calendário', 'Segurança'].map((t) => (
                <span key={t} className="flex items-center gap-3 text-xs font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                  <span className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
                  {t}
                </span>
              ))}
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Módulos ── */}
      <section id="funcionalidades" className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-[380px_1fr] gap-16 items-start">
          <div className="lg:sticky lg:top-28">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-500 mb-4">Funcionalidades</p>
            <h2 className="text-4xl font-extrabold leading-tight text-slate-900 dark:text-white mb-5">
              Um ecossistema financeiro completo
            </h2>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[15px]">
              Cada módulo foi pensado para se integrar ao próximo.
              Seus dados fluem entre as seções automaticamente.
            </p>
          </div>

          <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/6">
            {modules.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="group flex items-center gap-6 py-6 first:pt-0"
              >
                <div className="w-11 h-11 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-amber-300 dark:group-hover:border-amber-500/30 group-hover:bg-amber-50 dark:group-hover:bg-amber-500/8 transition-all">
                  <m.icon size={19} className="text-slate-400 group-hover:text-amber-500 transition-colors" strokeWidth={1.8} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-[15px]">{m.label}</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">{m.desc}</p>
                </div>
                <ArrowUpRight size={16} className="text-slate-200 dark:text-white/10 group-hover:text-amber-400 transition-colors flex-shrink-0" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Como funciona ── */}
      <section id="como-funciona" className="bg-slate-50 dark:bg-white/[0.02] border-y border-slate-100 dark:border-white/6">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-500 mb-4">Como funciona</p>
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white">Simples do início ao fim</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
              >
                <p className="text-7xl font-extrabold text-slate-100 dark:text-white/6 tabular-nums mb-4 leading-none select-none">
                  {s.n}
                </p>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-7xl mx-auto px-6 py-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 border-t-2 border-slate-900 dark:border-white pt-10"
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-500 mb-4">Comece agora</p>
            <h2 className="text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white leading-[1.04] max-w-xl">
              Sua vida financeira merece clareza.
            </h2>
          </div>

          <div className="flex flex-col items-start md:items-end gap-4 flex-shrink-0">
            <Link href="https://pay.kiwify.com.br/VMQ061I" target="_blank" rel="noopener noreferrer">
              <motion.span
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-base cursor-pointer transition-colors shadow-lg shadow-amber-500/20"
              >
                Quero começar agora
                <ArrowRight size={18} />
              </motion.span>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 dark:border-white/8 bg-slate-50 dark:bg-white/[0.015]">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt="Logo"
            style={{ height: '32px', width: '160px', objectFit: 'contain', objectPosition: 'left', opacity: 0.6 }}
          />
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} Controle Financeiro. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
