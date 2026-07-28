/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api.js';
import { User } from '../../types.js';
import { scaleIn } from '../../utils/motion.js';
import { RefreshCw, ChevronDown, ChevronUp, Calendar, User as UserIcon, Filter } from 'lucide-react';

interface SuperAdminAuditProps {
  currentUser: User;
}

interface Filters {
  action: string;
  targetType: string;
  actorId: string;
  startDate: string;
  endDate: string;
}

const ACTION_OPTIONS = [
  'USER_CREATED',
  'USER_UPDATED',
  'USER_ROLE_CHANGED',
  'USER_ACTIVATED',
  'USER_DEACTIVATED',
  'USER_REASSIGNED',
  'LOGIN',
  'PROJECT_CREATED',
  'PROJECT_UPDATED',
  'TASK_CREATED',
  'TASK_UPDATED',
  'TASK_DELETED',
  'LOG_SUBMITTED',
  'LOG_REVIEWED',
  'MARK_CREATED',
  'MISTAKE_FLAGGED',
  'MISTAKE_RESOLVED',
  'MESSAGE_SENT',
  'DAY_SESSION_STARTED',
  'DAY_SESSION_ENDED',
  'SYSTEM_SETTING_UPDATED',
  'CONTENT_FLAG_CREATED',
  'CONTENT_FLAG_RESOLVED',
];

const TARGET_TYPE_OPTIONS = [
  'USER',
  'PROJECT',
  'TASK',
  'DAILY_LOG',
  'MARK',
  'MISTAKE',
  'MESSAGE',
  'QUESTION',
  'REPLY',
  'DAY_SESSION',
  'SYSTEM_SETTING',
  'CONTENT_FLAG',
];

function parseDetails(details?: string): Record<string, any> | null {
  if (!details) return null;
  try {
    return JSON.parse(details);
  } catch {
    return null;
  }
}

function renderDiff(details?: string): React.ReactNode {
  const parsed = parseDetails(details);
  if (!parsed || !parsed.oldValue && !parsed.newValue) {
    return details || '—';
  }

  const oldVal = parsed.oldValue;
  const newVal = parsed.newValue;

  if (typeof oldVal === 'object' && typeof newVal === 'object') {
    const changes: string[] = [];
    const allKeys = new Set([...Object.keys(oldVal || {}), ...Object.keys(newVal || {})]);
    allKeys.forEach((key) => {
      const oldStr = typeof oldVal?.[key] === 'object' ? JSON.stringify(oldVal[key]) : String(oldVal?.[key] ?? 'null');
      const newStr = typeof newVal?.[key] === 'object' ? JSON.stringify(newVal[key]) : String(newVal?.[key] ?? 'null');
      if (oldStr !== newStr) {
        changes.push(`${key}: ${oldStr} → ${newStr}`);
      }
    });
    return changes.length > 0 ? changes.join(', ') : 'No changes';
  }

  return `${String(oldVal)} → ${String(newVal)}`;
}

export const SuperAdminAudit: React.FC<SuperAdminAuditProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{ actorId: string; actorName: string; count: number }[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    action: '',
    targetType: '',
    actorId: '',
    startDate: '',
    endDate: '',
  });

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.action) params.action = filters.action;
      if (filters.targetType) params.targetType = filters.targetType;
      if (filters.actorId) params.actorId = filters.actorId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      params.limit = limit;
      params.offset = offset;

      const data = await api.getAuditLogs(params);
      setLogs(data.logs);
      setTotal(data.total);
      setLimit(data.limit);
      setOffset(data.offset);
    } catch (e) {
      console.error("Failed to load audit logs:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const data = await api.getAuditLogsSummary();
      setSummary(data);
    } catch (e) {
      console.error("Failed to load summary:", e);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [filters, limit, offset]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const all = await api.getUsers();
        setUsers(all);
      } catch {
        // ignore
      }
    };
    loadUsers();
  }, []);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setOffset(0);
  };

  const clearFilters = () => {
    setFilters({ action: '', targetType: '', actorId: '', startDate: '', endDate: '' });
    setOffset(0);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.floor(offset / limit) + 1;

  const goToPage = (page: number) => {
    setOffset((page - 1) * limit);
  };

  const uniqueActors = users
    .filter((u) => u.role === 'manager' || u.role === 'tech_lead' || u.role === 'super_admin')
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  const actionBadge = (action: string) => {
    const colorMap: Record<string, string> = {
      USER_CREATED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
      USER_ROLE_CHANGED: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
      USER_ACTIVATED: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400',
      USER_DEACTIVATED: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
      USER_REASSIGNED: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
      USER_UPDATED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      LOGIN: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
      PROJECT_CREATED: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400',
      PROJECT_UPDATED: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400',
      TASK_CREATED: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
      TASK_UPDATED: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
      TASK_DELETED: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
      LOG_SUBMITTED: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400',
      LOG_REVIEWED: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400',
      MARK_CREATED: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400',
      MISTAKE_FLAGGED: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
      MISTAKE_RESOLVED: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400',
      MESSAGE_SENT: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400',
      DAY_SESSION_STARTED: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400',
      DAY_SESSION_ENDED: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400',
      SYSTEM_SETTING_UPDATED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      CONTENT_FLAG_CREATED: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
      CONTENT_FLAG_RESOLVED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${colorMap[action] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
        {action.replace(/_/g, ' ')}
      </span>
    );
  };

  if (loading && logs.length === 0) {
    return (
      <motion.div {...scaleIn} className="text-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading audit trail...</p>
      </motion.div>
    );
  }

  return (
    <motion.div {...scaleIn} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Audit Logs</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Platform-wide activity and change history</p>
        </div>
        <button
          onClick={loadLogs}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 dark:border-slate-700/30 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-300 text-xs font-semibold transition"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {summary.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-sm p-4">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Weekly Top Actors</p>
          <div className="flex flex-wrap gap-2">
            {summary.map((s) => (
              <div key={s.actorId} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <span className="text-xs font-bold text-slate-900 dark:text-white">{s.actorName || s.actorId}</span>
                <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400">{s.count} actions</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Filters</span>
          <button
            onClick={clearFilters}
            className="ml-auto text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:underline"
          >
            Clear All
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Action</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            >
              <option value="">All Actions</option>
              {ACTION_OPTIONS.map((a) => (
                <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Target Type</label>
            <select
              value={filters.targetType}
              onChange={(e) => handleFilterChange('targetType', e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            >
              <option value="">All Types</option>
              {TARGET_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Actor</label>
            <select
              value={filters.actorId}
              onChange={(e) => handleFilterChange('actorId', e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            >
              <option value="">All Actors</option>
              {uniqueActors.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-9 pr-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-9 pr-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                <th className="px-6 py-4 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actor</th>
                <th className="px-6 py-4 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Target</th>
                <th className="px-6 py-4 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <AnimatePresence initial={false}>
                {logs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-950/40 transition cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      >
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          {log.actorName || log.actorEmail || log.userId}
                        </td>
                        <td className="px-6 py-4">
                          {actionBadge(log.action)}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          {log.targetType || '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="inline-flex items-center text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </td>
                      </tr>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.tr
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <td colSpan={5} className="px-6 py-4">
                              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Change Diff</p>
                                <p className="text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap">
                                  {renderDiff(log.details)}
                                </p>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </AnimatePresence>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    No audit logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-slate-400">
            Showing {offset + 1}–{Math.min(offset + limit, total)} of {total} entries
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-lg border border-white/20 dark:border-slate-700/30 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950 disabled:opacity-50 transition"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let page: number;
              if (totalPages <= 7) {
                page = i + 1;
              } else if (currentPage <= 4) {
                page = i + 1;
              } else if (currentPage >= totalPages - 3) {
                page = totalPages - 6 + i;
              } else {
                page = currentPage - 3 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition ${
                    currentPage === page
                      ? 'border-teal-500/40 bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400'
                      : 'border-white/20 dark:border-slate-700/30 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-white/20 dark:border-slate-700/30 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950 disabled:opacity-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};