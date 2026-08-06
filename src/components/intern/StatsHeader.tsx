/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Flame, Award, CheckSquare, Clock } from 'lucide-react';
import { fadeInUp, hoverLift } from '../../utils/motion';
import { ThemedIcon } from '../../components/ui/ThemedIcon';

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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-[40px]">
      {/* Streak card */}
      <motion.div
        variants={fadeInUp}
        {...hoverLift}
        className="bg-white/10 backdrop-blur-xl  rounded-2xl p-3 shadow-lg shadow-teal-500/5 flex items-center gap-1 transition-all duration-200"
      >
        <div className=" text-amber-300 p-3 rounded-xl">
          <ThemedIcon icon={Flame} color="amber" size={24} fill />
        </div>
        <div>
          <p className="text-[9px] text-teal-100 font-bold uppercase tracking-wide">Journal Streak</p>
          <p className="text-[15px] font-black text-white mt-0.5">{streak > 0 ? `${streak}-Day Streak 🔥` : '0-Day Streak '}</p>
        </div>
      </motion.div>

      {/* Avg Marks card */}
      <motion.div
        variants={fadeInUp}
        {...hoverLift}
        className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 shadow-lg shadow-teal-500/5 flex items-center gap-1 transition-all duration-200"
      >
        <div className=" text-teal-300 p-3 rounded-xl">
          <ThemedIcon icon={Award} color="teal" size={24} />
        </div>
        <div>
          <p className="text-[9px] text-teal-100 font-bold uppercase tracking-wide">Average Score</p>
          <p className="text-[15px] font-black text-white mt-0.5">{avgMark !== null && avgMark > 0 ? `${avgMark.toFixed(1)} / 5.0 ` : 'No scores yet ⭐'}</p>
        </div>
      </motion.div>

      {/* Completed Tasks */}
      <motion.div
        variants={fadeInUp}
        {...hoverLift}
        className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 shadow-lg shadow-teal-500/5 flex items-center gap-1 transition-all duration-200"
      >
        <div className=" text-emerald-300 p-3 rounded-xl">
          <ThemedIcon icon={CheckSquare} color="emerald" size={24} />
        </div>
        <div>
          <p className="text-[9px] text-teal-100 font-bold uppercase tracking-wide">Tasks Completed</p>
          <p className="text-[15px] font-black text-white mt-0.5">{completedTasksCount} / {totalTasks}</p>
        </div>
      </motion.div>

      {/* Total Logs */}
      <motion.div
        variants={fadeInUp}
        {...hoverLift}
        className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 shadow-lg shadow-teal-500/5 flex items-center gap-1 transition-all duration-200"
      >
        <div className=" text-teal-300 p-3 rounded-xl">
          <ThemedIcon icon={Clock} color="teal" size={24} />
        </div>
        <div>
          <p className="text-[9px] text-teal-100 font-bold uppercase tracking-wide">Logs Submitted</p>
          <p className="text-[15px] font-black text-white mt-0.5">{totalLogs} entries</p>
        </div>
      </motion.div>
    </div>
  );
};

