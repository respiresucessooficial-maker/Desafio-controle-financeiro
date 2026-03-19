'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { Alert } from '@/types';

const config = {
  error: {
    bg: 'bg-red-50 dark:bg-red-500/10',
    border: 'border-l-4 border-red-500',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
    titleColor: 'text-red-700 dark:text-red-400',
    msgColor: 'text-red-600 dark:text-red-300',
    closeHover: 'hover:bg-red-100 dark:hover:bg-red-500/20 text-red-400',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-l-4 border-amber-400',
    icon: AlertCircle,
    iconColor: 'text-amber-500',
    titleColor: 'text-amber-700 dark:text-amber-400',
    msgColor: 'text-amber-600 dark:text-amber-300',
    closeHover: 'hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-400',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    border: 'border-l-4 border-blue-400',
    icon: Info,
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-700 dark:text-blue-400',
    msgColor: 'text-blue-600 dark:text-blue-300',
    closeHover: 'hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-400',
  },
};

interface Props {
  alert: Alert;
  onDismiss: () => void;
}

export default function AlertBanner({ alert, onDismiss }: Props) {
  const c = config[alert.severity];
  const Icon = c.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`flex items-start gap-3 p-4 rounded-2xl ${c.bg} ${c.border} mb-3`}
    >
      <Icon size={18} className={`flex-shrink-0 mt-0.5 ${c.iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${c.titleColor}`}>{alert.title}</p>
        <p className={`text-xs mt-0.5 ${c.msgColor}`}>{alert.message}</p>
      </div>
      <button
        onClick={onDismiss}
        className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${c.closeHover}`}
        title="Dispensar"
      >
        <X size={13} />
      </button>
    </motion.div>
  );
}
