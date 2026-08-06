/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { api } from '../../services/api';
import { User } from '../../types.ts';
import { scaleIn } from '../../utils/motion';
import { TrendingUp, Users, Flag, Activity, RefreshCw, Server, Shield, AlertTriangle, ArrowRight, BarChart3, Award, Clock, Target, Zap, Globe, Code, Terminal, Rocket, Layers, ChevronRight } from 'lucide-react';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { QUICK_LINK_COLORS } from '../../components/ui/theme/ThemeTokens';

interface SuperAdminOverviewProps {
  currentUser: User;
}

export const SuperAdminOverview: React.FC<SuperAdminOverviewProps> = ({ currentUser }) => {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const handleNavigate = (path: string) => {
    const tab = path.split('/').pop();
    if (tab) {
      const event = new CustomEvent('superadmin-nav', { detail: tab });
      window.dispatchEvent(event);
    }
  };

  const loadData = async () => {
    if (isFetching) return;
    setIsFetching(true);
    setErrorMessage(null);
    try {
      const data = await api.getOverview();
      setOverview(data);
    } catch (e: any) {
      console.error("Failed to load overview data:", e);
      setErrorMessage(e?.message || "Failed to load overview data");
    } finally {
      setIsFetching(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    let subscriptionChannel: any = null;

    const setupRealtime = async () => {
      try {
        const supabase = await getSupabaseClient();
        // Create a uniquely-named channel per component instance to avoid reusing
        // a channel that may already be subscribed elsewhere in the app.
        const channelName = `superadmin-overview-${Date.now()}`;
        subscriptionChannel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'User' },
            () => {
              loadData();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'DailyLog' },
            () => {
              loadData();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Task' },
            () => {
              loadData();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'DaySession' },
            () => {
              loadData();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn("Realtime subscriptions are inactive in SuperAdminOverview:", err);
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
  }, []);

  if (loading) {
    return (
      <motion.div {...scaleIn} className="text-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading platform overview...</p>
      </motion.div>
    );
  }

  const totalUsers = overview?.usersByRole?.reduce((sum: number, r: any) => sum + r._count.id, 0) || 0;
  const complianceRate = overview?.submissionComplianceToday || 0;
  const pendingFlags = overview?.pendingFlags || 0;
  const avgMark = overview?.avgMark || 0;
  const usersByRole = overview?.usersByRole || [];

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString();
    } catch {
      return ts;
    }
  };

  return (
    <motion.div {...scaleIn} className="space-y-8">
      {errorMessage && (
        <div className="bg-rose-50 dark:bg-rose-900/30 p-3 rounded-md border border-rose-200/40 flex items-center justify-between">
          <div className="text-sm text-rose-700 dark:text-rose-200">Failed to load overview: {errorMessage}</div>
          <div className="flex items-center gap-2">
            <button onClick={loadData} className="text-xs px-3 py-1 bg-white/80 dark:bg-slate-800 rounded-md border">Retry</button>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Platform Overview</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Aggregated analytics from live database records</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 dark:border-slate-700/30 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-300 text-xs font-semibold transition"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Header Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl">
              <Globe className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{totalUsers}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Total Users</p>
            </div>
          </div>
          <div className="mt-4 space-y-1">
            {usersByRole.map((r: any) => (
              <div key={r.role} className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500 dark:text-slate-400 capitalize">{r.role.replace('_', ' ')}</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{r._count.id}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
              <Activity className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{overview?.activeInterns || 0}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Active Interns</p>
            </div>
          </div>
          {overview && (
            <>
              <div className="mt-4 flex gap-4">
                <div className="flex-1 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-900/30">
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Today</p>
                  <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">{complianceRate}%</p>
                  <p className="text-[9px] text-emerald-500">submission rate</p>
                </div>
                <div className="flex-1 bg-blue-50 dark:bg-blue-950/20 rounded-xl p-3 border border-blue-100 dark:border-blue-900/30">
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">This Week</p>
                  <p className="text-lg font-black text-blue-700 dark:text-blue-300">{overview?.submissionComplianceWeek || 0}%</p>
                  <p className="text-[9px] text-blue-500">submission rate</p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl">
              <Award className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{avgMark}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Avg Mark</p>
            </div>
          </div>
          <div className="mt-4 space-y-1">
            {overview?.marksHistogram?.map((h: any) => (
              <div key={h.range} className="flex items-center justify-between text-[10px]">
                <span className="text-slate-500 dark:text-slate-400">Score {h.range}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${overview?.marksHistogram?.length ? (h.count / Math.max(...overview.marksHistogram.map((x: any) => x.count))) * 100 : 0}%` }}></div>
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 w-6 text-right">{h.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Submissions Volume Chart */}
        {overview?.recentAuditLogs && (
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              Recent Activity <Activity className="h-4 w-4 text-teal-600" />
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {overview.recentAuditLogs.map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/50">
                  <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{log.action}</p>
                    <p className="text-[10px] text-slate-400">
                      {log.actorName || 'Unknown'} {log.targetType ? `on ${log.targetType.toLowerCase()}` : ''}
                    </p>
                  </div>
                  <span className="text-[9px] text-slate-300 dark:text-slate-600 shrink-0">{formatTimestamp(log.timestamp)}</span>
                </div>
              ))}
              {overview.recentAuditLogs.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No recent activity</p>
              )}
            </div>
          </div>
        )}

        {/* Top Technologies */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            Popular Technologies <Code className="h-4 w-4 text-teal-600" />
          </h3>
          <div className="space-y-3">
            {overview?.mostUsedTechs?.length > 0 ? (
              overview.mostUsedTechs.map((tech: any, idx: number) => {
                const maxCount = Math.max(...overview.mostUsedTechs.map((t: any) => t.count));
                const pct = (tech.count / maxCount) * 100;
                return (
                  <div key={tech.name} className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-slate-400 w-8 shrink-0">#{idx + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{tech.name}</span>
                        <span className="text-[10px] font-bold text-slate-400">{tech.count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">No technology data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Needs Attention + Quick Links Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Moderation Alert */}
        <div className="bg-rose-50/70 dark:bg-rose-950/20 backdrop-blur-xl p-6 rounded-2xl border border-rose-200/30 dark:border-rose-900/30 shadow-lg shadow-rose-500/5 space-y-4 cursor-pointer hover:bg-rose-100/70 dark:hover:bg-rose-950/30 transition" onClick={() => handleNavigate('/superadmin/moderation')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 dark:bg-rose-950/40 rounded-xl">
                <Flag className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-800 dark:text-rose-300">Pending Moderation</h3>
                <p className="text-[10px] text-rose-500 dark:text-rose-400">Content flags awaiting review</p>
              </div>
            </div>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{pendingFlags}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
            View Moderation Queue <ChevronRight className="h-3 w-3" />
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Shield className="h-4 w-4 text-teal-600" /> Quick Links
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Users', icon: Users, path: '/superadmin/users', color: 'teal' },
              { label: 'Audit', icon: Activity, path: '/superadmin/audit', color: 'indigo' },
              { label: 'Moderation', icon: Flag, path: '/superadmin/moderation', color: 'rose' },
              { label: 'Settings', icon: Server, path: '/superadmin/settings', color: 'amber' },
            ].map((link) => {
              const colors = QUICK_LINK_COLORS[link.color];
              const hoverLight: Record<string, string> = {
                teal: 'hover:bg-teal-100/50',
                indigo: 'hover:bg-indigo-100/50',
                rose: 'hover:bg-rose-100/50',
                amber: 'hover:bg-amber-100/50',
              };
              const hoverDark: Record<string, string> = {
                teal: 'dark:hover:bg-teal-950/30',
                indigo: 'dark:hover:bg-indigo-950/30',
                rose: 'dark:hover:bg-rose-950/30',
                amber: 'dark:hover:bg-amber-950/30',
              };
              return (
                <div
                  key={link.path}
                  onClick={() => handleNavigate(link.path)}
                  className={`flex items-center gap-3 p-4 rounded-xl ${colors.bg} ${colors.bgDark} border ${colors.border} ${colors.borderDark} cursor-pointer ${hoverLight[link.color]} ${hoverDark[link.color]} transition group`}
                >
                  <div className={`p-2 ${colors.iconBg} ${colors.iconBgDark} rounded-lg group-hover:scale-110 transition-transform`}>
                    <link.icon className={`h-4 w-4 ${colors.iconText} ${colors.iconTextDark}`} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{link.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};



export default SuperAdminOverview;

