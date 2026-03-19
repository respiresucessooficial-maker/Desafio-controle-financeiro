'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Smartphone, Shield, Globe, Moon,
  ChevronRight, Camera, Mail, Phone,
  ChevronDown, AlertTriangle, Trash2, X,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useFabAction } from '@/contexts/FabContext';

interface ToggleProps {
  enabled: boolean;
  onChange: () => void;
}

function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
        enabled ? 'bg-amber-500' : 'bg-slate-200 dark:bg-white/20'
      }`}
    >
      <motion.div
        animate={{ x: enabled ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
      />
    </button>
  );
}

// ── Two-step delete modals ────────────────────────────────────────────────────
function DeleteStep1({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="relative bg-white dark:bg-card rounded-3xl shadow-2xl w-full max-w-md p-8 z-10"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
        >
          <X size={15} />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center mb-5">
          <AlertTriangle size={26} className="text-red-500" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">
          Excluir conta?
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
          Esta ação é <span className="font-semibold text-red-500">irreversível</span>. Todos os seus dados — transações, metas, orçamentos e cartões — serão permanentemente apagados.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-white/15 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
          >
            Continuar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function DeleteStep2({ onDelete, onClose }: { onDelete: () => void; onClose: () => void }) {
  const [phrase, setPhrase] = useState('');
  const [cpf, setCpf]       = useState('');
  const [email, setEmail]   = useState('');

  const REQUIRED_PHRASE = 'Eu realmente quero deletar minha conta';
  const isValid = phrase === REQUIRED_PHRASE && cpf.trim().length >= 11 && email.includes('@');

  function formatCpf(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="relative bg-white dark:bg-card rounded-3xl shadow-2xl w-full max-w-md p-8 z-10"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors"
        >
          <X size={15} />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center mb-5">
          <Trash2 size={24} className="text-red-500" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1">
          Confirme sua identidade
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Para confirmar, preencha os campos abaixo exatamente como solicitado.
        </p>

        {/* Phrase */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
            Digite exatamente:
          </label>
          <p className="text-xs font-mono text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2 mb-2 select-none">
            {REQUIRED_PHRASE}
          </p>
          <input
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder="Digite a frase acima..."
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-red-400 dark:focus:border-red-500 transition-colors"
          />
        </div>

        {/* CPF */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
            CPF
          </label>
          <input
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
            placeholder="000.000.000-00"
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-red-400 dark:focus:border-red-500 transition-colors"
          />
        </div>

        {/* Email */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
            E-mail da conta
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            type="email"
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-red-400 dark:focus:border-red-500 transition-colors"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-white/15 transition-colors"
          >
            Cancelar
          </button>
          <motion.button
            whileTap={isValid ? { scale: 0.97 } : {}}
            onClick={isValid ? onDelete : undefined}
            className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              isValid
                ? 'bg-red-500 hover:bg-red-600 text-white cursor-pointer'
                : 'bg-red-200 dark:bg-red-500/20 text-red-300 dark:text-red-500/50 cursor-not-allowed'
            }`}
          >
            <Trash2 size={15} />
            Excluir conta
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  useFabAction({ label: '', onClick: () => {}, hidden: true });
  const { isDark, toggle: toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [mobileAccess, setMobileAccess]   = useState(true);
  const [emailAlerts, setEmailAlerts]     = useState(false);
  const [biometrics, setBiometrics]       = useState(true);
  const [dangerOpen, setDangerOpen]       = useState(false);
  const [deleteStep, setDeleteStep]       = useState<0 | 1 | 2>(0);

  function handleDelete() {
    localStorage.clear();
    setDeleteStep(0);
    // Reload to reset app state
    window.location.reload();
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-8"
      >
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Conta</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Configurações</h1>
        </div>

        {/* Profile card */}
        <div className="bg-white dark:bg-card rounded-2xl p-6 border border-slate-100 dark:border-white/8 mb-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-50 mb-5">Perfil</h2>
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">TM</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-white dark:bg-card border-2 border-slate-100 dark:border-white/10 flex items-center justify-center shadow-sm text-slate-500 dark:text-slate-400 hover:text-amber-500 transition-colors"
              >
                <Camera size={12} />
              </motion.button>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">Tiago Meconi</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Plano Premium</p>
              <span className="inline-flex items-center mt-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                Premium
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-white/5 rounded-2xl">
              <Mail size={16} className="text-slate-400" />
              <div>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Email</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">tiago@exemplo.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-white/5 rounded-2xl">
              <Phone size={16} className="text-slate-400" />
              <div>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Telefone</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">(11) 99999-0000</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-card rounded-2xl p-6 border border-slate-100 dark:border-white/8 mb-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-50 mb-5">Notificações</h2>
          <div className="flex flex-col gap-4">
            {[
              { icon: Bell,       label: 'Notificações push', desc: 'Alertas em tempo real no app',  value: notifications, set: setNotifications },
              { icon: Smartphone, label: 'Acesso mobile',     desc: 'Login via dispositivo móvel',  value: mobileAccess,  set: setMobileAccess  },
              { icon: Mail,       label: 'Alertas por email', desc: 'Resumo semanal das finanças',  value: emailAlerts,   set: setEmailAlerts   },
              { icon: Shield,     label: 'Biometria',         desc: 'Acesso com impressão digital', value: biometrics,    set: setBiometrics    },
            ].map(({ icon: Icon, label, desc, value, set }) => (
              <div key={label} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                    <Icon size={16} className="text-slate-500 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                </div>
                <Toggle enabled={value} onChange={() => set(!value)} />
              </div>
            ))}
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white dark:bg-card rounded-2xl p-6 border border-slate-100 dark:border-white/8 mb-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-50 mb-5">Preferências</h2>
          <div className="flex flex-col gap-1">
            <motion.div
              whileHover={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }}
              className="flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                  <Globe size={16} className="text-slate-500 dark:text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Idioma</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Português (BR)</span>
                <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
              </div>
            </motion.div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                  <Moon size={16} className="text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Tema escuro</p>
                  <p className="text-xs text-slate-400">{isDark ? 'Ativado' : 'Desativado'}</p>
                </div>
              </div>
              <Toggle enabled={isDark} onChange={toggleTheme} />
            </div>

            <motion.div
              whileHover={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC' }}
              className="flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                  <Shield size={16} className="text-slate-500 dark:text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Segurança</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Autenticação 2FA</span>
                <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Danger zone — collapsible */}
        <div className="bg-white dark:bg-card rounded-2xl border border-red-100 dark:border-red-500/20 overflow-hidden">
          <motion.button
            onClick={() => setDangerOpen((o) => !o)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-red-50 dark:hover:bg-red-500/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center">
                <AlertTriangle size={15} className="text-red-500" />
              </div>
              <span className="text-sm font-bold text-red-600">Zona de Perigo</span>
            </div>
            <motion.div animate={{ rotate: dangerOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={16} className="text-red-400" />
            </motion.div>
          </motion.button>

          <AnimatePresence initial={false}>
            {dangerOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-5 pt-1">
                  <p className="text-xs text-slate-400 mb-4">
                    Ações nesta área são permanentes e não podem ser desfeitas.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => setDeleteStep(1)}
                    className="flex items-center justify-between w-full p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Trash2 size={16} className="text-red-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-red-600">Excluir conta</p>
                        <p className="text-xs text-slate-400 mt-0.5">Remover permanentemente todos os seus dados</p>
                      </div>
                    </div>
                    <ChevronRight size={15} className="text-red-300 flex-shrink-0" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Delete modals */}
      <AnimatePresence>
        {deleteStep === 1 && (
          <DeleteStep1
            onConfirm={() => setDeleteStep(2)}
            onClose={() => setDeleteStep(0)}
          />
        )}
        {deleteStep === 2 && (
          <DeleteStep2
            onDelete={handleDelete}
            onClose={() => setDeleteStep(0)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
