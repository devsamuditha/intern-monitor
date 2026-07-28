/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, Award, Clock } from 'lucide-react';
import { DailyLog, Mark } from '../../types.ts';
import { formatDate } from '../../utils/helpers';

interface DailyLogTimelineProps {
  logs: DailyLog[];
  marks: Mark[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  dateFilter: string;
  setDateFilter: (v: string) => void;
}

export const DailyLogTimeline: React.FC<DailyLogTimelineProps> = ({
  logs,
  marks,
  searchTerm,
  setSearchTerm,
  dateFilter,
  setDateFilter
}) => {
  const filteredLogs = logs.filter(log => {
    const matchSearch = log.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        log.changes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        log.technologies.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchDate = dateFilter ? log.date === dateFilter : true;
    return matchSearch && matchDate;
  });

  return (
    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5 p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Past Logs History</h3>
          <p className="text-[11px] text-slate-400">Explore and search past code journal records.</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
            />
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white font-mono"
          />
        </div>
      </div>

      {/* Logs List Timeline */}
      <div className="space-y-4 pt-2">
        {logs.length === 0 ? (
          <div className="text-center py-10 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800/50 p-6 space-y-3">
            <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-full w-11 h-11 flex items-center justify-center mx-auto text-slate-400">
              <Clock className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">No logs yet — submit your first daily update!</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">Use the code journal submission form on the left to describe your changes, select your tech stack, and share your progress.</p>
            </div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 italic">
            No matching logs found. Clear filters to see all entries.
          </div>
        ) : (
          filteredLogs.map(log => {
            const relativeMark = marks.find(m => m.related_log_id === log.id);
            return (
              <div key={log.id} className="pl-6 border-l-2 border-teal-200 dark:border-teal-800 space-y-2">
                {/* Timeline dot */}
                <span className="absolute left-[-5px] top-1 h-2.5 w-2.5 rounded-full bg-teal-500 ring-4 ring-white dark:ring-slate-950" />

                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold font-mono">{formatDate(log.date)}</span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">{log.summary}</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${
                    log.status === 'reviewed'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                  }`}>
                    {log.status === 'reviewed' ? 'Reviewed' : 'Awaiting Review'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 font-mono whitespace-pre-wrap bg-slate-50/50 dark:bg-slate-950 p-2.5 rounded-xl leading-relaxed border border-slate-200 dark:border-slate-900/60">
                  {log.changes}
                </p>

                {/* Tech stack tags */}
                {log.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {log.technologies.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] text-slate-500 dark:text-slate-400">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Grade feedback */}
                {relativeMark && (
                  <div className="p-3 bg-teal-50/40 dark:bg-teal-950/20 rounded-xl border border-teal-100/30 dark:border-teal-900/10 space-y-1">
                    <p className="text-[9px] font-bold text-teal-700 dark:text-teal-400 flex items-center gap-0.5 uppercase tracking-wide">
                      Graded {relativeMark.score}/5 <Award className="h-3 w-3 fill-teal-500 text-teal-500" />
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic">"{relativeMark.comment}"</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};



