/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { User, Task } from '../../types';
import {
  Plus, Calendar, ChevronDown, CheckCircle2, Clock, X, Loader2
} from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import { scaleIn } from '../../utils/motion';

interface ManagerTaskAssignmentsProps {
  currentUser: User;
  allUsers: User[];
  allTasks: Task[];
  onRefresh: () => void;
}

export const ManagerTaskAssignments: React.FC<ManagerTaskAssignmentsProps> = ({
  currentUser,
  allUsers,
  allTasks,
  onRefresh,
}) => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [techLeadIds, setTechLeadIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const techLeads = allUsers.filter(u => u.role === 'tech_lead' && u.isActive);

  const assignedTasks = allTasks.filter(t => {
    if (t.assigned_by !== currentUser.id) return false;
    if (t.assigned_tech_lead_ids && t.assigned_tech_lead_ids.length > 0) return true;
    const assignee = allUsers.find(u => u.id === t.assigned_to);
    return assignee?.role === 'tech_lead';
  });

  const toggleTechLead = (id: string) => {
    setTechLeadIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const assignTaskMutation = useMutation({
    mutationFn: api.assignTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      onRefresh();
      setShowForm(false);
      setTechLeadIds([]);
      setTitle('');
      setDescription('');
      setStartDate('');
      setPriority('medium');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (techLeadIds.length === 0 || !title.trim() || !description.trim() || !startDate) return;
    setSubmitting(true);
    try {
      await assignTaskMutation.mutateAsync({
        assigned_to: techLeadIds[0],
        assigned_by: currentUser.id,
        title: title.trim(),
        description: description.trim(),
        due_date: startDate,
        priority,
        assigned_tech_lead_ids: techLeadIds,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (task: Task) => {
    if (task.pending_acceptance) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <Clock className="h-3 w-3" /> Pending Acceptance
        </span>
      );
    }
    if (task.accepted_at) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="h-3 w-3" /> Accepted
        </span>
      );
    }
    return null;
  };

  const getAssigneeName = (task: Task) => {
    const assignee = allUsers.find(u => u.id === task.assigned_to);
    return assignee?.name || 'Unknown';
  };

  return (
    <div id="manager-task-assignments-root" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-600" /> Task Assignments to Tech Leads
          </h3>
          <p className="text-xs text-slate-400">Assign tasks to tech leads and track their acceptance status.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition active:scale-95"
        >
          <Plus className="h-4 w-4" /> Assign Task
        </button>
      </div>

      {showForm && (
        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5 space-y-4"
        >
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Assign New Task</h4>
            <button onClick={() => setShowForm(false)} className="text-xs text-slate-400 hover:text-white">Close</button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Tech Leads</label>
              <div className="flex flex-wrap gap-2">
                {techLeads.map(tl => (
                  <label
                    key={tl.id}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition ${
                      techLeadIds.includes(tl.id)
                        ? 'bg-purple-600 border-purple-600 text-white'
                        : 'bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={techLeadIds.includes(tl.id)}
                      onChange={() => toggleTechLead(tl.id)}
                      disabled={submitting}
                      className="hidden"
                    />
                    <span className="text-xs font-semibold">{tl.name}</span>
                  </label>
                ))}
              </div>
              {techLeadIds.length === 0 && (
                <p className="text-[10px] text-rose-500 mt-1">Select at least one tech lead</p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Task Title</label>
              <input
                type="text"
                placeholder="e.g., Implement user authentication flow"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
                className="w-full text-xs rounded-lg border border-white/20 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={submitting}
                className="w-full text-xs rounded-lg border border-white/20 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Description</label>
              <textarea
                rows={2}
                placeholder="Describe the task requirements..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
                className="w-full text-xs rounded-lg border border-white/20 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Priority</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map(p => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPriority(p)}
                    disabled={submitting}
                    className={`flex-1 py-1.5 text-[10px] font-bold capitalize rounded-md transition disabled:opacity-50 ${
                      priority === p
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-white/20 dark:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting || techLeadIds.length === 0 || !title.trim() || !description.trim() || !startDate}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                  <>Create Task Assignment</>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-teal-500/5 border border-white/20 dark:border-slate-700/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="pb-3 pl-4">Task</th>
                <th className="pb-3">Tech Lead</th>
                <th className="pb-3">Start Date</th>
                <th className="pb-3">Priority</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right pr-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/30 dark:divide-slate-700/30">
              {assignedTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">No tasks assigned yet</p>
                      <p className="text-xs text-slate-400">Assign a task to a tech lead to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                assignedTasks.map(task => (
                  <tr key={task.id} className="group hover:bg-slate-50/70 dark:hover:bg-slate-950/60 transition duration-150">
                    <td className="py-3 pl-4">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{task.title}</p>
                      <p className="text-[10px] text-slate-400 line-clamp-1 max-w-[200px]">{task.description}</p>
                    </td>
                    <td className="py-3 px-2">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{getAssigneeName(task)}</p>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-xs text-slate-600 dark:text-slate-400">{formatDate(task.due_date)}</span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        task.priority === 'high' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        task.priority === 'medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {getStatusBadge(task)}
                    </td>
                    <td className="py-3 px-2 text-right pr-4">
                      <span className="text-[10px] text-slate-400">{formatDate(task.created_at || '')}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
