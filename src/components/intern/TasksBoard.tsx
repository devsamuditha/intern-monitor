/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { CheckSquare, AlertTriangle, Github, ExternalLink, Check, Play, ArrowRight } from 'lucide-react';
import { Task } from '../../types.js';
import { formatDate } from '../../utils/helpers.js';
import { staggerContainer, fadeInUp } from '../../utils/motion.js';

interface TasksBoardProps {
  tasks: Task[];
  onTaskStatusToggle: (task: Task) => void;
}

export const TasksBoard: React.FC<TasksBoardProps> = ({ tasks, onTaskStatusToggle }) => {
  return (
    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5 p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            Assigned Board <CheckSquare className="h-4.5 w-4.5 text-teal-600" />
          </h3>
          <p className="text-[11px] text-slate-400">Advance task state by clicking standard action buttons.</p>
        </div>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="space-y-2.5"
      >
        {tasks.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 space-y-2">
            <div className="bg-slate-100 dark:bg-slate-900 p-2.5 rounded-full w-10 h-10 flex items-center justify-center mx-auto text-slate-400">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No tasks assigned yet. Enjoy the quiet! 🌟</p>
              <p className="text-[11px] text-slate-400">When your tech lead assigns tasks for the current sprint, they&apos;ll show up here.</p>
            </div>
          </div>
        ) : (
          tasks.map(task => (
            <motion.div
              key={task.id}
              variants={fadeInUp}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 border-l-4 border-l-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:shadow-sm hover:border-l-teal-500 hover:pl-3"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{task.title}</h4>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                    task.priority === 'high'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      : 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300'
                  }`}>
                    {task.priority} priority
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-semibold capitalize ${
                    task.status === 'done'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : task.status === 'in_progress'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {task.status === 'in_progress' ? 'In Progress' : task.status === 'done' ? 'Completed' : 'To Do'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{task.description}</p>

                {/* Blockers Tag */}
                {task.blockers && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 text-[10px] font-medium text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600" />
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
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-mono text-slate-700 dark:text-slate-300 transition"
                    >
                      <Github className="h-3 w-3" />
                      <span>PR Link</span>
                      <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                    </a>
                  </div>
                )}

                <p className="text-[9px] text-slate-400 font-mono">Due: {formatDate(task.due_date)}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => onTaskStatusToggle(task)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition flex items-center gap-1 shrink-0 ${
                    task.status === 'done'
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : task.status === 'in_progress'
                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {task.status === 'done' ? (
                    <>
                      <Check className="h-3 w-3 stroke-[3]" /> Done
                    </>
                  ) : task.status === 'in_progress' ? (
                    <>
                      <Play className="h-3 w-3 fill-amber-600" /> Start
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-3 w-3" /> To Do
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
};
