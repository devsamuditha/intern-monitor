/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { scaleIn } from '../../utils/motion';
import { FileText } from 'lucide-react';

interface EndDayPromptModalProps {
  show: boolean;
  onClose: () => void;
  onGoToJournal: () => void;
}

export const EndDayPromptModal: React.FC<EndDayPromptModalProps> = ({
  show,
  onClose,
  onGoToJournal
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        variants={scaleIn}
        initial="initial"
        animate="animate"
        exit="exit"
        className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in duration-200"
      >
        <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <FileText className="h-6 w-6" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Write Daily Journal Required</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Before ending your workday, you must complete and submit your <span className="font-bold text-slate-800 dark:text-slate-200">Write Daily Journal</span> entry.
          </p>
        </div>

        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 text-left space-y-1">
          <p className="font-bold">📝 Daily Journal checklist:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>What did you work on today?</li>
            <li>Technologies used today</li>
            <li>Detailed changelog & GitHub commit URL</li>
          </ul>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={onGoToJournal}
            className="px-5 py-2 rounded-xl text-xs font-extrabold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 flex items-center gap-1.5"
          >
            <FileText className="h-4 w-4" />
            Fill Daily Journal Now
          </button>
        </div>
      </motion.div>
    </div>
  );
};

