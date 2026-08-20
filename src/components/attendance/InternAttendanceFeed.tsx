"use client";

import React, { useState } from "react";
import {
  Zap,
  AlertTriangle,
  CheckCircle2,
  Sun,
  LogOut,
  Github,
  ExternalLink,
} from "lucide-react";
import GlassPanel from "../ui/glass/GlassPanel";
import { parseTimeToMinutes } from "@/app/api/_lib/mappers";

interface InternAttendanceFeedProps {
  rosterData: any[];
  onInternSelect: (internId: string) => void;
  canApproveEarlyExit?: boolean;
  onApproveEarlyExit?: (sessionId: string) => Promise<void>;
}

export const InternAttendanceFeed: React.FC<InternAttendanceFeedProps> = ({
  rosterData,
  onInternSelect,
  canApproveEarlyExit = false,
  onApproveEarlyExit,
}) => {
  const [isApprovingAll, setIsApprovingAll] = useState(false);

  const EARLY_END_MINUTES = 17 * 60;
  const LATE_END_MINUTES = 17 * 60 + 30;

  const pendingCount = rosterData.filter(
    (r: any) => r.todaySession?.earlyExitRequested && !r.todaySession?.earlyExitApproved
  ).length;

  const handleApproveAll = async () => {
    if (isApprovingAll || !onApproveEarlyExit) return;
    const pendingSessions = rosterData
      .filter((r: any) => r.todaySession?.earlyExitRequested && !r.todaySession?.earlyExitApproved)
      .map((r: any) => r.todaySession.id);

    if (pendingSessions.length === 0) return;

    setIsApprovingAll(true);
    try {
      await Promise.all(pendingSessions.map((id: string) => onApproveEarlyExit(id)));
    } catch (err) {
      console.error(err);
    } finally {
      setIsApprovingAll(false);
    }
  };

  const activeCount = rosterData.filter((r: any) => r.todaySession?.status === "active").length;

  return (
    <GlassPanel variant="section" className="p-6 gap-4 bg-white/70 dark:bg-slate-900/70 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-50 dark:bg-emerald-950/50 p-2 rounded-xl text-emerald-600 dark:text-emerald-400">
            <Zap className="h-5 w-5 fill-emerald-500/20 text-emerald-500" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              Today&apos;s Intern Attendance & Start Day Feed
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold uppercase">
                {activeCount} Active On Duty
              </span>
            </h3>
            <p className="text-xs text-slate-400">Real-time status of interns who started their workday session today.</p>
          </div>
        </div>
      </div>

      {canApproveEarlyExit && pendingCount > 0 && (
        <button
          onClick={handleApproveAll}
          disabled={isApprovingAll}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 self-start"
        >
          {isApprovingAll ? "Approving All..." : `Approve All Pending Early Exits (${pendingCount})`}
        </button>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {rosterData.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 italic">No interns assigned to display attendance feed.</p>
        ) : (
          rosterData.map((row: any) => {
            const sess = row.todaySession;
            const isActive = sess?.status === "active";
            const isCompleted = sess?.status === "completed";

            return (
              <div
                key={row.intern.id}
                onClick={() => onInternSelect(row.intern.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isActive
                    ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 shadow-sm hover:border-emerald-500"
                    : isCompleted
                    ? "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                    : "bg-slate-50/50 dark:bg-slate-950/40 border-dashed border-slate-200 dark:border-slate-800 hover:border-teal-400"
                }`}
              >
                <div className="flex items-center justify-between gap-3 sm:gap-2 flex-wrap">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative">
                      <img
                        src={row.intern.avatar}
                        alt={row.intern.name}
                        className="h-8 w-8 rounded-full object-cover border"
                        referrerPolicy="no-referrer"
                      />
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
                      onInternSelect(row.intern.id);
                    }}
                    className="px-2 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 text-[10px] font-bold hover:bg-teal-100 dark:hover:bg-teal-900 transition shrink-0 self-start"
                  >
                    View
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-1.5 flex-wrap text-[10px]">
                  <div className="flex items-center gap-1 font-semibold min-w-0">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold shrink-0">Day Start:</span>
                    {isActive || isCompleted ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center gap-1 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block shrink-0" />
                        <span className="truncate">Started {sess.started_at}</span>
                        {sess?.is_late && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            LATE
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold flex items-center gap-1 text-amber-600 dark:text-amber-400 truncate">
                        <Sun className="h-3 w-3 text-amber-500 shrink-0" />
                        <span>Not started</span>
                      </span>
                    )}
                  </div>

                  {isActive ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                      <AlertTriangle className="h-3 w-3" /> Day not ended
                    </span>
                  ) : isCompleted && sess.ended_at ? (
                    (() => {
                      const endMinutes = parseTimeToMinutes(sess.ended_at);
                      if (endMinutes < EARLY_END_MINUTES) {
                        return (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                            <AlertTriangle className="h-3 w-3" /> Ended Early {sess.ended_at}
                          </span>
                        );
                      }
                      if (endMinutes <= LATE_END_MINUTES) {
                        return (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 shrink-0">
                            <CheckCircle2 className="h-3 w-3" /> Ended {sess.ended_at}
                          </span>
                        );
                      }
                      return (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                          <AlertTriangle className="h-3 w-3" /> Ended After Hours {sess.ended_at}
                        </span>
                      );
                    })()
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400 shrink-0">Not started</span>
                  )}
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
                        &ldquo;{sess.today_plan}&rdquo;
                      </p>
                    )}
                    {sess.git_link && (
                      <a
                        href={sess.git_link.startsWith("http") ? sess.git_link : `https://${sess.git_link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-mono text-[9px]"
                      >
                        <Github className="h-3 w-3 inline" /> Git Repo{" "}
                        <ExternalLink className="h-2.5 w-2.5 inline" />
                      </a>
                    )}
                  </div>
                )}

                {canApproveEarlyExit && sess && sess.earlyExitRequested && !sess.earlyExitApproved && (
                  <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/60 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                      <LogOut className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold">Early Exit Requested</span>
                    </div>
                    {sess.earlyExitReason && (
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900 p-1.5 rounded">
                        &ldquo;{sess.earlyExitReason}&rdquo;
                      </p>
                    )}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (onApproveEarlyExit) {
                          await onApproveEarlyExit(sess.id);
                        }
                      }}
                      className="w-full py-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold rounded-lg transition"
                    >
                      Approve Early Exit
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </GlassPanel>
  );
};
