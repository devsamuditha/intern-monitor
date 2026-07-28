/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, FileText } from 'lucide-react';
import { Mistake } from '../../types.ts';
import { formatDate } from '../../utils/helpers';

interface FlaggedMistakesBannerProps {
  mistakes: Mistake[];
}

export const FlaggedMistakesBanner: React.FC<FlaggedMistakesBannerProps> = ({ mistakes }) => {
  const unresolvedMistakes = mistakes.filter(m => !m.resolved);

  if (unresolvedMistakes.length === 0) return null;

  return (
    <div className="bg-rose-50/70 dark:bg-rose-950/30 backdrop-blur-sm border border-rose-200/80 dark:border-rose-900/40 rounded-2xl p-5 space-y-3.5">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-rose-600 dark:text-rose-400" />
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-rose-800 dark:text-rose-300">
          Critical Flagged Mistakes ({unresolvedMistakes.length})
        </h3>
      </div>
      <p className="text-xs text-rose-700/90 dark:text-rose-300 leading-relaxed">
        Your tech lead has highlighted security leaks or coding errors. Address these ASAP in your next commits to secure full marks.
      </p>
      <div className="space-y-2">
        {unresolvedMistakes.map(mistake => (
          <div key={mistake.id} className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-rose-100 dark:border-rose-950 text-xs text-slate-800 dark:text-slate-200 space-y-1 shadow-sm">
            <p className="font-bold text-slate-900 dark:text-white">{mistake.note}</p>
            <p className="text-[10px] text-slate-400 font-mono">Flagged on: {formatDate(mistake.date)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};



