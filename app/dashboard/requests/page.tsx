"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/src/components/layout/DashboardShell";
import { EarlyExitRequestModal } from "@/src/components/intern/EarlyExitRequestModal";
import { useAuth } from "@/src/context/AuthContext";
import { useSettings } from "@/src/context/SettingsContext";
import { useDaySessions } from "@/src/hooks/queries/useQueries";
import { useRequestEarlyExit } from "@/src/hooks/queries/useDashboardQueries";
import { DaySession } from "@/src/types";
import { Clock, AlertTriangle, CheckCircle2, LogOut, Calendar, Loader2 } from "lucide-react";
import { formatDate } from "@/src/utils/helpers";
import { getISTDate, getISTDateString } from "@/src/utils/time";

export default function RequestsPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState("requests");

  if (!user) return null;

  const { data: sessions = [], isLoading, refetch } = useDaySessions(user.id, 50);
  const requestEarlyExitMutation = useRequestEarlyExit(user.id);
  const [showEarlyExitModal, setShowEarlyExitModal] = useState(false);

  const todayStr = getISTDate().toISOString().split('T')[0];
  const todaySession = sessions.find(s => s.date === todayStr && s.status === 'active');
  const hasPendingRequest = todaySession?.earlyExitRequested && !todaySession?.earlyExitApproved;
  const canRequestEarlyExit = todaySession && !todaySession.earlyExitRequested;

  const handleEarlyExitSubmit = async (reason: string) => {
    try {
      await requestEarlyExitMutation.mutateAsync({ intern_id: user.id, reason });
      setShowEarlyExitModal(false);
      refetch();
      alert("Early exit request submitted. Please wait for Tech Lead approval.");
    } catch (err: any) {
      alert(err.message || "Failed to request early exit");
    }
  };

  const getRequestStatus = (session: DaySession) => {
    if (!session.earlyExitRequested) return { label: 'No Request', color: 'text-slate-400', icon: null, bg: 'bg-white/5' };
    if (session.earlyExitApproved) return { label: 'Approved', color: 'text-emerald-300', icon: CheckCircle2, bg: 'bg-emerald-500/10' };
    return { label: 'Pending', color: 'text-amber-300', icon: AlertTriangle, bg: 'bg-amber-500/10' };
  };

  const formatSessionTime = (session: DaySession) => {
    const times = [];
    if (session.started_at) times.push(`Started: ${session.started_at}`);
    if (session.ended_at) times.push(`Ended: ${session.ended_at}`);
    return times.join(' | ') || 'No times recorded';
  };

  return (
    <DashboardShell settings={settings} activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-teal-400" />
            <h2 className="text-lg font-black tracking-tight text-white">Early Exit Requests</h2>
          </div>
          {canRequestEarlyExit && (
            <button
              onClick={() => setShowEarlyExitModal(true)}
              disabled={requestEarlyExitMutation.isPending}
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              Request Early Exit
            </button>
          )}
        </div>

        {hasPendingRequest && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Your early exit request is pending Tech Lead approval.
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600 mx-auto" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10 p-6 space-y-3">
            <div className="bg-white/10 p-3 rounded-full w-11 h-11 flex items-center justify-center mx-auto text-slate-400">
              <Clock className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold text-white/60">No day sessions yet.</p>
            <p className="text-[11px] text-white/50">Start your day to see session history here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => {
              const status = getRequestStatus(session);
              const StatusIcon = status.icon;
              return (
                <div key={session.id} className={`p-4 rounded-xl border ${status.bg} border-white/10 space-y-2`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-mono text-white/60">{formatDate(session.date)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${
                        session.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${status.bg} ${status.color} text-[10px] font-bold`}>
                      {StatusIcon && <StatusIcon className="h-3 w-3" />}
                      {status.label}
                    </div>
                  </div>

                  <p className="text-xs text-white/60 font-mono">{formatSessionTime(session)}</p>

                  {session.today_project && (
                    <p className="text-xs text-white/80">Project: {session.today_project}</p>
                  )}

                  {session.earlyExitReason && (
                    <div className="mt-2 p-2 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-[10px] font-bold text-white/50 uppercase mb-1">Reason</p>
                      <p className="text-xs text-white/70 italic">"{session.earlyExitReason}"</p>
                    </div>
                  )}

                  {session.is_late && (
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-300">
                      <AlertTriangle className="h-3 w-3" />
                      Started late (after 9:30 AM IST)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <EarlyExitRequestModal
          show={showEarlyExitModal}
          onClose={() => setShowEarlyExitModal(false)}
          onSubmit={handleEarlyExitSubmit}
          isLoading={requestEarlyExitMutation.isPending}
        />
      </div>
    </DashboardShell>
  );
}
