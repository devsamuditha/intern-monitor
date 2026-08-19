"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/src/components/layout/DashboardShell";
import { useAuth } from "@/src/context/AuthContext";
import { useSettings } from "@/src/context/SettingsContext";
import { useMistakes } from "@/src/hooks/queries/useQueries";
import { ShieldAlert, Clock } from "lucide-react";
import { formatDate } from "@/src/utils/helpers";
import { ThemedIcon } from "@/src/components/ui/ThemedIcon";
import { MistakeSeverity } from "@/src/types";

export default function MistakesPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState("mistakes");

  if (!user) return null;

  const { data: mistakes = [], isLoading } = useMistakes(user.id);

  const severityConfig: Record<MistakeSeverity, { bg: string; border: string; text: string; label: string }> = {
    low: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-300', label: 'Low' },
    medium: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-300', label: 'Medium' },
    high: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-300', label: 'High' },
  };

  const unresolvedMistakes = mistakes.filter(m => !m.resolved);
  const resolvedMistakes = mistakes.filter(m => m.resolved);

  return (
    <DashboardShell settings={settings} activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ThemedIcon icon={ShieldAlert} color="amber" size={24} />
            <h2 className="text-lg font-black tracking-tight text-white">Mistakes &amp; Feedback</h2>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
            <p className="text-2xl font-black text-white">{mistakes.length}</p>
            <p className="text-[10px] text-slate-400 uppercase">Total</p>
          </div>
          <div className="bg-amber-500/10 rounded-xl p-4 text-center border border-amber-500/30">
            <p className="text-2xl font-black text-amber-300">{unresolvedMistakes.length}</p>
            <p className="text-[10px] text-amber-300 uppercase">Unresolved</p>
          </div>
          <div className="bg-emerald-500/10 rounded-xl p-4 text-center border border-emerald-500/30">
            <p className="text-2xl font-black text-emerald-300">{resolvedMistakes.length}</p>
            <p className="text-[10px] text-emerald-300 uppercase">Resolved</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mx-auto" />
          </div>
        ) : mistakes.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10 p-6 space-y-3">
            <div className="bg-white/10 p-3 rounded-full w-11 h-11 flex items-center justify-center mx-auto text-slate-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold text-white/60">No mistakes flagged yet!</p>
            <p className="text-[11px] text-white/50">Your Tech Lead will flag mistakes here when they review your daily journals.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {[...unresolvedMistakes, ...resolvedMistakes].map(mistake => {
              const sev = mistake.severity as MistakeSeverity;
              const cfg = severityConfig[sev] || severityConfig.low;
              return (
                <div key={mistake.id} className={`p-4 rounded-xl border ${cfg.bg} ${cfg.border} space-y-2`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${cfg.text} bg-white/5 border ${cfg.border}`}>
                        {cfg.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${
                        mistake.resolved
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {mistake.resolved ? 'Resolved' : 'Unresolved'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-white/40 font-mono">
                      <Clock className="h-3 w-3" />
                      {formatDate(mistake.date)}
                    </div>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">{mistake.note}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
