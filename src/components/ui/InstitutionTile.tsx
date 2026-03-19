'use client';

import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { Institution } from '@/data/institutions';
import { getInstitutionLogoSources } from '@/utils/logoSources';

interface Props {
  inst: Institution;
  selected: boolean;
  onClick: () => void;
}

export default function InstitutionTile({ inst, selected, onClick }: Props) {
  const sources = getInstitutionLogoSources(inst);
  const [srcIdx, setSrcIdx] = useState(0);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const prevId = useRef(inst.id);
  if (prevId.current !== inst.id) { prevId.current = inst.id; if (srcIdx !== 0) setSrcIdx(0); }
  const failed = srcIdx >= sources.length;

  function handleLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    if (img.naturalWidth <= 16 || img.naturalHeight <= 16) setSrcIdx((i) => i + 1);
  }

  return (
    <>
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.93 }}
        onClick={onClick}
        className={`flex flex-col items-center p-2 rounded-2xl transition-colors relative ${
          selected
            ? 'bg-amber-50 dark:bg-amber-500/15 ring-2 ring-amber-500'
            : 'hover:bg-slate-50 dark:hover:bg-white/5'
        }`}
        onMouseEnter={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setTip({ x: r.left + r.width / 2, y: r.top });
        }}
        onMouseLeave={() => setTip(null)}
      >
        <div className="w-12 h-12 rounded-full bg-white dark:bg-white/90 flex items-center justify-center shadow overflow-hidden shrink-0">
          {!failed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sources[srcIdx]}
              alt={inst.name}
              width={48}
              height={48}
              className="w-12 h-12 object-cover"
              onError={() => setSrcIdx((i) => i + 1)}
              onLoad={handleLoad}
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-[11px] font-extrabold"
              style={{ background: inst.accentColor, color: '#fff' }}
            >
              {inst.brand.slice(0, 2)}
            </div>
          )}
        </div>

        {selected && (
          <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
            <Check size={9} className="text-white" strokeWidth={3} />
          </div>
        )}
      </motion.button>

      {tip && createPortal(
        <div
          className="fixed z-9999 px-2 py-1 rounded-lg bg-slate-800 text-white text-[11px] font-semibold whitespace-nowrap pointer-events-none -translate-x-1/2"
          style={{ left: tip.x, top: tip.y - 36 }}
        >
          {inst.name}
        </div>,
        document.body
      )}
    </>
  );
}
