/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Zap, CheckCircle2, Sun, FolderGit2, FileText, HelpCircle, Github, ExternalLink, Clock
} from 'lucide-react';
import { DaySession } from '../../types.ts';
import { ThemedIcon } from '../../components/ui/ThemedIcon';
import { formatISTTimeHHMMSS, getISTHour, getISTMinute } from '../../utils/time';

interface StartDayHeroProps {
  todaySession: DaySession | null;
  sessionLoading: boolean;
  onStartDay: () => void;
  onEndDay: () => void;
}

export const StartDayHero: React.FC<StartDayHeroProps> = ({
  todaySession,
  sessionLoading,
  onStartDay,
  onEndDay
}) => {
  const [istTime, setIstTime] = useState(formatISTTimeHHMMSS());

  useEffect(() => {
    const interval = setInterval(() => {
      setIstTime(formatISTTimeHHMMSS());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const istHour = getISTHour();
  const istMinute = getISTMinute();
  const istTimeMinutes = istHour * 60 + istMinute;
  const deadlineMinutes = 9 * 60 + 30;
  const pastStartWindow = istTimeMinutes >= deadlineMinutes;

  return (
    <div className={`p-6 rounded-2xl transition-all shadow-sm ${
      todaySession?.status === 'active'
        ? 'bg-gradient-to-r from-emerald-900/80 via-teal-900/80 to-slate-900/80 border-emerald-700/50 text-white'
        : todaySession?.status === 'completed'
        ? 'bg-white/5 border border-white/10 text-white'
        : 'bg-gradient-to-r from-teal-900/80 via-emerald-900/80 to-slate-900/80 border-teal-700/50 text-white'
    }`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`p-3.5 rounded-2xl flex items-center justify-center shrink-0 ${
            todaySession?.status === 'active'
              ? 'bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-500/30 animate-pulse'
              : todaySession?.status === 'completed'
              ? 'bg-teal-500/20 text-teal-300'
              : 'bg-amber-500/20 text-amber-300'
          }`}>
            {todaySession?.status === 'active' ? (
              <ThemedIcon icon={Zap} color="emerald" size={28} fill />
            ) : todaySession?.status === 'completed' ? (
              <ThemedIcon icon={CheckCircle2} color="teal" size={28} />
            ) : (
              <ThemedIcon icon={Sun} color="amber" size={28} />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black tracking-tight">
                {todaySession?.status === 'active'
                  ? 'Day Active — You are On Duty! 🟢'
                  : todaySession?.status === 'completed'
                  ? 'Day Session Completed Today 🏁'
                  : 'Good Day, Intern! Ready to Start? 🚀'}
              </h2>
              {todaySession?.status === 'active' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" /> Started at {todaySession.started_at}
                </span>
              )}
              {todaySession?.status === 'completed' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                   Ended at {todaySession.ended_at}
                 </span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
              {todaySession?.status === 'active'
                ? 'Your Tech Lead can see you are active in their live dashboard. Log your achievements in Write Daily Journal before finishing your session.'
                : todaySession?.status === 'completed'
                ? 'Great job today! You have checked out for the day. You can review past journals and feedback anytime.'
                : 'Click "Start My Day" to enter your plan, project, questions, and git link to notify your Tech Lead.'}
            </p>
          </div>
        </div>

        <div className="shrink-0 w-full sm:w-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-mono text-white/50">{istTime}</span>
          </div>
          {!todaySession ? (
            pastStartWindow ? (
              <div>
                <div className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 font-medium text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                  <Clock className="h-4 w-4" />
                  Past start window
                </div>
                <p className="text-[10px] text-slate-500 text-center mt-1">Day start deadline is 9:30 AM IST</p>
              </div>
            ) : (
              <button
                onClick={onStartDay}
                disabled={sessionLoading}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                
                🚀 Start My Day
              </button>
            )
          ) : todaySession.status === 'active' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onEndDay}
                disabled={sessionLoading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {sessionLoading ? 'Ending Day...' : '🏁 Finish / End Day'}
              </button>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-medium text-xs text-center">
              Checked out today ✨
            </div>
          )}
        </div>
      </div>

      {/* Display Active/Completed Today Session details */}
      {todaySession && (todaySession.today_project || todaySession.today_plan || todaySession.questions || todaySession.git_link) && (
        <div className="mt-4 pt-4 border-t border-slate-700/60 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {todaySession.today_project && (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <ThemedIcon icon={FolderGit2} color="teal" size={12} /> Today Project
              </p>
              <p className="font-semibold text-white truncate">{todaySession.today_project}</p>
            </div>
          )}

          {todaySession.today_plan && (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <ThemedIcon icon={FileText} color="emerald" size={12} /> Today&apos;s Plan
              </p>
              <p className="font-medium text-slate-200 line-clamp-2">{todaySession.today_plan}</p>
            </div>
          )}

          {todaySession.questions && (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                <ThemedIcon icon={HelpCircle} color="amber" size={12} /> Questions / Blocker
              </p>
              <p className="font-medium text-slate-200 line-clamp-2">{todaySession.questions}</p>
            </div>
          )}

          {todaySession.git_link && (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <ThemedIcon icon={Github} color="slate" size={12} /> Git Repo / Branch Link
              </p>
              <a
                href={todaySession.git_link.startsWith('http') ? todaySession.git_link : `https://${todaySession.git_link}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-teal-300 hover:underline truncate flex items-center gap-1"
              >
                View Repo <ExternalLink className="h-3 w-3 inline shrink-0" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


