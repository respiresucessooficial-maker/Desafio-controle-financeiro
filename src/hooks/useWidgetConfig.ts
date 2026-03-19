'use client';

import { useState, useEffect, useCallback } from 'react';
import { WidgetConfig } from '@/types';

const WIDGET_KEY = 'finance-widget-config';

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'balance',      label: 'Saldo Total',        visible: true },
  { id: 'cards',        label: 'Meus Cartões',        visible: true },
  { id: 'transactions', label: 'Transações Recentes', visible: true },
  { id: 'health',       label: 'Saúde Financeira',   visible: true },
];

export function useWidgetConfig() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WIDGET_KEY);
      if (raw) {
        const parsed: WidgetConfig[] = JSON.parse(raw);
        // Merge: preserve any new widgets added in code that don't exist in storage yet
        const merged = DEFAULT_WIDGETS.map((def) => parsed.find((p) => p.id === def.id) ?? def);
        setWidgets(merged);
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(WIDGET_KEY, JSON.stringify(widgets));
  }, [widgets, loaded]);

  const reorder = useCallback((newOrder: WidgetConfig[]) => setWidgets(newOrder), []);

  const toggleVisibility = useCallback((id: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  }, []);

  return { widgets, reorder, toggleVisibility };
}
