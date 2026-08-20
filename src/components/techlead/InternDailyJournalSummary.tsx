/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { User, DailyLog, Mark, DaySession } from '../../types.ts';
import { 
  Calendar, Search, Star, ExternalLink, Github, FileText, CheckCircle, X, Clock, ArrowLeft, Users, AlertTriangle, ChevronDown
} from 'lucide-react';
import { getRelativeDateStr } from '@/app/api/_lib/mappers';
import { formatDate } from '../../utils/helpers';

interface InternDailyJournalSummaryProps {
  currentUser: User;
}

export const InternDailyJournalSummary: React.FC<InternDailyJournalSummaryProps> = ({ currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInternId, setSelectedInternId] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

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
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["logs", "techlead-intern-logs"],
    queryFn: () => api.getLogs(),
  });

  // Fetch all marks (to match with logs)
  const { data: marks = [], isLoading: marksLoading } = useQuery({
    queryKey: ["marks", "techlead-intern-marks"],
    queryFn: () => api.getMarks(),
  });

  // Fetch today's day sessions for 5:00 PM journal status
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["day-sessions", "today"],
    queryFn: () => api.getTodayDaySessions(),
  });

  // Fetch detail sessions for selected intern (past 7 days)
  const { data: internDetailSessions = [], isLoading: detailSessionsLoading } = useQuery({
    queryKey: ["day-sessions", "intern-detail", selectedInternId],
    queryFn: () => api.getDaySessions(selectedInternId!, 10),
    enabled: !!selectedInternId,
  });

  const todayStr = getRelativeDateStr(0);
  const loadingData = internsLoading || logsLoading || marksLoading || sessionsLoading;

  // Derived data maps
  const internIds = useMemo(() => new Set(interns.map(i => i.id)), [interns]);
  const myInternsLogs = useMemo(() => logs.filter(log => internIds.has(log.intern_id)), [logs, internIds]);

  const todayLogsByIntern = useMemo(() => {
    const map: Record<string, DailyLog[]> = {};
    myInternsLogs
      .filter(log => log.date === todayStr)
      .forEach(log => {
        if (!map[log.intern_id]) {
          map[log.intern_id] = [];
        }
        map[log.intern_id].push(log);
      });
    return map;
  }, [myInternsLogs, todayStr]);

  const todaySessionsByIntern = useMemo(() => {
    const map: Record<string, DaySession> = {};
    sessions.forEach(session => {
      map[session.intern_id] = session;
    });
    return map;
  }, [sessions]);

  // Compute last 7 days (newest first)
  const last7Days = useMemo(() => {
    if (!selectedInternId) return [];
    return Array.from({ length: 7 }, (_, idx) => getRelativeDateStr(-idx));
  }, [selectedInternId]);

  // Compute day details for detail panel
  const dayDetails = useMemo(() => {
    if (!selectedInternId) return [];
    const internLogs = myInternsLogs.filter(log => log.intern_id === selectedInternId);
    const internSessionsMap = new Map(internDetailSessions.map(s => [s.date, s]));

    return last7Days.map(date => {
      const dayLogs = internLogs.filter(log => log.date === date);
      const session = internSessionsMap.get(date);
      return {
        date,
        log: dayLogs[0] || null,
        session: session || null,
      };
    });
  }, [selectedInternId, myInternsLogs, internDetailSessions, last7Days]);

  // Deadline checks (IST timezone)
  const isDeadline130Passed = useMemo(() => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const ist = new Date(utc + 5.5 * 3600000);
    const currentMinutes = ist.getHours() * 60 + ist.getMinutes();
    return currentMinutes >= (13 * 60 + 30);
  }, []);

  const isDeadline500Passed = useMemo(() => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const ist = new Date(utc + 5.5 * 3600000);
    const currentMinutes = ist.getHours() * 60 + ist.getMinutes();
    return currentMinutes >= (17 * 60);
  }, []);

  // Status derivation functions
  const get130Status = (internId: string): 'submitted' | 'missing' | 'pending' => {
    if (todayLogsByIntern[internId]?.length > 0) return 'submitted';
    if (isDeadline130Passed) return 'missing';
    return 'pending';
  };

  const get500Status = (internId: string): 'submitted' | 'missing' | 'pending' | 'not_started' => {
    const session = todaySessionsByIntern[internId];
    if (!session) return 'not_started';
    if (session.end_journal) return 'submitted';
    if (session.missedFinalJournal) return 'missing';
    if (isDeadline500Passed) return 'missing';
    return 'pending';
  };

  const get130PastStatus = (log: DailyLog | null): 'submitted' | 'missing' => {
    if (log) return 'submitted';
    return 'missing';
  };

  const get500PastStatus = (session: DaySession | null): 'submitted' | 'missing' | 'not_started' => {
    if (!session) return 'not_started';
    if (session.end_journal) return 'submitted';
    return 'missing';
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

  // Filter interns
  const filteredInterns = useMemo(() => {
    return interns.filter(intern => {
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return intern.name.toLowerCase().includes(q) || intern.email.toLowerCase().includes(q);
      }
      return true;
    });
  }, [interns, searchQuery]);

  const selectedIntern = selectedInternId ? interns.find(i => i.id === selectedInternId) : null;

  const toggleDay = (date: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const StatusBadge = ({ status, label }: { status: string; label: string }) => {
    if (status === 'submitted') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" /> Submitted
        </span>
      );
    }
    if (status === 'missing') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
          <X className="h-3 w-3" /> Missing
        </span>
      );
    }
    if (status === 'not_started') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 flex items-center gap-1">
          <Clock className="h-3 w-3" /> Day not started
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 flex items-center gap-1">
        <Clock className="h-3 w-3" /> Pending
      </span>
    );
  };

  const DaySection = ({ day }: { day: { date: string; log: DailyLog | null; session: DaySession | null } }) => {
    const isExpanded = expandedDays.has(day.date);
    const status130 = get130PastStatus(day.log);
    const status500 = get500PastStatus(day.session);

    return (
      <div className="border border-white/10 dark:border-slate-700/30 rounded-xl overflow-hidden">
        <button
          onClick={() => toggleDay(day.date)}
          className="w-full px-4 py-3 flex items-center justify-between bg-white/5 hover:bg-white/10 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-white">{formatDate(day.date)}</span>
            <span className="text-[10px] text-slate-400 font-semibold">
              {status130 === 'submitted' || status500 === 'submitted' ? 'Has submissions' : 'No submissions'}
            </span>
          </div>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key={`content-${day.date}`}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="p-5 space-y-4">
                {/* 1:30 PM Journal Section */}
                <div className="bg-teal-500/5 dark:bg-teal-900/10 border border-teal-500/20 dark:border-teal-700/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-[11px] font-black text-teal-300 uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" /> 1:30 PM Journal
                    </h5>
                    <StatusBadge status={status130} label="" />
                  </div>

                  {day.log ? (
                    <div className="space-y-3">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Summary</span>
                        <p className="text-xs text-slate-100 leading-relaxed font-semibold">{day.log.summary}</p>
                      </div>

                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Git Commit & Code Changes</span>
                        <p className="text-[11px] text-slate-300 font-mono bg-slate-950/40 border border-white/5 p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                          {day.log.changes}
                        </p>
                      </div>

                      {day.log.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {day.log.technologies.map(tech => (
                            <span key={tech} className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 text-[9px] font-bold">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4">
                        {day.log.github_url && (
                          <a
                            href={day.log.github_url.startsWith('http') ? day.log.github_url : `https://${day.log.github_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-300 hover:text-white transition"
                          >
                            <Github className="h-3.5 w-3.5" /> Commit Codebase <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                        {getProjectName(day.log.project_id) !== 'Unknown Project' && (
                          <span className="text-[10px] text-slate-400 font-semibold">
                            Project: {getProjectName(day.log.project_id)}
                          </span>
                        )}
                      </div>

                      {day.log.screenshot_url && (
                        <div className="h-24 w-full rounded-lg overflow-hidden border border-white/10 bg-slate-950 shrink-0">
                          <img 
                            src={day.log.screenshot_url} 
                            alt="Journal commit screenshot" 
                            className="h-full w-full object-cover hover:scale-102 transition"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {(() => {
                        const mark = getLogMark(day.log.id);
                        const isReviewed = day.log.status === 'reviewed';
                        if (isReviewed && mark) {
                          return (
                            <div className="w-full p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
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
                          );
                        }
                        return (
                          <div className="w-full p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                            <p className="text-[10px] font-bold text-amber-400 flex items-center gap-1.5 animate-pulse">
                              <FileText className="h-3.5 w-3.5" />
                              Pending grading review
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-4 space-y-1">
                      <FileText className="h-6 w-6 text-slate-500 mx-auto" />
                      <p className="text-xs font-bold text-slate-400">No 1:30 PM journal submitted</p>
                      <p className="text-[10px] text-slate-500">Intern has not submitted their midday journal yet.</p>
                    </div>
                  )}
                </div>

                {/* 5:00 PM Journal Section */}
                <div className="bg-indigo-500/5 dark:bg-indigo-900/10 border border-indigo-500/20 dark:border-indigo-700/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-[11px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" /> 5:00 PM Journal
                    </h5>
                    <StatusBadge status={status500} label="" />
                  </div>

                  {day.session ? (
                    <div className="space-y-3">
                      {day.session.end_journal ? (
                        <>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">End-of-Day Note</span>
                            <p className="text-xs text-slate-100 leading-relaxed font-semibold whitespace-pre-wrap">{day.session.end_journal}</p>
                          </div>
                          {day.session.ended_at && (
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <Clock className="h-3 w-3" />
                              Session ended at {day.session.ended_at}
                            </div>
                          )}
                          {day.session.missedFinalJournal && (
                            <div className="flex items-center gap-2 text-[10px] text-rose-400 font-semibold">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Missed final journal deadline
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-4 space-y-1">
                          <FileText className="h-6 w-6 text-slate-500 mx-auto" />
                          <p className="text-xs font-bold text-slate-400">No end-of-day note submitted</p>
                          <p className="text-[10px] text-slate-500">Intern has not submitted their end-of-day reflection yet.</p>
                          {day.session.missedFinalJournal && (
                            <div className="flex items-center justify-center gap-2 text-[10px] text-rose-400 font-semibold pt-1">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Missed final journal deadline
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 space-y-1">
                      <Clock className="h-6 w-6 text-slate-500 mx-auto" />
                      <p className="text-xs font-bold text-slate-400">Day not started</p>
                      <p className="text-[10px] text-slate-500">Intern has not started their day session yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toolbar Filters */}
      <div className="w-full">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-400" />
          <input
            type="text"
            placeholder="Search interns by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-teal-500/30 bg-slate-900/80 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent shadow-lg shadow-teal-500/5"
          />
        </div>
      </div>

      {/* Loading State */}
      {loadingData ? (
        <div className="py-20 text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
          <p className="text-xs text-slate-400">Loading intern summaries...</p>
        </div>
      ) : filteredInterns.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-12 text-center space-y-3">
          <Users className="h-10 w-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-white">No interns assigned yet</p>
          <p className="text-xs text-slate-400">Intern summaries will appear here once interns are assigned.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Intern Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredInterns.map((intern) => {
              const status130 = get130Status(intern.id);
              const status500 = get500Status(intern.id);

              return (
                <div
                  key={intern.id}
                  onClick={() => {
                    const next = selectedInternId === intern.id ? null : intern.id;
                    setSelectedInternId(next);
                    setExpandedDays(new Set());
                  }}
                  className="bg-slate-900/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/10 dark:border-slate-700/30 rounded-2xl p-4 md:p-5 shadow-lg hover:border-white/20 cursor-pointer transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <img 
                      src={intern.avatar} 
                      alt={intern.name} 
                      className="h-10 w-10 rounded-full object-cover border border-white/10 shrink-0" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-extrabold text-white truncate group-hover:text-teal-400 transition-colors">{intern.name}</h4>
                      <p className="text-[10px] text-slate-400 truncate">{intern.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={status130} label="1:30 PM" />
                    <StatusBadge status={status500} label="5:00 PM" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail Panel */}
          <AnimatePresence initial={false}>
            {selectedInternId && selectedIntern && (
              <motion.div
                key="detail-panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="overflow-hidden"
              >
                <div className="bg-slate-900/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/10 dark:border-slate-700/30 rounded-2xl shadow-lg overflow-hidden">
                  {/* Detail Header */}
                  <div className="px-5 py-4 flex items-center justify-between bg-white/5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <img 
                        src={selectedIntern.avatar} 
                        alt={selectedIntern.name} 
                        className="h-8 w-8 rounded-full object-cover border border-white/10 shrink-0" 
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h3 className="text-sm font-bold text-white">{selectedIntern.name}</h3>
                        <p className="text-[10px] text-slate-400">{selectedIntern.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedInternId(null)}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="p-5 space-y-3">
                    {detailSessionsLoading ? (
                      <div className="py-10 text-center space-y-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mx-auto"></div>
                        <p className="text-xs text-slate-400">Loading past journals...</p>
                      </div>
                    ) : dayDetails.length === 0 ? (
                      <div className="text-center py-10 space-y-2">
                        <FileText className="h-8 w-8 text-slate-500 mx-auto" />
                        <p className="text-xs font-bold text-slate-400">No journals found</p>
                        <p className="text-[10px] text-slate-500">No journal submissions in the last 7 days.</p>
                      </div>
                    ) : (
                      dayDetails.map(day => (
                        <DaySection key={day.date} day={day} />
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
