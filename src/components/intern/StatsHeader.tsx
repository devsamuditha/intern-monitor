/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Flame, Award, CheckSquare, Clock } from 'lucide-react';
import { fadeInUp, hoverLift } from '../../utils/motion';
import GlassStat from '../../components/ui/glass/GlassStat';

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
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-[40px]">
      {/* Streak card */}
      <motion.div
        variants={fadeInUp}
        {...hoverLift}
      >
        <GlassStat icon={Flame} label="Journal Streak" value={streak > 0 ? `${streak}-Day Streak` : '0-Day Streak '} iconColor="amber" />
      </motion.div>

      {/* Avg Marks card */}
      <motion.div
        variants={fadeInUp}
        {...hoverLift}
      >
        <GlassStat icon={Award} label="Average Score" value={avgMark !== null && avgMark > 0 ? `${avgMark.toFixed(1)} / 5.0 ` : 'No scores yet '} iconColor="teal" />
      </motion.div>

      {/* Completed Tasks */}
      <motion.div
        variants={fadeInUp}
        {...hoverLift}
      >
        <GlassStat icon={CheckSquare} label="Tasks Completed" value={`${completedTasksCount} / ${totalTasks}`} iconColor="emerald" />
      </motion.div>

      {/* Total Logs */}
      <motion.div
        variants={fadeInUp}
        {...hoverLift}
      >
        <GlassStat icon={Clock} label="Logs Submitted" value={`${totalLogs} entries`} iconColor="teal" />
      </motion.div>
    </div>
  );
};

