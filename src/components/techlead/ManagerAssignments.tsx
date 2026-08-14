/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState } from 'react';
import { api } from '../../services/api';
import { User, Task } from '../../types';
import { useAcceptTask } from '../../hooks/queries/useDashboardQueries';
import {
  CheckCircle2, X, Clock, Calendar, Loader2
} from 'lucide-react';
import { formatDate } from '../../utils/helpers';

interface ManagerAssignmentsProps {
  currentUser: User;
  allUsers: User[];
  allTasks: Task[];
  onRefresh: () => void;
}

export const ManagerAssignments: React.FC<ManagerAssignmentsProps> = ({
  currentUser,
  allUsers,
  allTasks,
  onRefresh,
}) => {
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const acceptTaskMutation = useAcceptTask();

  const myTasks = allTasks.filter(t => t.assigned_to === currentUser.id);

  const pendingTasks = myTasks.filter(t => t.pending_acceptance);
  const acceptedTasks = myTasks.filter(t => !t.pending_acceptance && t.accepted_at);

  const getManagerName = (task: Task) => {
    const manager = allUsers.find(u => u.id === task.assigned_by);
    return manager?.name || 'Unknown Manager';
  };

  const handleAccept = async (taskId: string) => {
    try {
      await acceptTaskMutation.mutateAsync(taskId);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to accept task. Please try again.');
    }
  };

  const handleReject = async (taskId: string) => {
    if (!confirm('Are you sure you want to reject this task? It will be permanently removed.')) return;
    setRejectingId(taskId);
    try {
      await api.rejectTask(taskId);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to reject task. Please try again.');
    } finally {
      setRejectingId(null);
    }
  };

  const renderTaskCard = (task: Task, isPending: boolean) => (
    <div
      key={task.id}
      className="bg-white/10 backdrop-blur-xl p-4 rounded-xl border border-white/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div className="space-y-1 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-sm font-bold text-white truncate">{task.title}</h4>
          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
            task.priority === 'high' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
            task.priority === 'medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
            'bg-blue-500/20 text-blue-300 border border-blue-500/30'
          }`}>
            {task.priority}
          </span>
          {isPending ? (
            <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Pending
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Accepted
            </span>
          )}
        </div>
        <p className="text-xs text-slate-300 line-clamp-2">{task.description}</p>
        <div className="flex items-center gap-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Due: {formatDate(task.due_date)}
          </span>
          <span>Assigned by: {getManagerName(task)}</span>
          {task.accepted_at && (
            <span className="flex items-center gap-1 text-emerald-300">
              <CheckCircle2 className="h-3 w-3" /> Accepted on {formatDate(task.accepted_at)}
            </span>
          )}
        </div>
      </div>

      {isPending && (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleAccept(task.id)}
            disabled={acceptTaskMutation.isPending}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition disabled:opacity-50"
          >
            {acceptTaskMutation.isPending && rejectingId === task.id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3 w-3" />
            )}
            Accept
          </button>
          <button
            onClick={() => handleReject(task.id)}
            disabled={rejectingId === task.id}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition disabled:opacity-50"
          >
            {rejectingId === task.id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <X className="h-3 w-3" />
            )}
            Reject
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div id="manager-assignments-root" className="space-y-6">
      {/* Pending Tasks */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-400" /> Pending Task Assignments
          {pendingTasks.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold">
              {pendingTasks.length}
            </span>
          )}
        </h3>
        {pendingTasks.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 text-center">
            <CheckCircle2 className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-300">No pending task assignments.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingTasks.map(task => renderTaskCard(task, true))}
          </div>
        )}
      </div>

      {/* Accepted Tasks */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Accepted Tasks
        </h3>
        {acceptedTasks.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 text-center">
            <p className="text-xs text-slate-300">No accepted tasks yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {acceptedTasks.map(task => renderTaskCard(task, false))}
          </div>
        )}
      </div>
    </div>
  );
};
