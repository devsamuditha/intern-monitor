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
    <div className="fixed inset-0 bg-teal-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        variants={scaleIn}
        initial="initial"
        animate="animate"
        exit="exit"
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in duration-200"
      >
        <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-950/40 text-amber-400 flex items-center justify-center">
          <FileText className="h-6 w-6" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-white">Write Daily Journal Required</h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Before ending your workday, you must complete and submit your <span className="font-bold text-white/80">Write Daily Journal</span> entry.
          </p>
        </div>

        <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl text-[11px] text-amber-200 text-left space-y-1">
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
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:bg-white/10"
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

