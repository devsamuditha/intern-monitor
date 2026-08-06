/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, FileText } from 'lucide-react';
import { Mistake } from '../../types.ts';
import { formatDate } from '../../utils/helpers';
import { ThemedIcon } from '../../components/ui/ThemedIcon';

interface FlaggedMistakesBannerProps {
  mistakes: Mistake[];
}

export const FlaggedMistakesBanner: React.FC<FlaggedMistakesBannerProps> = ({ mistakes }) => {
  const unresolvedMistakes = mistakes.filter(m => !m.resolved);

  if (unresolvedMistakes.length === 0) return null;

  return (
    <div className="bg-amber-500/10 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-5 space-y-3.5">
      <div className="flex items-center gap-2">
        <ThemedIcon icon={ShieldAlert} color="amber" size={20} />
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-amber-200">
          Critical Flagged Mistakes ({unresolvedMistakes.length})
        </h3>
      </div>
      <p className="text-xs text-amber-100/80 leading-relaxed">
        Your tech lead has highlighted security leaks or coding errors. Address these in your next commits to secure full marks.
      </p>
      <div className="space-y-2">
        {unresolvedMistakes.map(mistake => (
          <div key={mistake.id} className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70 space-y-1 shadow-sm">
            <p className="font-bold text-white">{mistake.note}</p>
            <p className="text-[10px] text-white/50 font-mono">Flagged on: {formatDate(mistake.date)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};



