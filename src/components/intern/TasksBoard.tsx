/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { CheckSquare, AlertTriangle, Github, ExternalLink, Check, Play } from 'lucide-react';
import { Task } from '../../types.ts';
import { formatDate } from '../../utils/helpers';
import { staggerContainer, fadeInUp } from '../../utils/motion';
import { ThemedIcon } from '../../components/ui/ThemedIcon';

interface TasksBoardProps {
  tasks: Task[];
  onTaskStatusToggle: (task: Task) => void;
}

export const TasksBoard: React.FC<TasksBoardProps> = ({ tasks, onTaskStatusToggle }) => {
  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            Assigned Board <ThemedIcon icon={CheckSquare} color="teal" size={18} />
          </h3>
          <p className="text-[11px] text-white/60">Advance task state by clicking standard action buttons.</p>
        </div>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="space-y-2.5"
      >
        {tasks.length === 0 ? (
          <div className="text-center py-8 bg-white/5 rounded-xl border border-dashed border-white/20 p-6 space-y-2">
            <div className="bg-white/10 p-2.5 rounded-full w-10 h-10 flex items-center justify-center mx-auto text-slate-400">
              <ThemedIcon icon={CheckSquare} color="slate" size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-white/80">No tasks assigned yet. Enjoy the quiet! 🌟</p>
              <p className="text-[11px] text-white/50">When your tech lead assigns tasks for the current sprint, they&apos;ll show up here.</p>
            </div>
          </div>
        ) : (
          tasks.map(task => (
            <motion.div
              key={task.id}
              variants={fadeInUp}
              className="p-4 rounded-xl bg-black/15 border border-white/10 border-l-4 border-l-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:shadow-sm hover:border-l-teal-500 hover:pl-3"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-xs font-bold text-white leading-tight">{task.title}</h4>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                    task.priority === 'high'
                      ? ' text-rose-300  '
                      : ' text-teal-300  '
                  }`}>
                    {task.priority} priority
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-semibold capitalize ${
                    task.status === 'done'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : task.status === 'in_progress'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-white/10 text-white/70 border border-white/20'
                  }`}>
                    {task.status === 'in_progress' ? 'In Progress' : task.status === 'done' ? 'Completed' : 'To Do'}
                  </span>
                </div>
                <p className="text-xs text-white/70">{task.description}</p>

                {/* Blockers Tag */}
                {task.blockers && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 text-[10px] font-medium text-amber-800 dark:text-amber-300">
                    <ThemedIcon icon={AlertTriangle} color="amber" size={12} />
                    <span>Blocker: {task.blockers}</span>
                  </div>
                )}

                {/* GitHub PR Link Tag */}
                {task.pr_link && (
                  <div>
                    <a
                      href={task.pr_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 border border-white/20 text-[10px] font-mono text-slate-300 hover:bg-white/20 transition"
                    >
                      <ThemedIcon icon={Github} color="slate" size={12} />
                      <span>PR Link</span>
                      <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                    </a>
                  </div>
                )}

                <p className="text-[9px] text-white/60 font-mono">Due: {formatDate(task.due_date)}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {task.status === 'todo' && (
                  <button
                    onClick={() => onTaskStatusToggle(task)}
                    className="px-3 py-1.5 rounded-xl text-[10px] font-bold transition flex items-center gap-1 shrink-0 bg-teal-500 text-white hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700"
                  >
                    <ThemedIcon icon={Play} color="white" size={12} /> Start
                  </button>
                )}
                {task.status === 'in_progress' && (
                  <button
                    onClick={() => onTaskStatusToggle(task)}
                    className="px-3 py-1.5 rounded-xl text-[10px] font-bold transition flex items-center gap-1 shrink-0 bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                  >
                    <ThemedIcon icon={Check} color="white" size={12} fill /> Complete
                  </button>
                )}
                {task.status === 'done' && (
                  <div className="px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 shrink-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <ThemedIcon icon={Check} color="emerald" size={12} fill /> Completed
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
};



