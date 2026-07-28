/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Flame, Award, CheckSquare, Clock } from 'lucide-react';
import { fadeInUp, hoverLift } from '../../utils/motion';

interface StatsHeaderProps {
  streak: number;
  avgMark: number | null;
  completedTasksCount: number;
  totalTasks: number;
  totalLogs: number;
}

export const StatsHeader: React.FC<StatsHeaderProps> = ({
  streak,
  avgMark,
  completedTasksCount,
  totalTasks,
  totalLogs
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Streak card */}
      <motion.div
        variants={fadeInUp}
        {...hoverLift}
        className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl p-5 shadow-lg shadow-teal-500/5 flex items-center gap-4 transition-all duration-200"
      >
        <div className="bg-amber-50 dark:bg-amber-950/40 text-amber-500 p-3 rounded-xl">
          <Flame className="h-6 w-6 fill-amber-500 animate-pulse" />
        </div>
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Journal Streak</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{streak > 0 ? `${streak}-Day Streak 🔥` : '0-Day Streak ❄️'}</p>
        </div>
      </motion.div>

      {/* Avg Marks card */}
      <motion.div
        variants={fadeInUp}
        {...hoverLift}
        className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl p-5 shadow-lg shadow-teal-500/5 flex items-center gap-4 transition-all duration-200"
      >
        <div className="bg-teal-50 dark:bg-teal-950/40 text-teal-700 p-3 rounded-xl">
          <Award className="h-6 w-6 fill-teal-500/10" />
        </div>
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Average Score</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{avgMark !== null && avgMark > 0 ? `${avgMark.toFixed(1)} / 5.0 ⭐` : 'No scores yet ⭐'}</p>
        </div>
      </motion.div>

      {/* Completed Tasks */}
      <motion.div
        variants={fadeInUp}
        {...hoverLift}
        className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl p-5 shadow-lg shadow-teal-500/5 flex items-center gap-4 transition-all duration-200"
      >
        <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl">
          <CheckSquare className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Tasks Completed</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{completedTasksCount} / {totalTasks}</p>
        </div>
      </motion.div>

      {/* Total Logs */}
      <motion.div
        variants={fadeInUp}
        {...hoverLift}
        className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl p-5 shadow-lg shadow-teal-500/5 flex items-center gap-4 transition-all duration-200"
      >
        <div className="bg-teal-50 dark:bg-teal-950/40 text-teal-700 p-3 rounded-xl">
          <Clock className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Logs Submitted</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{totalLogs} entries</p>
        </div>
      </motion.div>
    </div>
  );
};

