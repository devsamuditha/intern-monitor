"use client";

import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Sun,
  Github,
  ExternalLink,
  Users,
} from "lucide-react";
import GlassCard from "../ui/glass/GlassCard";

interface InternDailySummaryProps {
  rosterData: any[];
  onInternSelect?: (internId: string) => void;
}

export const InternDailySummary: React.FC<InternDailySummaryProps> = ({
  rosterData,
  onInternSelect,
}) => {
  if (rosterData.length === 0) {
    return (
      <GlassCard
        variant="card"
        shadow="card"
        className="p-8 text-center cursor-default"
      >
        <Users className="h-10 w-10 text-slate-400 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No interns assigned yet</p>
        <p className="text-xs text-slate-400 mt-1">Daily summaries will appear here once interns are assigned.</p>
      </GlassCard>
    );
  }

  const cardClassName = "cursor-pointer gap-3 p-4 md:p-5 hover:shadow-lg hover:shadow-teal-500/10 hover:border-white/40 focus-visible:ring-2 focus-visible:ring-teal-400/50 focus-visible:ring-offset-2 transition-all duration-200";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {rosterData.map((row: any) => {
        const sess = row.todaySession;
        const isActive = sess?.status === "active";
        const isCompleted = sess?.status === "completed";
        const hasSubmittedToday =
          row.lastSubmission &&
          row.lastSubmission !== "Never" &&
          row.lastSubmission === new Date().toISOString().split("T")[0];

        const statusBorder = isActive
          ? "border-l-4 border-l-emerald-500"
          : isCompleted
          ? "border-l-4 border-l-slate-400"
          : "border-l-4 border-l-amber-400";

        return (
          <GlassCard
            key={row.intern.id}
            variant="card"
            shadow="card"
            onClick={() => onInternSelect?.(row.intern.id)}
            className={`${cardClassName} ${statusBorder}`}
            aria-label={`View ${row.intern.name}'s daily summary`}
          >
            <div className="flex items-center gap-3">
              <img
                src={row.intern.avatar}
                alt={row.intern.name}
                className="h-9 w-9 rounded-full object-cover border shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {row.intern.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{row.intern.email}</p>
              </div>
            </div>

            <div className="space-y-2 text-[10px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Day Start</span>
                {isActive ? (
                  <span className="text-[10px] font-extrabold flex items-center gap-1 text-emerald-700 dark:text-emerald-300 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block shrink-0" />
                    <span className="truncate">Started {sess.started_at}</span>
                    {sess?.is_late && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        LATE
                      </span>
                    )}
                  </span>
                ) : isCompleted ? (
                  <span className="text-[10px] font-bold flex items-center gap-1 text-slate-600 dark:text-slate-300 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block shrink-0" />
                    <span className="truncate">Ended {sess.ended_at}</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold flex items-center gap-1 text-amber-600 dark:text-amber-400 truncate">
                    <Sun className="h-3 w-3 text-amber-500 shrink-0" />
                    <span>Not started</span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-semibold">End Time</span>
                {isCompleted ? (
                  <span className="text-[10px] font-bold flex items-center gap-1 text-slate-600 dark:text-slate-300 truncate">
                    <CheckCircle2 className="h-3 w-3 text-teal-500 shrink-0" />
                    <span className="truncate">{sess.ended_at}</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold flex items-center gap-1 text-amber-600 dark:text-amber-400 truncate">
                    <Sun className="h-3 w-3 text-amber-500 shrink-0" />
                    <span>Day in progress</span>
                  </span>
                )}
              </div>

              {sess?.today_project && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">Project</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[60%]">
                    {sess.today_project}
                  </span>
                </div>
              )}

              {sess?.git_link && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">Git</span>
                  <a
                    href={sess.git_link.startsWith("http") ? sess.git_link : `https://${sess.git_link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-mono text-[9px] truncate"
                  >
                    <Github className="h-3 w-3 inline shrink-0" /> Repo{" "}
                    <ExternalLink className="h-2.5 w-2.5 inline" />
                  </a>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {row.missingLog530 ? (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                  <AlertTriangle className="h-3 w-3" /> Missing 5:30 PM Log
                </span>
              ) : row.missingLog130 ? (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <AlertTriangle className="h-3 w-3" /> Missing Log (1:30 PM)
                </span>
              ) : hasSubmittedToday ? (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" /> Log Submitted
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  Pending Log
                </span>
              )}
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
};
