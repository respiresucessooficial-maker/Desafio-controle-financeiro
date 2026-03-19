'use client';

import { motion } from 'framer-motion';
import { Bank } from '@/types';

function VisaLogo({ size = 20 }: { size?: number }) {
  const w = Math.round(size * 2.6);
  return (
    <svg width={w} height={size} viewBox={`0 0 ${w} ${size}`} overflow="visible">
      <text x={w / 2} y={size - 2} textAnchor="middle" fill="white"
        fontFamily="Arial,sans-serif" fontWeight="900" fontStyle="italic"
        fontSize={size} opacity="0.92">VISA</text>
    </svg>
  );
}

function MastercardLogo({ size = 22 }: { size?: number }) {
  const r = size / 2;
  return (
    <svg width={size + r} height={size} viewBox={`0 0 ${size + r} ${size}`}>
      <circle cx={r} cy={r} r={r} fill="#EB001B" opacity="0.9" />
      <circle cx={size} cy={r} r={r} fill="#F79E1B" opacity="0.85" />
    </svg>
  );
}

function NetworkBadge({ network }: { network?: string }) {
  // visa-elo → only Visa (more well-known); visa-master → both
  if (network === 'visa' || network === 'visa-elo') {
    return <VisaLogo size={20} />;
  }
  if (network === 'elo') {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22">
        <circle cx="17" cy="11" r="11" fill="#FFD700" />
        <text x="17" y="15" textAnchor="middle" fill="#1A1A1A" fontFamily="Arial,sans-serif"
          fontWeight="900" fontSize="10">elo</text>
      </svg>
    );
  }
  if (network === 'visa-master') {
    return (
      <div className="flex items-center gap-1.5">
        <VisaLogo size={17} />
        <MastercardLogo size={22} />
      </div>
    );
  }
  // default: mastercard
  return <MastercardLogo size={24} />;
}

interface BankCardProps {
  bank: Bank;
  compact?: boolean;
  onClick?: () => void;
  showCreditBar?: boolean;
}

export default function BankCard({ bank, compact = false, onClick, showCreditBar = false }: BankCardProps) {
  const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  const creditLimit    = bank.creditLimit ?? 0;
  const creditUsed     = bank.creditUsed ?? 0;
  const creditAvailable = Math.max(0, creditLimit - creditUsed);
  const usagePct       = creditLimit > 0 ? Math.min(100, (creditUsed / creditLimit) * 100) : 0;
  const barColor       = usagePct >= 90 ? '#EF4444' : usagePct >= 70 ? '#F59E0B' : '#22C55E';

  const statusLabel = {
    paid:    { text: 'Paga',       color: 'text-green-600 dark:text-green-400' },
    open:    { text: 'Em aberto',  color: 'text-amber-600 dark:text-amber-400' },
    overdue: { text: 'Atrasada',   color: 'text-red-600 dark:text-red-400'    },
  }[bank.invoiceStatus ?? 'open'];

  return (
    <div className="flex flex-col" onClick={onClick} style={{ cursor: onClick ? 'pointer' : undefined }}>
      {/*
        The motion.div handles the scale/translate animation.
        overflow-hidden is on a separate inner div so the browser's
        paint clip doesn't interfere with the transform animation —
        this prevents the card from being visually cut during hover.
      */}
      <motion.div
        whileHover={{ scale: 1.03, y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`relative bg-linear-to-br ${bank.color} rounded-3xl select-none ${
          compact ? 'w-50 h-30' : 'w-70 h-41.25'
        }`}
      >
        {/* Inner clip — overflow-hidden here, NOT on the motion.div */}
        <div className={`absolute inset-0 rounded-3xl overflow-hidden ${compact ? 'p-4' : 'p-6'}`}>
          {/* Decorative blurs */}
          <div
            className="absolute rounded-full opacity-20"
            style={{
              width: compact ? '120px' : '180px',
              height: compact ? '120px' : '180px',
              background: 'rgba(255,255,255,0.4)',
              top: compact ? '-40px' : '-60px',
              right: compact ? '-40px' : '-60px',
              filter: 'blur(20px)',
            }}
          />
          <div
            className="absolute rounded-full opacity-10"
            style={{
              width: compact ? '80px' : '120px',
              height: compact ? '80px' : '120px',
              background: 'rgba(255,255,255,0.6)',
              bottom: compact ? '-20px' : '-30px',
              left: compact ? '-20px' : '-30px',
              filter: 'blur(15px)',
            }}
          />

          {/* Card content */}
          <div className="relative z-10 h-full flex flex-col justify-between">
            {/* Top row */}
            <div className="flex items-start justify-between">
              <div>
                <p className={`font-bold opacity-90 ${compact ? 'text-sm' : 'text-base'} ${bank.textColor}`}>
                  {bank.brand}
                </p>
                {!compact && (
                  <p className={`text-xs opacity-60 mt-0.5 ${bank.textColor}`}>
                    Agência {bank.code}
                  </p>
                )}
              </div>
              {!compact && <NetworkBadge network={bank.network} />}
            </div>

            {/* Card number */}
            <p className={`font-mono tracking-widest opacity-80 ${compact ? 'text-[10px]' : 'text-sm'} ${bank.textColor}`}>
              {bank.number}
            </p>

            {/* Balance */}
            <div>
              {!compact && (
                <p className={`text-[10px] uppercase tracking-wider opacity-60 mb-0.5 ${bank.textColor}`}>
                  Saldo disponível
                </p>
              )}
              <p className={`font-bold ${compact ? 'text-base' : 'text-xl'} ${bank.textColor}`}>
                {formatter.format(bank.balance)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Credit bar */}
      {showCreditBar && creditLimit > 0 && (
        <div className="mt-3 px-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              Limite disp. do crédito
            </span>
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
              {formatter.format(creditAvailable)}
            </span>
          </div>
          <div className="h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${usagePct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: barColor }}
            />
          </div>
          <div className="flex items-center gap-1 mt-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: usagePct >= 90 ? '#EF4444' : usagePct >= 70 ? '#F59E0B' : '#22C55E' }}
            />
            <span className={`text-[10px] font-semibold ${statusLabel.color}`}>
              {statusLabel.text}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
