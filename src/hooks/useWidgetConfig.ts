'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { WidgetConfig } from '@/types';

const WIDGET_KEY = 'finance-widget-config';

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'balance', label: 'Saldo Total', visible: true },
  { id: 'cards', label: 'Meus Cartoes', visible: true },
  { id: 'health', label: 'Saude Financeira', visible: true },
  { id: 'summary', label: 'Resumo Mensal', visible: true },
  { id: 'transactions', label: 'Transacoes Recentes', visible: true },
];

export function useWidgetConfig() {
  const hasMounted = useRef(false);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_WIDGETS;

    try {
      const raw = localStorage.getItem(WIDGET_KEY);
      if (!raw) return DEFAULT_WIDGETS;

      const parsed: WidgetConfig[] = JSON.parse(raw);
      return DEFAULT_WIDGETS.map((def) => parsed.find((item) => item.id === def.id) ?? def);
    } catch {
      return DEFAULT_WIDGETS;
    }
  });

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    localStorage.setItem(WIDGET_KEY, JSON.stringify(widgets));
  }, [widgets]);

  const reorder = useCallback((newOrder: WidgetConfig[]) => setWidgets(newOrder), []);

  const toggleVisibility = useCallback((id: string) => {
    setWidgets((prev) =>
      prev.map((widget) => (widget.id === id ? { ...widget, visible: !widget.visible } : widget)),
    );
  }, []);

  return { widgets, reorder, toggleVisibility };
}
