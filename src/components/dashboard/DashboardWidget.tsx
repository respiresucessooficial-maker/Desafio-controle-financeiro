'use client';

import { Reorder } from 'framer-motion';
import { Eye, EyeOff, GripVertical } from 'lucide-react';
import { WidgetConfig } from '@/types';

interface Props {
  widget: WidgetConfig;
  onToggle: () => void;
  isEditMode: boolean;
  children: React.ReactNode;
}

export default function DashboardWidget({ widget, onToggle, isEditMode, children }: Props) {
  if (!isEditMode) {
    return widget.visible ? <>{children}</> : null;
  }

  return (
    <Reorder.Item
      value={widget}
      className={`w-full rounded-2xl transition-opacity ${
        widget.visible ? 'opacity-100' : 'opacity-50'
      }`}
      whileDrag={{
        scale: 1.02,
        boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
        zIndex: 50,
      }}
    >
      {/* Edit mode header */}
      <div className="mb-3 flex items-center justify-between px-3 py-2 bg-slate-800 dark:bg-slate-700 rounded-2xl shadow-lg">
        <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing text-slate-300">
          <GripVertical size={15} />
          <span className="text-xs font-semibold text-slate-200">{widget.label}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition-colors hover:bg-white/10"
          style={{ color: widget.visible ? '#86efac' : '#fca5a5' }}
          title={widget.visible ? 'Ocultar widget' : 'Mostrar widget'}
        >
          {widget.visible ? <Eye size={13} /> : <EyeOff size={13} />}
          {widget.visible ? 'Visível' : 'Oculto'}
        </button>
      </div>

      {/* Content (or placeholder when hidden) */}
      <div className="w-full">
        {widget.visible ? (
          children
        ) : (
          <div className="h-20 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center">
            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">{widget.label} — oculto</p>
          </div>
        )}
      </div>
    </Reorder.Item>
  );
}
