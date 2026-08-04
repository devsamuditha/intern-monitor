/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { api } from '../../services/api';
import { User, DailyLog, Task, Mistake, Mark, DaySession, TaskStatus } from '../../types';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { DailyLogForm } from '../../components/intern/DailyLogForm';
import {
  StatsHeader,
  StartDayHero,
  StartDayModal,
  EndDayPromptModal,
  TasksBoard,
  DailyLogTimeline,
  FlaggedMistakesBanner,
  InternMessages
} from '../../components/intern';
import { formatDate } from '../../utils/helpers';

interface InternDashboardProps {
  user: User;
  onRefreshStats?: () => void;
}

export const InternDashboard: React.FC<InternDashboardProps> = ({ user, onRefreshStats }) => {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [todaySession, setTodaySession] = useState<DaySession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Start Day Modal & Inputs State
  const [showStartDayModal, setShowStartDayModal] = useState(false);
  const [startProject, setStartProject] = useState('');
  const [startPlan, setStartPlan] = useState('');
  const [startQuestions, setStartQuestions] = useState('');
  const [startGitLink, setStartGitLink] = useState('');
  const [projectsList, setProjectsList] = useState<{ id: string; name: string; github_url: string }[]>([]);

  // End Day Modal / Alert State
  const [showEndDayPromptModal, setShowEndDayPromptModal] = useState(false);

  // Stats
  const [streak, setStreak] = useState(0);
  const [avgMark, setAvgMark] = useState<number | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const loadAllDashboardData = async () => {
    try {
      const [allLogs, allTasks, allMistakes, allMarks, todaySessions, allProjects] = await Promise.all([
        api.getLogs({ intern_id: user.id }),
        api.getTasks({ assigned_to: user.id }),
        api.getMistakes({ intern_id: user.id }),
        api.getMarks(user.id),
        api.getTodayDaySessions(user.id),
        api.getProjects()
      ]);

      setLogs(allLogs);
      setTasks(allTasks);
      setMistakes(allMistakes);
      setMarks(allMarks);
      setProjectsList(allProjects || []);

      if (allProjects && allProjects.length > 0) {
        const own = allProjects.find(p => p.owner_id === user.id) || allProjects[0];
        if (own) {
          setStartProject(own.name);
          setStartGitLink(own.github_url);
        }
      }

      if (todaySessions && todaySessions.length > 0) {
        setTodaySession(todaySessions[0]);
      } else {
        setTodaySession(null);
      }

      // Calculate real streak from submitted daily logs
      const myLogs = allLogs.filter((l: any) => l.intern_id === user.id);
      const logDates = Array.from(new Set(myLogs.map((l: any) => l.date))).sort().reverse();
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

      let realStreak = 0;
      if (logDates.includes(todayStr) || logDates.includes(yesterdayStr)) {
        let checkDate = new Date(logDates.includes(todayStr) ? todayStr : yesterdayStr);
        while (true) {
          const ds = checkDate.toISOString().split('T')[0];
          if (logDates.includes(ds)) {
            realStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
      setStreak(realStreak);

      // Calculate real average mark from actual marks
      const myMarks = allMarks.filter((m: any) => m.intern_id === user.id);
      if (myMarks.length > 0) {
        const totalMarks = myMarks.reduce((sum: number, m: any) => sum + (m.score || 0), 0);
        setAvgMark(totalMarks / myMarks.length);
      } else {
        setAvgMark(null);
      }
    } catch (err) {
      console.error("Error loading intern dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartDayClick = () => {
    setShowStartDayModal(true);
  };

  useEffect(() => {
    loadAllDashboardData();

    let subscriptionChannel: any = null;

    const setupRealtime = async () => {
      try {
        const supabase = await getSupabaseClient();
        subscriptionChannel = supabase
          .channel(`intern-dashboard-${user.id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'DailyLog' },
            () => {
              loadAllDashboardData();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Task' },
            () => {
              loadAllDashboardData();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Mark' },
            () => {
              loadAllDashboardData();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Mistake' },
            () => {
              loadAllDashboardData();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'User' },
            () => {
              loadAllDashboardData();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'DaySession' },
            () => {
              loadAllDashboardData();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn("Realtime subscriptions are inactive in InternDashboard:", err);
      }
    };

    setupRealtime();

    const pollInterval = setInterval(() => {
      loadAllDashboardData();
    }, 30000);

    return () => {
      if (subscriptionChannel) {
        subscriptionChannel.unsubscribe();
      }
      clearInterval(pollInterval);
    };
  }, [user]);

  const confirmStartDaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSessionLoading(true);
    try {
      const sess = await api.startDaySession({
        intern_id: user.id,
        today_project: startProject.trim() || undefined,
        today_plan: startPlan.trim() || undefined,
        questions: startQuestions.trim() || undefined,
        git_link: startGitLink.trim() || undefined
      });
      setTodaySession(sess);
      setShowStartDayModal(false);
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      console.error("Start day failed", err);
    } finally {
      setSessionLoading(false);
    }
  };

  const handleEndDayClick = async () => {
    // Check if daily journal submitted today
    const todayStr = new Date().toISOString().split('T')[0];
    const hasLogToday = logs.some(l => l.date === todayStr);

    if (!hasLogToday) {
      setShowEndDayPromptModal(true);
      return;
    }

    setSessionLoading(true);
    try {
      const sess = await api.endDaySession({ intern_id: user.id });
      setTodaySession(sess);
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      console.error("End day failed", err);
    } finally {
      setSessionLoading(false);
    }
  };

  const handleTaskStatusToggle = async (task: Task) => {
    // Only allow: todo → in_progress, in_progress → done
    // Don't allow going back from done
    let nextStatus: TaskStatus;
    if (task.status === 'todo') {
      nextStatus = 'in_progress';
    } else if (task.status === 'in_progress') {
      nextStatus = 'done';
    } else {
      // Already done, no action
      return;
    }

    // If moving to DONE, validate PR link or prompt for it
    if (nextStatus === 'done' && (!task.pr_link || !task.pr_link.trim())) {
      const prUrl = prompt('Enter your GitHub PR URL for this task (https://github.com/...):');
      if (prUrl !== null) {
        const clean = prUrl.trim();
        try {
          const parsed = new URL(clean);
          if (parsed.hostname !== 'github.com' && parsed.hostname !== 'www.github.com') {
            alert('Invalid PR URL. Please enter a valid GitHub URL (https://github.com/...)');
            return;
          }
        } catch (e) {
          alert('Invalid URL format. Please enter a valid GitHub PR URL (https://github.com/...)');
          return;
        }

        try {
          await api.updateTaskStatus(task.id, 'done', { pr_link: clean });
          await loadAllDashboardData();
          if (onRefreshStats) onRefreshStats();
          return;
        } catch (err: any) {
          alert(err.message || 'Failed to update task');
          return;
        }
      } else {
        return; // User cancelled prompt
      }
    }

    try {
      await api.updateTaskStatus(task.id, nextStatus);
      await loadAllDashboardData();
      if (onRefreshStats) onRefreshStats();
    } catch (e: any) {
      alert(e.message || 'Failed to update task status');
    }
  };

  const handleLogSubmitSuccess = () => {
    loadAllDashboardData();
    if (onRefreshStats) onRefreshStats();
  };

  const handleGoToJournal = () => {
    setShowEndDayPromptModal(false);
    const el = document.getElementById('daily-log-form-container');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      el.classList.add('ring-2', 'ring-indigo-500');
      setTimeout(() => el.classList.remove('ring-2', 'ring-indigo-500'), 2000);
    }
  };

  const completedTasksCount = tasks.filter(t => t.status === 'done').length;

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-sm text-slate-500">Syncing learning workspace...</p>
      </div>
    );
  }

  return (
    <div id="intern-workspace-root" className="space-y-6">
      <StartDayHero
        todaySession={todaySession}
        sessionLoading={sessionLoading}
        onStartDay={handleStartDayClick}
        onEndDay={handleEndDayClick}
      />

      <StartDayModal
        show={showStartDayModal}
        onClose={() => setShowStartDayModal(false)}
        sessionLoading={sessionLoading}
        startProject={startProject}
        setStartProject={setStartProject}
        startPlan={startPlan}
        setStartPlan={setStartPlan}
        startQuestions={startQuestions}
        setStartQuestions={setStartQuestions}
        startGitLink={startGitLink}
        setStartGitLink={setStartGitLink}
        onSubmit={confirmStartDaySubmit}
      />

      <EndDayPromptModal
        show={showEndDayPromptModal}
        onClose={() => setShowEndDayPromptModal(false)}
        onGoToJournal={handleGoToJournal}
      />

      <StatsHeader
        streak={streak}
        avgMark={avgMark}
        completedTasksCount={completedTasksCount}
        totalTasks={tasks.length}
        totalLogs={logs.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Log Form & Flagged Mistakes */}
        <div className="lg:col-span-5 space-y-6">
          <DailyLogForm user={user} onSuccess={handleLogSubmitSuccess} />

          <FlaggedMistakesBanner mistakes={mistakes} />
        </div>

        {/* Right Column: Timelines, Tasks, Feedback */}
        <div className="lg:col-span-7 space-y-6">

          <TasksBoard
            tasks={tasks}
            onTaskStatusToggle={handleTaskStatusToggle}
          />

          <DailyLogTimeline
            logs={logs}
            marks={marks}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
          />
        </div>
      </div>

      {/* Messages Section */}
      <div className="mt-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Messages</h2>
        <InternMessages user={user} />
      </div>
    </div>
  );
};





export default InternDashboard;

