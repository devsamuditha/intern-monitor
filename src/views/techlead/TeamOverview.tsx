/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { User, TeamStats, Project, ProjectStatus } from '../../types.ts';
import { InternDetail } from '../../components/techlead/InternDetail';
import { ReviewQueue } from '../../components/techlead/ReviewQueue';
import { ProjectEditModal } from '../../components/techlead/ProjectEditModal';
import { RankingChart } from '../../components/intern/RankingChart';
import { ManagerAssignments } from '../../components/techlead/ManagerAssignments';
import { InternAttendanceFeed } from '../../components/attendance/InternAttendanceFeed';
import { getSupabaseClient } from '../../lib/supabaseClient';
import {
  Users, CheckCircle, Clock, Star, AlertTriangle,
  TrendingUp, Sparkles, ChevronRight, Check, X,
  Zap, Sun, CheckCircle2, MessageSquare, PlusCircle, Github, ExternalLink, CheckSquare, Calendar, LogOut, Trash2, Trophy, FolderOpen
} from 'lucide-react';
import {
  GLASS_VARIANTS, PASTEL_TEXT, PASTEL_SHADOWS
} from '../../components/ui/theme/ThemeTokens';
import { GlassTabBar, GlassPanel, GlassCard } from '../../components/ui/glass';
import { formatDate } from '../../utils/helpers';
import { scaleIn } from '../../utils/motion';
import { useApproveEarlyExit } from '../../hooks/queries/useDashboardQueries';

import { InternsManagement } from '../../components/techlead/InternsManagement';
import { TechLeadProjects } from '../../components/techlead/TechLeadProjects';
import { InternDailyJournalSummary } from '../../components/techlead/InternDailyJournalSummary';

interface TeamOverviewProps {
  currentUser: User;
  activeTab?: string;
}

export const TeamOverview: React.FC<TeamOverviewProps> = ({ currentUser, activeTab = 'team_overview' }) => {
  const queryClient = useQueryClient();
  const [selectedInternId, setSelectedInternId] = useState<string | null>(null);
  const [lastNotifiedInternId, setLastNotifiedInternId] = useState<string | null>(null);

  const { data: analytics, isLoading: loading } = useQuery({
    queryKey: ["analytics", currentUser.id],
    queryFn: () => api.getAnalytics(currentUser.id),
    staleTime: 2 * 60 * 1000,
  });

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => api.getUsers(),
    staleTime: 2 * 60 * 1000,
  });

  const tasksQuery = useQuery({
    queryKey: ["tasks"],
    queryFn: () => api.getTasks(),
    staleTime: 2 * 60 * 1000,
  });

  const approveEarlyExitMutation = useApproveEarlyExit();

  const handleApproveEarlyExit = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await approveEarlyExitMutation.mutateAsync({ session_id: sessionId });
      invalidateAnalytics();
      alert('Early exit request approved successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to approve early exit.');
    }
  };

  const invalidateAnalytics = () => {
    queryClient.invalidateQueries({ queryKey: ["analytics", currentUser.id] });
  };

  const invalidateDashboard = () => {
    queryClient.invalidateQueries({ queryKey: ["analytics", currentUser.id] });
    queryClient.invalidateQueries({ queryKey: ["users"] });
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };

  useEffect(() => {
    let subscriptionChannel: any = null;

    try {
      const supabase = getSupabaseClient();
      subscriptionChannel = supabase
        .channel('techlead-team-overview')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'User' }, () => {
          invalidateAnalytics();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'DailyLog' }, () => {
          invalidateAnalytics();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'Task' }, () => {
          invalidateDashboard();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'DaySession' }, () => {
          invalidateAnalytics();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'Project' }, () => {
          invalidateAnalytics();
        })
        .subscribe();
    } catch (err) {
      console.warn("Realtime subscriptions are inactive in TeamOverview:", err);
    }

    return () => {
      if (subscriptionChannel) {
        subscriptionChannel.unsubscribe();
      }
    };
  }, [currentUser]);

  useEffect(() => {
    if (!selectedInternId || selectedInternId === lastNotifiedInternId) return;

    const notifyIntern = async () => {
      try {
        await api.createNotification({
          userId: selectedInternId,
          type: 'profile_viewed',
          title: 'Profile Viewed',
          message: `${currentUser.name} viewed your profile`,
          isRed: false,
        });
        setLastNotifiedInternId(selectedInternId);
      } catch (e) {
        console.error('Failed to create profile_viewed notification:', e);
      }
    };

    notifyIntern();
  }, [selectedInternId, currentUser, lastNotifiedInternId]);

  if (loading || usersQuery.isLoading || tasksQuery.isLoading) {
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

  const allUsers = usersQuery.data || [];
  const allTasks = tasksQuery.data || [];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'team_overview':
        return (
          <>
            <InternAttendanceFeed
              rosterData={rosterData}
              onInternSelect={(id) => setSelectedInternId(id)}
              canApproveEarlyExit={true}
              onApproveEarlyExit={async (sessionId) => { await approveEarlyExitMutation.mutateAsync({ session_id: sessionId }); }}
            />


            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Roster Table */}
              <GlassPanel className="lg:col-span-8 border border-slate-200/60 dark:border-slate-700/60 hover:shadow-lg transition-all duration-300 p-6 rounded-3xl bg-white/60 dark:bg-slate-900/40">
                <div className="mb-5">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="h-4 w-4 text-teal-500" /> Intern Roster
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Click into an intern card to review journal commits, award marks, or leave mentors feedback.</p>
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        <th className="pb-3 font-semibold">Intern name</th>
                        <th className="pb-3 font-semibold">1:30 PM Journal</th>
                        <th className="pb-3 font-semibold">5:00 PM Journal</th>
                        <th className="pb-3 font-semibold">Mistakes</th>
                        <th className="pb-3 font-semibold text-right">Assigned Project</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {rosterData.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center space-y-3">
                            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl w-14 h-14 flex items-center justify-center mx-auto text-slate-400 shadow-inner">
                              <Users className="h-7 w-7" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-black text-slate-900 dark:text-white">No interns assigned yet 👥</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
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
                              className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors duration-200"
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

                              {/* 1:30 PM Journal */}
                              <td className="py-3.5 px-2">
                                {(() => {
                                  if (row.submittedLogToday) {
                                    return (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" /> Submitted
                                      </span>
                                    );
                                  }
                                  if (row.missingLog130) {
                                    return (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                                        <X className="h-3 w-3" /> Missing
                                      </span>
                                    );
                                  }
                                  return (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 flex items-center gap-1">
                                      <Clock className="h-3 w-3" /> Pending
                                    </span>
                                  );
                                })()}
                              </td>

                              {/* 5:00 PM Journal */}
                              <td className="py-3.5 px-2">
                                {(() => {
                                  if (row.submittedLogToday) {
                                    return (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" /> Submitted
                                      </span>
                                    );
                                  }
                                  if (row.missingLog500) {
                                    return (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                                        <X className="h-3 w-3" /> Missing
                                      </span>
                                    );
                                  }
                                  return (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 flex items-center gap-1">
                                      <Clock className="h-3 w-3" /> Pending
                                    </span>
                                  );
                                })()}
                              </td>

                              {/* Mistakes */}
                              <td className="py-3.5 px-2">
                                <div className="flex items-center gap-1">
                                  <AlertTriangle className={`h-4 w-4 ${row.unresolvedMistakesCount > 0 ? 'text-rose-500 fill-rose-500' : 'text-slate-300'}`} />
                                  <span className="text-xs font-bold text-slate-800 dark:text-white">{row.unresolvedMistakesCount}</span>
                                </div>
                              </td>

                              {/* Assigned Project */}
                              <td className="py-3.5 pl-2 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <FolderOpen className="h-4 w-4 text-slate-400" />
                                  <span className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[140px]">{row.assignedProjectName}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card fallback */}
                <div className="md:hidden space-y-3">
                  {rosterData.length === 0 ? (
                    <div className="py-12 text-center space-y-3">
                      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-full w-14 h-14 flex items-center justify-center mx-auto text-slate-400">
                        <Users className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">No interns assigned yet 👥</p>
                        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                          No interns yet — invite your team to get started! Once interns register and log entries, their profiles and sprint telemetry will appear here.
                        </p>
                      </div>
                    </div>
                  ) : (
                    rosterData.map((row: any) => {
                      const sess = row.todaySession;
                      const isActive = sess?.status === 'active';
                      const isCompleted = sess?.status === 'completed';

                      return (
                        <GlassCard
                          key={row.intern.id}
                          onClick={() => setSelectedInternId(row.intern.id)}
                          shadow="card"
                          className="group cursor-pointer p-5 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white/80 dark:bg-slate-900/80"
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <div className="relative">
                              <img src={row.intern.avatar} alt={row.intern.name} className="h-12 w-12 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm group-hover:border-teal-200 transition-colors" referrerPolicy="no-referrer" />
                              {isActive && <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-black text-slate-900 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">{row.intern.name}</p>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">{row.intern.email}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-2xl group-hover:bg-teal-50 dark:group-hover:bg-teal-900/30 transition-colors">
                              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600" />
                            </div>
                          </div>

                           <div className="grid grid-cols-2 gap-3 mb-4">
                             <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl flex items-center gap-3 border border-slate-100 dark:border-slate-800/50">
                               <CheckCircle className={`h-4 w-4 ${row.submittedLogToday ? 'text-emerald-500 fill-emerald-500' : 'text-slate-300'}`} />
                               <div>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">1:30 PM Journal</p>
                                 <p className="text-[10px] font-black text-slate-800 dark:text-white">
                                   {row.submittedLogToday ? 'Submitted' : row.missingLog130 ? 'Missing' : 'Pending'}
                                 </p>
                               </div>
                             </div>
                             <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl flex items-center gap-3 border border-slate-100 dark:border-slate-800/50">
                               <CheckCircle className={`h-4 w-4 ${row.submittedLogToday ? 'text-emerald-500 fill-emerald-500' : 'text-slate-300'}`} />
                               <div>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">5:00 PM Journal</p>
                                 <p className="text-[10px] font-black text-slate-800 dark:text-white">
                                   {row.submittedLogToday ? 'Submitted' : row.missingLog500 ? 'Missing' : 'Pending'}
                                 </p>
                               </div>
                             </div>
                           </div>

                           <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                             <div className="flex items-center gap-2">
                               <AlertTriangle className="h-4 w-4 text-slate-400" />
                               <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                                 {row.unresolvedMistakesCount} Mistakes
                               </span>
                             </div>
                             <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                               <FolderOpen className="h-4 w-4 text-slate-400" />
                               <span className="text-[10px] font-black truncate max-w-[120px]">{row.assignedProjectName}</span>
                             </div>
                           </div>
                        </GlassCard>
                      );
                    })
                  )}
                </div>
              </GlassPanel>

              {/* High level team trends */}
              <div className="lg:col-span-4 space-y-6">
                {/* Intern Rankings */}
                <RankingChart currentUserId={currentUser.id} />



                {/* Tech Tag distribution */}
                <GlassPanel className="p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 hover:shadow-lg transition-all duration-300 bg-white/60 dark:bg-slate-900/40">
                  <div className="mb-5">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" /> Trending Technologies
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Stack distribution across submitted intern journals.</p>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {mostUsedTechs.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No logs parsed for tech stacks yet.</p>
                    ) : (
                      mostUsedTechs.map((tech: any) => (
                        <span 
                          key={tech.name} 
                          className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2 font-bold hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 dark:hover:bg-teal-900/30 dark:hover:border-teal-800 transition-colors cursor-default"
                        >
                          <span>{tech.name}</span>
                          <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 text-[10px] text-slate-500 dark:text-slate-400 font-black shadow-sm">
                            {tech.count}
                          </span>
                        </span>
                      ))
                    )}
                  </div>
                </GlassPanel>
              </div>
            </div>
          </>
        );
      case 'review_queue':
        return (
          <ReviewQueue
            currentUser={currentUser}
            onSelectIntern={(internId) => setSelectedInternId(internId)}
          />
        );
      case 'intern_summary':
        return (
          <InternDailyJournalSummary
            currentUser={currentUser}
          />
        );
      case 'ranking':
        return (
          <div className="max-w-4xl mx-auto">
            <RankingChart currentUserId={currentUser.id} />
          </div>
        );
      case 'projects':
        return (
          <TechLeadProjects
            currentUser={currentUser}
          />
        );
      case 'manager_assignments':
        return (
          <ManagerAssignments
            currentUser={currentUser}
            allUsers={allUsers}
            allTasks={allTasks}
            onRefresh={invalidateDashboard}
          />
        );
      case 'interns':
        return (
          <InternsManagement
            currentUser={currentUser}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div id="techlead-overview-root" className="space-y-6">

      {/* Stats row - only on team_overview */}
      {activeTab === 'team_overview' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard shadow="card" className="hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border border-slate-200/60 dark:border-slate-700/60 p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-widest mb-1.5">Roster Interns</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white flex items-baseline gap-1.5">
              {rosterData.length} <span className="text-xs font-bold text-slate-400 lowercase">assigned</span>
            </p>
          </GlassCard>
          <GlassCard shadow="card" className="hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 border border-emerald-200/60 dark:border-emerald-800/50 p-5 rounded-3xl bg-emerald-50/50 dark:bg-emerald-900/20">
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-widest mb-1.5">Working Now</p>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 flex items-baseline gap-1.5">
              {activeCount} <span className="text-xs font-bold text-emerald-600/70 dark:text-emerald-400/70 lowercase">online</span>
            </p>
          </GlassCard>
          <GlassCard shadow="card" className="hover:-translate-y-1 hover:shadow-lg hover:shadow-teal-500/10 transition-all duration-300 border border-teal-200/60 dark:border-teal-800/50 p-5 rounded-3xl bg-teal-50/50 dark:bg-teal-900/20">
            <p className="text-[11px] text-teal-600 dark:text-teal-400 font-extrabold uppercase tracking-widest mb-1.5">Average Score</p>
            <p className="text-3xl font-black text-teal-600 dark:text-teal-400 flex items-center gap-2">
              {avgMarks} <Star className="h-6 w-6 fill-teal-500 text-teal-500 mb-0.5" />
            </p>
          </GlassCard>
          <GlassCard shadow="card" className="hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 border border-indigo-200/60 dark:border-indigo-800/50 p-5 rounded-3xl bg-indigo-50/50 dark:bg-indigo-900/20">
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-widest mb-1.5">Total Submits</p>
            <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 flex items-baseline gap-1.5">
              {totalLogs} <span className="text-xs font-bold text-indigo-600/70 dark:text-indigo-400/70 lowercase">logged</span>
            </p>
          </GlassCard>
        </div>
      )}

      {renderTabContent()}
    </div>
  );
};

export default TeamOverview;
