/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { User, DailyLog, Mark } from '../../types.ts';
import { 
  BookOpen, Calendar, Search, Star, ExternalLink, Github, ChevronDown, ChevronUp, RefreshCw, FileText, CheckCircle
} from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import { scaleIn } from '../../utils/motion';

interface InternDailyJournalSummaryProps {
  currentUser: User;
}

export const InternDailyJournalSummary: React.FC<InternDailyJournalSummaryProps> = ({ currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIntern, setSelectedIntern] = useState<string>('all');
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({});

  // Fetch interns assigned to this tech lead
  const { data: interns = [], isLoading: internsLoading } = useQuery({
    queryKey: ["users", "techlead-interns"],
    queryFn: () => api.getUsers({ role: 'intern', assigned_tech_lead_id: currentUser.id }),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", "all"],
    queryFn: () => api.getProjects(),
  });

  // Fetch all logs
  const { data: logs = [], isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ["logs", "techlead-intern-logs"],
    queryFn: () => api.getLogs(),
  });

  // Fetch all marks (to match with logs)
  const { data: marks = [], isLoading: marksLoading, refetch: refetchMarks } = useQuery({
    queryKey: ["marks", "techlead-intern-marks"],
    queryFn: () => api.getMarks(),
  });

  const handleRefresh = () => {
    refetchLogs();
    refetchMarks();
  };

  // Map interns for lookup
  const internIds = new Set(interns.map(i => i.id));
  const myInternsLogs = logs.filter(log => internIds.has(log.intern_id));

  // Filter logs
  const filteredLogs = myInternsLogs.filter(log => {
    if (selectedIntern !== 'all' && log.intern_id !== selectedIntern) return false;
    
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const intern = interns.find(i => i.id === log.intern_id);
      const matchName = intern ? intern.name.toLowerCase().includes(q) : false;
      const matchSummary = log.summary.toLowerCase().includes(q);
      const matchChanges = log.changes.toLowerCase().includes(q);
      return matchName || matchSummary || matchChanges;
    }
    return true;
  });

  // Group logs by date
  const logsByDate: Record<string, DailyLog[]> = {};
  filteredLogs.forEach(log => {
    if (!logsByDate[log.date]) {
      logsByDate[log.date] = [];
    }
    logsByDate[log.date].push(log);
  });

  // Sort dates descending
  const sortedDates = Object.keys(logsByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const toggleDayCollapse = (date: string) => {
    setCollapsedDays(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  const getLogMark = (logId: string) => {
    return marks.find(m => m.related_log_id === logId);
  };

  const getInternName = (internId: string) => {
    return interns.find(i => i.id === internId)?.name || 'Unknown Intern';
  };

  const getInternAvatar = (internId: string) => {
    return interns.find(i => i.id === internId)?.avatar || '/favicon.ico';
  };

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Unknown Project';
  };

  const loadingData = internsLoading || logsLoading || marksLoading;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/30 p-6 md:p-8 shadow-lg shadow-teal-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-600 text-white shadow-md">
                <BookOpen className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-white">
                Intern Daily Journal Feed
              </h2>
            </div>
            <p className="text-xs text-slate-300">
              Track chronological journal submissions day-by-day across all supervised software engineering interns, monitoring their commits, logs, and received reviews.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition cursor-pointer self-start sm:self-auto"
            title="Refresh Feed"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className="bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/30 p-4 shadow-lg shadow-teal-500/5 gap-3 flex flex-col sm:flex-row">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search journal summary or code changes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-white/10 bg-slate-950/20 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Intern Filter */}
        <div className="sm:w-56 shrink-0">
          <select
            value={selectedIntern}
            onChange={(e) => setSelectedIntern(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-white/10 bg-slate-900 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">💻 All Assigned Interns</option>
            {interns.map(i => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Journal feed day-by-day */}
      {loadingData ? (
        <div className="py-20 text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
          <p className="text-xs text-slate-400">Loading daily summaries...</p>
        </div>
      ) : sortedDates.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-12 text-center space-y-3">
          <BookOpen className="h-10 w-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-white">No journal submissions found</p>
          <p className="text-xs text-slate-400">Intern logs will appear here once submitted and synced.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const dateLogs = logsByDate[date];
            const isCollapsed = !!collapsedDays[date];

            return (
              <div 
                key={date}
                className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-lg"
              >
                {/* Date Header */}
                <div 
                  onClick={() => toggleDayCollapse(date)}
                  className="px-5 py-4 flex items-center justify-between bg-white/5 border-b border-white/10 cursor-pointer hover:bg-white/10 transition select-none"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4.5 w-4.5 text-teal-400" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">{formatDate(date)}</span>
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/30 text-[9px] font-extrabold text-teal-300">
                      {dateLogs.length} {dateLogs.length === 1 ? 'Submission' : 'Submissions'}
                    </span>
                  </div>
                  <button className="text-slate-400 hover:text-white transition">
                    {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </button>
                </div>

                {/* Submissions List for the Day */}
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden divide-y divide-white/5"
                    >
                      <div className="p-4 space-y-4">
                        {dateLogs.map((log) => {
                          const mark = getLogMark(log.id);
                          const isReviewed = log.status === 'reviewed';
                          const internName = getInternName(log.intern_id);
                          const internAvatar = getInternAvatar(log.intern_id);
                          const projName = getProjectName(log.project_id);

                          return (
                            <div 
                              key={log.id} 
                              className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-5 flex flex-col md:flex-row gap-5 items-start justify-between hover:border-white/20 transition duration-150"
                            >
                              {/* Left Content (Metadata & Text details) */}
                              <div className="space-y-3 flex-1 min-w-0">
                                {/* Intern Meta Row */}
                                <div className="flex items-center gap-2.5">
                                  <img 
                                    src={internAvatar} 
                                    alt="" 
                                    className="h-8 w-8 rounded-full object-cover border border-white/10 shrink-0" 
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-extrabold text-white truncate">{internName}</h4>
                                    <p className="text-[9px] text-teal-300 font-bold uppercase tracking-wider">{projName}</p>
                                  </div>
                                </div>

                                {/* Summary & Code description */}
                                <div className="space-y-2">
                                  <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Today's Summary</span>
                                    <p className="text-xs text-slate-100 leading-relaxed font-semibold">{log.summary}</p>
                                  </div>

                                  <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Git Commit & Code Changes</span>
                                    <p className="text-[11px] text-slate-300 font-mono bg-slate-950/40 border border-white/5 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                                      {log.changes}
                                    </p>
                                  </div>
                                </div>

                                {/* Tech Stack & Links */}
                                <div className="flex flex-wrap items-center gap-4 pt-1.5">
                                  {log.technologies.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {log.technologies.map(tech => (
                                        <span key={tech} className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 text-[9px] font-bold">
                                          {tech}
                                        </span>
                                      ))}
                                    </div>
                                  )}

                                  {log.github_url && (
                                    <a
                                      href={log.github_url.startsWith('http') ? log.github_url : `https://${log.github_url}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-300 hover:text-white transition"
                                    >
                                      <Github className="h-3.5 w-3.5" /> Commit Codebase <ExternalLink className="h-2.5 w-2.5" />
                                    </a>
                                  )}
                                </div>
                              </div>

                              {/* Right Content (Grades / Screenshots) */}
                              <div className="w-full md:w-64 shrink-0 flex flex-col gap-3 justify-between items-start md:items-end">
                                {/* Screenshot Preview if exists */}
                                {log.screenshot_url && (
                                  <div className="h-24 w-full rounded-lg overflow-hidden border border-white/10 bg-slate-950 shrink-0">
                                    <img 
                                      src={log.screenshot_url} 
                                      alt="Journal commit screenshot" 
                                      className="h-full w-full object-cover hover:scale-102 transition"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                )}

                                {/* Grade Status Badge */}
                                {isReviewed && mark ? (
                                  <div className="w-full p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1 text-left">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                        Score: {mark.score} / 5
                                      </span>
                                      <span className="text-[8px] text-slate-400 font-semibold uppercase">Reviewed</span>
                                    </div>
                                    {mark.comment && (
                                      <p className="text-[10px] text-slate-300 italic">"{mark.comment}"</p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="w-full p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left">
                                    <p className="text-[10px] font-bold text-amber-400 flex items-center gap-1.5 animate-pulse">
                                      <FileText className="h-3.5 w-3.5" />
                                      Pending grading review
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
