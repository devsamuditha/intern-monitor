/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { scaleIn } from '../../utils/motion';
import { FileText, Clock, X } from 'lucide-react';

interface FinalWarningModalProps {
  show: boolean;
  onClose: () => void;
  onGoToJournal: () => void;
}

export const FinalWarningModal: React.FC<FinalWarningModalProps> = ({
  show,
  onClose,
  onGoToJournal
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-rose-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        variants={scaleIn}
        initial="initial"
        animate="animate"
        exit="exit"
        className="bg-white/10 backdrop-blur-xl border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4 animate-in fade-in zoom-in duration-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/20">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-950/40 text-rose-400 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Final Warning</h3>
              <p className="text-xs text-white/60">It is past 4:45 PM IST.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-white/60 leading-relaxed">
            You must submit your final daily journal <span className="font-bold text-rose-300">before 5:00 PM</span>.
          </p>
        </div>

        <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-xl text-[11px] text-rose-200 text-left space-y-1">
          <p className="font-bold">📝 Daily Journal checklist:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>What did you work on today?</li>
            <li>Technologies used today</li>
            <li>Detailed changelog & GitHub commit URL</li>
          </ul>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:bg-white/10"
          >
            Close
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
