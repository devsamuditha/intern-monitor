/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Github, Check, AlertTriangle } from 'lucide-react';
import { scaleIn } from '../../utils/motion';
import { Task } from '../../types';

interface CompleteTaskModalProps {
  show: boolean;
  onClose: () => void;
  task: Task | null;
  onSubmit: (data: {
    taskId: string;
    pr_link: string;
    completed_description: string;
    self_score?: number;
    self_comment?: string;
  }) => Promise<void>;
  submitting?: boolean;
}

export const CompleteTaskModal: React.FC<CompleteTaskModalProps> = ({
  show,
  onClose,
  task,
  onSubmit,
  submitting = false,
}) => {
  const [prLink, setPrLink] = useState('');
  const [completedDescription, setCompletedDescription] = useState('');
  const [selfComment, setSelfComment] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setPrLink(task.pr_link || '');
      setCompletedDescription('');
      setSelfComment('');
      setError('');
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    setError('');

    if (!prLink.trim()) {
      setError('Please enter your GitHub PR link.');
      return;
    }

    try {
      const url = new URL(prLink.trim());
      if (url.hostname !== 'github.com' && url.hostname !== 'www.github.com') {
        setError('Please enter a valid GitHub URL (https://github.com/...)');
        return;
      }
    } catch {
      setError('Please enter a valid URL (https://github.com/...)');
      return;
    }

    await onSubmit({
      taskId: task.id,
      pr_link: prLink.trim(),
      completed_description: completedDescription.trim(),
      self_comment: selfComment.trim() || undefined,
    });
  };

  if (!show || !task) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          exit="exit"
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/20 mb-4">
            <div>
              <h3 className="text-base font-extrabold text-white">Complete Task</h3>
              <p className="text-xs text-white/60 mt-0.5">{task.title}</p>
            </div>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-teal-100 uppercase mb-1">GitHub PR Link *</label>
              <div className="relative">
                <Github className="absolute left-3 top-2.5 h-4 w-4 text-white/50" />
                <input
                  type="url"
                  required
                  placeholder="https://github.com/org/repo/pull/123"
                  value={prLink}
                  onChange={(e) => setPrLink(e.target.value)}
                  className="w-full text-xs rounded-xl border border-white/20 bg-white/5 pl-9 pr-3 py-2 text-white placeholder:text-white/40 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-teal-100 uppercase mb-1">What did you do? *</label>
              <textarea
                required
                rows={3}
                placeholder="Describe what you completed, changes made, and any important notes..."
                value={completedDescription}
                onChange={(e) => setCompletedDescription(e.target.value)}
                className="w-full text-xs rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-teal-100 uppercase mb-1">Comment (optional)</label>
              <textarea
                rows={2}
                placeholder="Any additional comments for your Tech Lead..."
                value={selfComment}
                onChange={(e) => setSelfComment(e.target.value)}
                className="w-full text-xs rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/20">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-white/20 text-slate-300 rounded-xl text-xs font-semibold hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-bold shadow-sm disabled:opacity-60 flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                {submitting ? 'Submitting...' : 'Confirm & Complete'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
