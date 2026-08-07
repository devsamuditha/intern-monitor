/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { api } from '../../services/api';
import { User, TeamStats, Project } from '../../types.ts';
import { InternDetail } from '../../components/techlead/InternDetail';
import { ReviewQueue } from '../../components/techlead/ReviewQueue';
import { getSupabaseClient } from '../../lib/supabaseClient';
import {
  Users, CheckCircle, Clock, Star, Flame, AlertTriangle,
  TrendingUp, Sparkles, ChevronRight, Check, X, ShieldCheck,
  Zap, Sun, CheckCircle2, MessageSquare, PlusCircle, Github, ExternalLink, CheckSquare, Calendar
} from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import { scaleIn } from '../../utils/motion';

interface TeamOverviewProps {
  currentUser: User;
}

export const TeamOverview: React.FC<TeamOverviewProps> = ({ currentUser }) => {
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInternId, setSelectedInternId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'roster' | 'upcoming_projects'>('queue');

  const loadAnalytics = async () => {
    try {
      const stats = await api.getAnalytics(currentUser.id);
      setAnalytics(stats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();

    let subscriptionChannel: any = null;

    const setupRealtime = async () => {
      try {
        const supabase = await getSupabaseClient();
        subscriptionChannel = supabase
          .channel('techlead-team-overview')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'User' },
            () => {
              loadAnalytics();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'DailyLog' },
            () => {
              loadAnalytics();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Task' },
            () => {
              loadAnalytics();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'DaySession' },
            () => {
              loadAnalytics();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Project' },
            () => {
              loadAnalytics();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn("Realtime subscriptions are inactive in TeamOverview:", err);
      }
    };

    setupRealtime();

    const pollInterval = setInterval(() => {
      loadAnalytics();
    }, 30000);

    return () => {
      if (subscriptionChannel) {
        subscriptionChannel.unsubscribe();
      }
      clearInterval(pollInterval);
    };
  }, [currentUser, selectedInternId]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-sm text-slate-500">Retrieving team rosters...</p>
      </div>
    );
  }

  // If drilling down into single intern
  if (selectedInternId) {
    return (
      <InternDetail 
        internId={selectedInternId} 
        currentUser={currentUser} 
        onBack={() => setSelectedInternId(null)} 
      />
    );
  }

  const {
    complianceRate = 0,
    avgMarks = 0,
    totalLogs = 0,
    activeCount = 0,
    rosterData = [],
    submissionTrend = [],
    mostUsedTechs = []
  } = analytics || {};

  return (
    <div id="techlead-overview-root" className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-sm">
        {/* Background art blur */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> Authorized Tech Lead Reviewer
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight mt-2">Hello, {currentUser.name}! 👋</h2>
            <p className="text-xs text-teal-100 max-w-md">
              Review and score daily learning journals, assign target sprint tasks, flag security concerns, and mentor your software engineering interns.
            </p>
          </div>
          
          <div className="bg-white/10 border border-white/10 p-4 rounded-2xl backdrop-blur-sm flex items-center gap-4">
            <p className="text-xs font-semibold text-teal-100">Today's Check-in compliance</p>
            <div className="relative h-14 w-14 shrink-0 flex items-center justify-center font-bold text-sm bg-teal-900/40 rounded-full border border-teal-500">
              {complianceRate}%
              {/* Radial gradient loader */}
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg shadow-teal-500/5">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Roster Interns</p>
          <p className="text-lg font-black text-slate-800 dark:text-white mt-1">{rosterData.length} assigned</p>
        </div>
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg shadow-teal-500/5">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Working Now</p>
          <p className="text-lg font-black text-emerald-600 mt-1">{activeCount} online</p>
        </div>
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg shadow-teal-500/5">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Average Score</p>
          <p className="text-lg font-black text-teal-600 dark:text-teal-400 mt-1 flex items-center gap-1">
            {avgMarks} <Star className="h-4 w-4 fill-teal-500 text-teal-500" />
          </p>
        </div>
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl p-4 shadow-lg shadow-teal-500/5">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Total Submissions</p>
          <p className="text-lg font-black text-slate-800 dark:text-white mt-1">{totalLogs} logged</p>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-white/20 dark:border-slate-700/30 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-5 py-3 text-xs font-bold rounded-t-2xl transition flex items-center gap-2 border-t-2 ${
            activeTab === 'queue'
              ? 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-teal-600 text-teal-700 dark:text-teal-400 border-x border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CheckSquare className="h-4 w-4" /> Review Queue & Grading Desk
        </button>
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-5 py-3 text-xs font-bold rounded-t-2xl transition flex items-center gap-2 border-t-2 ${
            activeTab === 'roster'
              ? 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-teal-600 text-teal-700 dark:text-teal-400 border-x border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="h-4 w-4" /> Team Roster & Attendance Feed
        </button>
        <button
          onClick={() => setActiveTab('upcoming_projects')}
          className={`px-5 py-3 text-xs font-bold rounded-t-2xl transition flex items-center gap-2 border-t-2 ${
            activeTab === 'upcoming_projects'
              ? 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-teal-600 text-teal-700 dark:text-teal-400 border-x border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="h-4 w-4" /> Upcoming Projects
        </button>
      </div>

      {activeTab === 'queue' ? (
        <ReviewQueue
          currentUser={currentUser}
          onSelectIntern={(internId) => setSelectedInternId(internId)}
        />
      ) : activeTab === 'upcoming_projects' ? (
        <UpcomingProjectsView currentUser={currentUser} />
      ) : (
        <>
          {/* TODAY'S LIVE ATTENDANCE & START DAY FEED */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-50 dark:bg-emerald-950/50 p-2 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Zap className="h-5 w-5 fill-emerald-500/20 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                Today's Intern Attendance & Start Day Feed
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold uppercase">
                  {rosterData.filter((r: any) => r.todaySession?.status === 'active').length} Active On Duty
                </span>
              </h3>
              <p className="text-xs text-slate-400">Real-time status of interns who started their workday session today.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {rosterData.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 italic">No interns assigned to display attendance feed.</p>
          ) : (
            rosterData.map((row: any) => {
              const sess = row.todaySession;
              const isActive = sess?.status === 'active';
              const isCompleted = sess?.status === 'completed';
              const hasSubmittedToday = row.lastSubmission === formatDate(new Date().toISOString().split('T')[0]);

              return (
                <div
                  key={row.intern.id}
                  onClick={() => setSelectedInternId(row.intern.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isActive
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 shadow-sm hover:border-emerald-500'
                      : isCompleted
                      ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                       : 'bg-slate-50/50 dark:bg-slate-950/40 border-dashed border-slate-200 dark:border-slate-800 hover:border-teal-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative">
                        <img src={row.intern.avatar} alt={row.intern.name} className="h-8 w-8 rounded-full object-cover border" referrerPolicy="no-referrer" />
                        {isActive && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 animate-pulse" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{row.intern.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{row.intern.email}</p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedInternId(row.intern.id);
                      }}
                      className="px-2 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 text-[10px] font-bold hover:bg-teal-100 dark:hover:bg-teal-900 transition shrink-0"
                    >
                      View
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1 font-semibold">
                      {isActive ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                          Started {sess.started_at}
                          {sess?.is_late && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              LATE
                            </span>
                          )}
                        </span>
                      ) : isCompleted ? (
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-teal-500" />
                          Ended {sess.ended_at}
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-1">
                          <Sun className="h-3 w-3 text-amber-500" />
                          Not started yet
                        </span>
                      )}
                    </div>

                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      hasSubmittedToday
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {hasSubmittedToday ? 'Log Submitted 📝' : 'Pending Log ⏳'}
                    </span>
                  </div>

                  {sess && (sess.today_project || sess.today_plan || sess.git_link) && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-[10px] space-y-1">
                      {sess.today_project && (
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          📁 {sess.today_project}
                        </p>
                      )}
                      {sess.today_plan && (
                        <p className="text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                          "{sess.today_plan}"
                        </p>
                      )}
                      {sess.git_link && (
                        <a
                          href={sess.git_link.startsWith('http') ? sess.git_link : `https://${sess.git_link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                           className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-mono text-[9px]"
                        >
                          <Github className="h-3 w-3 inline" /> Git Repo <ExternalLink className="h-2.5 w-2.5 inline" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Roster Table */}
        <div className="lg:col-span-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-teal-500/5 border border-white/20 dark:border-slate-700/30 p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Intern Roster</h3>
            <p className="text-xs text-slate-400">Click into an intern card to review journal commits, award marks, or leave mentors feedback.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="pb-3 font-semibold">Intern name</th>
                  <th className="pb-3 font-semibold">Today's Start Day</th>
                  <th className="pb-3 font-semibold">Log Streak</th>
                  <th className="pb-3 font-semibold">Average Stars</th>
                  <th className="pb-3 font-semibold text-right">Sprint Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/30 dark:divide-slate-700/30">
                {rosterData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center space-y-3">
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto text-slate-400">
                        <Users className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">No interns assigned yet 👥</p>
                        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                          No interns yet — invite your team to get started! Once interns register and log entries, their profiles and sprint telemetry will appear here.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rosterData.map((row: any) => {
                    const sess = row.todaySession;
                    const isActive = sess?.status === 'active';
                    const isCompleted = sess?.status === 'completed';

                    return (
                      <tr 
                        key={row.intern.id}
                        onClick={() => setSelectedInternId(row.intern.id)}
                        className="group hover:bg-slate-50/70 dark:hover:bg-slate-950/60 cursor-pointer transition duration-150"
                      >
                        {/* Name & Avatar */}
                        <td className="py-3.5 pr-2">
                          <div className="flex items-center gap-3">
                            <img src={row.intern.avatar} alt={row.intern.name} className="h-8 w-8 rounded-full object-cover border" referrerPolicy="no-referrer" />
                            <div className="min-w-0">
                               <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-700 dark:group-hover:text-teal-400">{row.intern.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{row.intern.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Start Day Status */}
                        <td className="py-3.5 px-2">
                          <div className="flex items-center gap-1.5">
                            {isActive ? (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                                sess?.is_late
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full animate-ping inline-block ${sess?.is_late ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                {sess?.is_late ? 'Late Started ' : 'Started '}{sess.started_at}
                              </span>
                            ) : isCompleted ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                Ended {sess.ended_at}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                Not started
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Streak */}
                        <td className="py-3.5 px-2">
                          <div className="flex items-center gap-1">
                            <Flame className={`h-4 w-4 ${row.streak > 0 ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                            <span className="text-xs font-bold text-slate-800 dark:text-white">{row.streak} days</span>
                          </div>
                        </td>

                        {/* Score */}
                        <td className="py-3.5 px-2">
                          <div className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-bold text-xs">
                            {row.avgMark} <Star className="h-3.5 w-3.5 fill-teal-500 text-teal-500" />
                          </div>
                        </td>

                        {/* Task score compliance */}
                        <td className="py-3.5 pl-2 text-right">
                          <div className="inline-flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-800 dark:text-white">
                                {row.completedTasks} / {row.totalTasks} Done
                              </p>
                              <p className="text-[9px] text-slate-400">
                                {row.unresolvedMistakesCount > 0 
                                  ? `${row.unresolvedMistakesCount} blunders flagged` 
                                  : 'All clean'}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition" />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* High level team trends */}
        <div className="lg:col-span-4 space-y-6">
          {/* Custom SVG Bar Chart */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-teal-500/5 border border-white/20 dark:border-slate-700/30 p-6 space-y-3.5">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                Submissions (Last 7 Days) <TrendingUp className="h-4 w-4 text-teal-600" />
              </h3>
            </div>

            <div className="h-32 flex items-end justify-between pt-4 border-b pb-1 border-slate-200 dark:border-slate-800">
              {submissionTrend.map((t: any, idx: number) => {
                const maxCount = Math.max(...submissionTrend.map((d: any) => d.count), 1);
                const pct = (t.count / maxCount) * 100;
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 bg-slate-950 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                      {t.count} logs
                    </div>
                    {/* Bar */}
                    <div 
                      className="w-4 bg-teal-500 hover:bg-teal-600 rounded-t-sm transition-all duration-300"
                      style={{ height: `${Math.max(pct, 10)}%` }}
                    />
                    {/* Date */}
                    <span className="text-[8px] text-slate-400 mt-1 truncate max-w-[36px] font-mono">
                      {t.date.substring(8, 10)}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 text-center">Dates mapped relative to sprint timeline.</p>
          </div>

          {/* Tech Tag distribution */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-teal-500/5 border border-white/20 dark:border-slate-700/30 p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Trending Technologies</h3>
              <p className="text-[11px] text-slate-400">Stack distribution across submitted intern journals.</p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {mostUsedTechs.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No logs parsed for tech stacks yet.</p>
              ) : (
                mostUsedTechs.map((tech: any) => (
                    <span 
                      key={tech.name} 
                      className="px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/40 text-xs text-teal-700 dark:text-teal-300 flex items-center gap-1.5 font-medium"
                    >
                      <span>{tech.name}</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/80 text-[10px] text-teal-700 dark:text-teal-400 font-bold">
                      {tech.count}
                    </span>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};




export default TeamOverview;

const UpcomingProjectsView: React.FC<{ currentUser: User }> = ({ currentUser }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [techLeads, setTechLeads] = useState<User[]>([]);

  const loadUpcoming = async () => {
    try {
      setLoading(true);
      const [projList, leads] = await Promise.all([
        api.getProjects({ status: 'upcoming' }),
        api.getPublicTechLeads(),
      ]);
      setProjects(projList);
      setTechLeads(leads);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUpcoming();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div id="upcoming-projects-techlead-root" className="space-y-6">
      <div className="bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          Upcoming Projects <Calendar className="h-5 w-5 text-teal-400" />
        </h2>
        <p className="text-xs text-slate-300">
          Projects scheduled by management for the upcoming sprint.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/30 p-12 text-center space-y-3">
          <div className="bg-white/10 p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto text-slate-400">
            <Calendar className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-white">No upcoming projects scheduled yet</p>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              Check back later or ask your manager to add upcoming projects to the pipeline.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => {
            const leads = techLeads.filter(l => proj.assigned_tech_lead_ids?.includes(l.id));
            return (
              <motion.div
                key={proj.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl overflow-hidden shadow-lg shadow-teal-500/5 flex flex-col hover:shadow-md transition duration-250 group"
              >
                <div className="h-44 bg-slate-100 dark:bg-slate-950 relative overflow-hidden shrink-0">
                  <img
                    src={proj.screenshots[0] || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80"}
                    alt={proj.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <a
                      href={proj.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-white text-[11px] font-bold flex items-center gap-1 hover:underline"
                    >
                      <Github className="h-4 w-4" /> View Repo codebase
                    </a>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-white leading-tight">{proj.name}</h3>
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{proj.description}</p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-white/20 dark:border-slate-700/30">
                    {proj.tech_stack.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {proj.tech_stack.map(tech => (
                          <span key={tech} className="px-2 py-0.5 rounded bg-white/10 border border-white/20 text-[9px] font-semibold text-teal-200">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-col gap-1 text-[10px] text-slate-300">
                      {proj.start_date && (
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Starts: {new Date(proj.start_date).toLocaleDateString()}</span>
                      )}
                      {leads.length > 0 && (
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Assigned to: {leads.map(l => l.name).join(', ')}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <a
                        href={proj.github_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-slate-300 hover:text-teal-300 flex items-center gap-1.5"
                      >
                        <Github className="h-4 w-4" /> Repo
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

