/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api';
import { User, Task, Project } from '../../types.ts';
import { InternDetail } from '../../components/techlead/InternDetail';
import { UserManagement } from '../../components/manager/UserManagement';
import { UpcomingProjectsManager } from '../../components/manager/UpcomingProjectsManager';
import { getSupabaseClient } from '../../lib/supabaseClient';
import {
  Clock, Users, Building,
  ChevronRight, Star, Calendar, ShieldCheck,
  BarChart3, X, CheckCircle2, Layers, Zap, User as UserIcon, RefreshCw, AlertTriangle
} from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import { scaleIn } from '../../utils/motion';

interface ManagerOverviewProps {
  currentUser: User;
}

export const ManagerOverview: React.FC<ManagerOverviewProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'users' | 'upcoming_projects'>('telemetry');
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [techLeads, setTechLeads] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Drilldown states
  const [drilldownInternId, setDrilldownInternId] = useState<string | null>(null);
  const [drilldownTechLead, setDrilldownTechLead] = useState<User | null>(null);

  const loadData = async () => {
    try {
      const [allStats, users, tasks] = await Promise.all([
        api.getAnalytics(), // Load global real aggregated analytics from DB
        api.getUsers(),
        api.getTasks()
      ]);
      setAnalytics(allStats);
      setAllUsers(users);
      setTechLeads(users.filter(u => u.role === 'tech_lead'));
      setAllTasks(tasks);
    } catch (e) {
      console.error("Failed to load manager dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    let subscriptionChannel: any = null;

    const setupRealtime = async () => {
      try {
        const supabase = await getSupabaseClient();
        subscriptionChannel = supabase
          .channel('manager-oversight')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'User' },
            () => { loadData(); }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'DailyLog' },
            () => { loadData(); }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Task' },
            () => { loadData(); }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'DaySession' },
            () => { loadData(); }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Project' },
            () => { loadData(); }
          )
          .subscribe();
      } catch (err) {
        console.warn("Realtime subscriptions are inactive in ManagerOverview:", err);
      }
    };

    setupRealtime();

    const pollInterval = setInterval(() => {
      loadData();
    }, 30000);

    return () => {
      if (subscriptionChannel) {
        subscriptionChannel.unsubscribe();
      }
      clearInterval(pollInterval);
    };
  }, [drilldownInternId]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Retrieving executive telemetry & DB metrics...</p>
      </div>
    );
  }

  // If Manager is drilling down into an intern's details
  if (drilldownInternId) {
    return (
      <InternDetail
        internId={drilldownInternId}
        currentUser={currentUser}
        readOnly={true} // Read-only for Managers (oversight mode)
        onBack={() => setDrilldownInternId(null)}
      />
    );
  }

  const {
    complianceRate = 0,
    avgMarks = 0,
    totalLogs = 0,
    activeCount = 0,
    rosterData = [],
    mostUsedTechs = []
  } = analytics || {};

  const maxMark = Math.max(...rosterData.map((r: any) => r.avgMark), 1);
  const sortedMarks = [...rosterData].slice().sort((a: any, b: any) => (a.avgMark || 0) - (b.avgMark || 0));
  const maxWorkingHours = Math.max(...rosterData.map((r: any) => r.avgWorkingHours || 0), 1);
  const sortedHours = [...rosterData].slice().sort((a: any, b: any) => (b.avgWorkingHours || 0) - (a.avgWorkingHours || 0));

  return (
    <div id="manager-dashboard-root" className="space-y-6">

      {/* Executive Control Header */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-3xl p-6 md:p-8 shadow-lg shadow-teal-500/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 text-xs font-bold text-purple-700 dark:text-purple-300">
            <Building className="h-3.5 w-3.5" /> Company-wide Engineering Oversight
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Executive Control Desk</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
            Centralized telemetry detailing software engineering intern check-in compliance, mentor grading history, and user role administration computed from real database records.
          </p>
        </div>

        {/* Top Badges */}
        <div className="flex flex-wrap gap-3 shrink-0">
          <div className="p-3 bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/35 rounded-2xl text-center min-w-[100px]">
            <p className="text-[18px] font-black text-teal-700 dark:text-teal-400">{complianceRate}%</p>
            <p className="text-[8px] uppercase font-bold text-teal-500 mt-0.5">Org Compliance</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/35 rounded-2xl text-center min-w-[100px]">
            <p className="text-[18px] font-black text-emerald-700 dark:text-emerald-400">{avgMarks} ⭐</p>
            <p className="text-[8px] uppercase font-bold text-emerald-500 mt-0.5">Average Score</p>
          </div>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex border-b border-white/20 dark:border-slate-700/30 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`px-5 py-3 text-xs font-bold rounded-t-2xl transition flex items-center gap-2 border-t-2 ${
            activeTab === 'telemetry'
              ? 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-teal-600 text-teal-700 dark:text-teal-400 border-x border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className="h-4 w-4" /> Org-Wide Metrics & Telemetry
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-3 text-xs font-bold rounded-t-2xl transition flex items-center gap-2 border-t-2 ${
            activeTab === 'users'
              ? 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-teal-600 text-teal-700 dark:text-teal-400 border-x border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="h-4 w-4" /> SuperAdmin User & Access Control
        </button>

        <button
          onClick={() => setActiveTab('upcoming_projects')}
          className={`px-5 py-3 text-xs font-bold rounded-t-2xl transition flex items-center gap-2 border-t-2 ${
            activeTab === 'upcoming_projects'
              ? 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-teal-600 text-teal-700 dark:text-teal-400 border-x border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="h-4 w-4" /> Upcoming Projects Pipeline
        </button>
      </div>

      {activeTab === 'users' ? (
        <UserManagement currentUser={currentUser} onRefresh={loadData} />
      ) : activeTab === 'upcoming_projects' ? (
        <UpcomingProjectsManager currentUser={currentUser} onRefresh={loadData} />
      ) : (
        <>
          {/* Stats Widgets Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5 flex items-center gap-4">
              <div className="bg-purple-50 dark:bg-purple-950/40 text-purple-600 p-3 rounded-xl">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Tech Mentors</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{techLeads.length} Active</p>
              </div>
            </div>

            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5 flex items-center gap-4">
              <div className="bg-teal-50 dark:bg-teal-950/40 text-teal-600 p-3 rounded-xl">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Intern Headcount</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{rosterData.length} Total</p>
              </div>
            </div>

            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5 flex items-center gap-4">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 p-3 rounded-xl">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block animate-pulse shrink-0" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Presence Now</p>
                <p className="text-lg font-black text-emerald-600 mt-0.5">{activeCount} Coding</p>
              </div>
            </div>

            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5 flex items-center gap-4">
              <div className="bg-blue-50 dark:bg-blue-950/40 text-blue-500 p-3 rounded-xl">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Journal Entries</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{totalLogs} Submits</p>
              </div>
            </div>
          </div>

          {/* Charts & Tech Distribution Bento */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Average Intern Marks */}
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  Average Intern Marks <Star className="h-4 w-4 text-teal-600" />
                </h3>
                <p className="text-[9px] text-slate-400 mt-0.5">Sorted ascending — top performers extend furthest right</p>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-3">
                {sortedMarks.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-[10px]">No intern metric data available yet.</div>
                ) : (
                  sortedMarks.map((row: any) => (
                    <div key={row.intern.id} className="flex items-center gap-3">
                      <div className="w-32 shrink-0">
                        <p className="text-[11px] font-bold text-slate-800 dark:text-white truncate">{row.intern.name}</p>
                        <p className="text-[9px] text-slate-400 truncate">{row.intern.email}</p>
                      </div>
                      <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
                          style={{ width: `${(row.avgMark / maxMark) * 100}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 w-10 text-right">
                        {row.avgMark} <Star className="h-3 w-3 fill-amber-400 text-amber-400 inline" />
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Average Working Hours */}
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  Working Hours (Last 7 Days) <Clock className="h-4 w-4 text-emerald-600" />
                </h3>
                <p className="text-[9px] text-slate-400 mt-0.5">Avg daily hours from completed sessions — most hours at the top</p>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-3">
                {sortedHours.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-[10px]">No session data available yet.</div>
                ) : (
                  sortedHours.map((row: any) => {
                    const hrs = row.avgWorkingHours || 0;
                    const pct = hrs > 0 ? Math.max((hrs / maxWorkingHours) * 100, 6) : 0;
                    return (
                      <div key={row.intern.id} className="flex items-center gap-3">
                        <div className="w-32 shrink-0">
                          <p className="text-[11px] font-bold text-slate-800 dark:text-white truncate">{row.intern.name}</p>
                          <p className="text-[9px] text-slate-400 truncate">{row.intern.email}</p>
                        </div>
                        <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 w-12 text-right">
                          {hrs}h
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* Tech Leads Team Performance Summary Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" /> Tech Lead Mentors & Team History
              </h3>
              <p className="text-xs text-slate-400">Click on any Tech Lead to drill down into their team's assignment history, review logs, and assigned interns.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {techLeads.map(lead => {
                const assignedInterns = rosterData.filter((r: any) => r.intern.assigned_tech_lead_id === lead.id || (!r.intern.assigned_tech_lead_id && lead.id === 'tl-alex'));
                const teamCount = assignedInterns.length;
                const teamAvgScore = teamCount > 0
                  ? (assignedInterns.reduce((acc: number, curr: any) => acc + curr.avgMark, 0) / teamCount).toFixed(1)
                  : 'N/A';
                const teamTasksDone = assignedInterns.reduce((acc: number, curr: any) => acc + curr.completedTasks, 0);
                const teamTotalTasks = assignedInterns.reduce((acc: number, curr: any) => acc + curr.totalTasks, 0);

                return (
                  <div
                    key={lead.id}
                    onClick={() => setDrilldownTechLead(lead)}
                    className="p-5 rounded-2xl border border-white/20 dark:border-slate-700/30 bg-teal-50/30 dark:bg-teal-950/10 hover:bg-teal-50/50 dark:hover:bg-teal-950/20 cursor-pointer transition space-y-3 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={lead.avatar} alt={lead.name} className="h-10 w-10 rounded-full object-cover border" referrerPolicy="no-referrer" />
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-teal-700 transition">{lead.name}</h4>
                          <p className="text-[10px] text-slate-400 font-mono">{lead.email}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-teal-700 transition" />
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-center">
                      <div>
                        <span className="text-[9px] font-bold uppercase text-slate-400">Interns</span>
                        <p className="text-xs font-black text-slate-800 dark:text-white">{teamCount}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase text-slate-400">Team Score</span>
                        <p className="text-xs font-black text-emerald-600">{teamAvgScore} ⭐</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase text-slate-400">Tasks Completed</span>
                        <p className="text-xs font-black text-teal-600">{teamTasksDone} / {teamTotalTasks}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Directory & Oversight Roster */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-teal-500/5 border border-white/20 dark:border-slate-700/30 p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Corporate Intern Directory</h3>
              <p className="text-xs text-slate-400">Click on any row to inspect an intern's full history (daily log commits, assigned boards, marks, or direct comments).</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="pb-3">Employee</th>
                    <th className="pb-3">Reporting Status</th>
                    <th className="pb-3">Assigned Tech Lead</th>
                    <th className="pb-3">Average Mark</th>
                    <th className="pb-3 text-right">Sprint Score</th>
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
                          <p className="text-sm font-bold text-slate-900 dark:text-white">No active interns yet 👥</p>
                          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                            No interns registered in the system yet. Once interns register under their respective engineering teams, their corporate profiles and metric curves will be fully tracked here.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    rosterData.map((row: any) => {
                      const findLead = techLeads.find(tl => tl.id === (row.intern.assigned_tech_lead_id || 'tl-alex'));
                      return (
                        <tr
                          key={row.intern.id}
                          onClick={() => setDrilldownInternId(row.intern.id)}
                          className="group hover:bg-slate-50/70 dark:hover:bg-slate-950/60 cursor-pointer transition duration-150"
                        >
                          {/* Name & Avatar */}
                          <td className="py-3 pr-2">
                            <div className="flex items-center gap-3">
                              <img src={row.intern.avatar} alt={row.intern.name} className="h-8 w-8 rounded-full object-cover border" referrerPolicy="no-referrer" />
                              <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-700 dark:group-hover:text-teal-400">{row.intern.name}</p>
                                <p className="text-[10px] text-slate-400 truncate">{row.intern.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Status check mark */}
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-1.5">
                              <span className={`h-2.5 w-2.5 rounded-full ${row.intern.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                {row.intern.active ? 'Active Now' : 'Offline'}
                              </span>
                            </div>
                          </td>

                          {/* Assigned Tech Lead */}
                          <td className="py-3 px-2">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {findLead ? findLead.name : 'Alex Rivera'}
                            </p>
                            <p className="text-[10px] text-slate-400">Engineering Lead</p>
                          </td>

                          {/* Score */}
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-bold text-xs">
                              {row.avgMark} <Star className="h-3.5 w-3.5 fill-teal-500 text-teal-500" />
                            </div>
                          </td>

                          {/* Quick drilldown */}
                          <td className="py-3 pl-2 text-right">
                            <div className="inline-flex items-center gap-2">
                              <div className="text-right">
                                <p className="text-xs font-bold text-slate-800 dark:text-white">
                                  {row.completedTasks} / {row.totalTasks} Tasks
                                </p>
                                <p className="text-[9px] text-rose-500">
                                  {row.unresolvedMistakesCount > 0 ? `${row.unresolvedMistakesCount} unresolved blunders` : 'Codebase Safe'}
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
        </>
      )}

      {/* Tech Lead Team History Drilldown Modal */}
      <AnimatePresence>
        {drilldownTechLead && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              variants={scaleIn}
              initial="initial"
              animate="animate"
              exit="exit"
              className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 relative overflow-hidden"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <img src={drilldownTechLead.avatar} alt={drilldownTechLead.name} className="h-10 w-10 rounded-full border" referrerPolicy="no-referrer" />
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Tech Lead Team History: {drilldownTechLead.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">{drilldownTechLead.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => setDrilldownTechLead(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Assigned Interns Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Assigned Team Interns ({rosterData.filter((r: any) => r.intern.assigned_tech_lead_id === drilldownTechLead.id || (!r.intern.assigned_tech_lead_id && drilldownTechLead.id === 'tl-alex')).length})
                </h4>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
                  {rosterData
                    .filter((r: any) => r.intern.assigned_tech_lead_id === drilldownTechLead.id || (!r.intern.assigned_tech_lead_id && drilldownTechLead.id === 'tl-alex'))
                    .map((row: any) => (
                      <div
                        key={row.intern.id}
                        onClick={() => {
                          setDrilldownTechLead(null);
                          setDrilldownInternId(row.intern.id);
                        }}
                        className="p-3 hover:bg-slate-50 dark:hover:bg-slate-950 flex items-center justify-between cursor-pointer rounded-xl transition"
                      >
                        <div className="flex items-center gap-2.5">
                          <img src={row.intern.avatar} alt={row.intern.name} className="h-7 w-7 rounded-full object-cover" referrerPolicy="no-referrer" />
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{row.intern.name}</p>
                            <p className="text-[10px] text-slate-400">{row.intern.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <p className="text-xs font-black text-teal-600">{row.avgMark} ⭐</p>
                            <p className="text-[9px] text-slate-400">{row.completedTasks}/{row.totalTasks} tasks done</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setDrilldownTechLead(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                >
                  Close History View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};




export default ManagerOverview;
