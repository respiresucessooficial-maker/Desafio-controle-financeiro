'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
  description?: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = 'Selecionar...',
  label,
  className = '',
  disabled = false,
  size = 'md',
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const paddingClass = size === 'sm' ? 'px-3 py-2' : 'px-3.5 py-3';
  const textClass = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5 block">
          {label}
        </label>
      )}

      {/* Trigger button */}
      <motion.button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        animate={{
          borderColor: open ? 'rgb(251 191 36)' : 'transparent',
        }}
        className={`w-full flex items-center justify-between ${paddingClass} rounded-2xl border bg-slate-50 dark:bg-slate-800 ${textClass} focus:outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
          open
            ? 'border-amber-400 dark:border-amber-400 shadow-sm'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selected?.color && (
            <motion.div
              key={selected.color}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: selected.color }}
            />
          )}
          <span
            className={`truncate ${
              selected
                ? 'text-slate-900 dark:text-slate-50 font-medium'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {selected?.label ?? placeholder}
          </span>
        </div>

        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="flex-shrink-0 ml-2"
        >
          <ChevronDown
            size={size === 'sm' ? 14 : 16}
            className={open ? 'text-red-400' : 'text-slate-400 dark:text-slate-500'}
          />
        </motion.div>
      </motion.button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scaleY: 0.94, transformOrigin: 'top' }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="absolute left-0 right-0 top-full mt-2 z-[100] bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-black/20 border border-slate-100 dark:border-slate-700 overflow-x-hidden"
          >
            <div className="max-h-56 overflow-y-auto overflow-x-hidden py-1.5 styled-scrollbar">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <motion.button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left ${textClass} transition-colors ${
                      isSelected
                        ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                    whileHover={{ x: isSelected ? 0 : 3 }}
                    transition={{ duration: 0.12 }}
                  >
                    {option.color && (
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className={`block ${isSelected ? 'font-semibold' : ''}`}>
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="text-[10px] text-slate-400 leading-none">{option.description}</span>
                      )}
                    </div>
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        >
                          <Check size={14} className="text-red-500 flex-shrink-0" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
