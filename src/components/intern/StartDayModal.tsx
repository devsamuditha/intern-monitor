/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { scaleIn } from '../../utils/motion';
import { X, Zap, Github, ChevronDown, FolderGit2, Info } from 'lucide-react';
import { Project } from '../../types';
import { getISTDate } from '../../utils/time';

interface StartDayModalProps {
  show: boolean;
  onClose: () => void;
  sessionLoading: boolean;
  startProject: string;
  setStartProject: (v: string) => void;
  startPlan: string;
  setStartPlan: (v: string) => void;
  startQuestions: string;
  setStartQuestions: (v: string) => void;
  startGitLink: string;
  setStartGitLink: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  assignedProjects: Project[];
}

export const StartDayModal: React.FC<StartDayModalProps> = ({
  show,
  onClose,
  sessionLoading,
  startProject,
  setStartProject,
  startPlan,
  setStartPlan,
  startQuestions,
  setStartQuestions,
  startGitLink,
  setStartGitLink,
  onSubmit,
  assignedProjects,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-teal-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        variants={scaleIn}
        initial="initial"
        animate="animate"
        exit="exit"
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/20">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-950/60 text-emerald-400 rounded-xl">
              <Zap className="h-5 w-5 fill-emerald-500/20" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Start Your Day</h3>
              <p className="text-xs text-white/60">Set your goals and let your Tech Lead know what you are working on today.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5">
           {(() => {
             const ist = getISTDate();
             const istMinutes = ist.getHours() * 60 + ist.getMinutes();
             const isBefore930 = istMinutes < 9 * 60 + 30;
             return isBefore930;
           })() && (
             <div className="p-3 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-200 flex items-center gap-2.5 text-xs">
               <Info className="h-4 w-4 text-teal-400 shrink-0" />
               <span>
                 You are starting your day before 9:30 AM IST. Your Tech Lead will be notified.
               </span>
             </div>
           )}

           {/* Today Project */}
          <div>
            <label className="block text-xs font-bold text-white/70 mb-1">Today Project *</label>
            {assignedProjects.length === 0 ? (
              <div>
                <select
                  disabled
                  className="w-full text-xs rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white/50 focus:outline-none disabled:opacity-50"
                >
                  <option>No projects assigned</option>
                </select>
                <p className="text-[10px] text-rose-300 mt-1">You must be assigned to at least one project to start your day.</p>
              </div>
            ) : (
              <div className="relative">
                <select
                  required
                  value={startProject}
                  onChange={(e) => setStartProject(e.target.value)}
                  className="w-full text-xs rounded-xl border border-white/20 bg-white/10 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300 appearance-none"
                >
                  <option value="" disabled>Select a project...</option>
                  {assignedProjects.map((proj) => (
                    <option key={proj.id} value={proj.name}>{proj.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-white/50 pointer-events-none" />
              </div>
            )}
          </div>

          {/* What are you doing today */}
          <div>
            <label className="block text-xs font-bold text-white/70 mb-1">What are you doing today? *</label>
            <textarea
              required
              rows={3}
              placeholder="e.g., Implementing day session start/end modal flow, handling validations and PR review"
              value={startPlan}
              onChange={(e) => setStartPlan(e.target.value)}
              className="w-full text-xs rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-[10px] placeholder:text-white/40 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* If you have any questions */}
          <div>
            <label className="block text-xs font-bold text-white/70 mb-1">If you have any questions? (Optional)</label>
            <input
              type="text"
              placeholder="e.g., Need clarification on API rate limit parameters or DB schema"
              value={startQuestions}
              onChange={(e) => setStartQuestions(e.target.value)}
              className="w-full text-xs rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-[10px] placeholder:text-white/40 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Git Link */}
          <div>
            <label className="block text-xs font-bold text-white/70 mb-1">Git Link *</label>
            <div className="relative">
              <Github className="absolute left-3 top-2.5 h-4 w-4 text-white/50" />
              <input
                type="url"
                required
                placeholder="https://github.com/org/repo or https://github.com/org/repo/tree/feature-branch"
                value={startGitLink}
                onChange={(e) => setStartGitLink(e.target.value)}
                className="w-full text-xs rounded-xl border border-white/20 bg-white/5 pl-9 pr-3 py-2 text-white placeholder:text-[10px] placeholder:text-white/40 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sessionLoading}
              className="px-5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Zap className="h-4 w-4 fill-slate-950" />
              {sessionLoading ? 'Starting Day...' : 'Confirm & Start Day'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

