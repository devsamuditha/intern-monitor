/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { scaleIn } from '../../utils/motion';
import { X, FileText, Clock } from 'lucide-react';

interface JournalReminderModalProps {
  show: boolean;
  onClose: () => void;
  onGoToJournal: () => void;
}

export const JournalReminderModal: React.FC<JournalReminderModalProps> = ({
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
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4 animate-in fade-in zoom-in duration-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/20">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-950/40 text-amber-400 rounded-xl">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Daily Journal Reminder</h3>
              <p className="text-xs text-white/60">It is past 1:00 PM IST.</p>
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
            You haven&apos;t submitted your daily journal yet. Please complete and submit it before the deadline.
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
