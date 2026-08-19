/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Preloader } from '@/src/components/ui/Preloader';
import { User, DailyLog, Task, Mistake, Mark, DaySession, TaskStatus } from '../../types';
import { api } from '../../services/api';
import { getISTDate, getISTDateString } from '../../utils/time';
import { DailyLogForm } from '../../components/intern/DailyLogForm';
import { getSupabaseClient } from '../../lib/supabaseClient';
import {
  StatsHeader,
  StartDayHero,
  StartDayModal,
  EndDayPromptModal,
  EarlyExitRequestModal,
  TasksBoard,
  DailyLogTimeline,
  FlaggedMistakesBanner,
  CompleteTaskModal,
  JournalReminderModal,
  LastJournalReminderModal,
  FinalWarningModal
} from '../../components/intern';
 import { formatDate } from '../../utils/helpers';
 import { GRADIENT_CLASSES, PASTEL_TEXT, GLASS_VARIANTS } from '../../components/ui/theme/ThemeTokens';
 import GlassColumn from '../../components/ui/glass/GlassColumn';
 import { useInternDashboard, useSubmitLog, useStartDaySession, useEndDaySession, useUpdateTaskStatus, useRequestEarlyExit } from '@/src/hooks/queries/useDashboardQueries';

interface InternDashboardProps {
  user: User;
  onRefreshStats?: () => void;
}

export const InternDashboard: React.FC<InternDashboardProps> = ({ user, onRefreshStats }) => {
  const [showStartDayModal, setShowStartDayModal] = useState(false);
  const [startProject, setStartProject] = useState('');
  const [startPlan, setStartPlan] = useState('');
  const [startQuestions, setStartQuestions] = useState('');
  const [startGitLink, setStartGitLink] = useState('');
  const [showEndDayPromptModal, setShowEndDayPromptModal] = useState(false);
  const [showEarlyExitModal, setShowEarlyExitModal] = useState(false);
  const [showCompleteTaskModal, setShowCompleteTaskModal] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
  const [showJournalReminderModal, setShowJournalReminderModal] = useState(false);
  const [showLastJournalModal, setShowLastJournalModal] = useState(false);
  const [hasShownLastReminder, setHasShownLastReminder] = useState(false);
  const [showFinalWarningModal, setShowFinalWarningModal] = useState(false);
  const [hasShownFinalWarning, setHasShownFinalWarning] = useState(false);
  const [hasShownJournalReminder, setHasShownJournalReminder] = useState(false);
  const [hasShownJournalMissed, setHasShownJournalMissed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const { data, isLoading, refetch } = useInternDashboard(user.id);
  const submitLogMutation = useSubmitLog(user.id);
  const startDayMutation = useStartDaySession(user.id);
  const endDayMutation = useEndDaySession(user.id);
  const requestEarlyExitMutation = useRequestEarlyExit(user.id);
  const updateTaskStatusMutation = useUpdateTaskStatus(user.id);
  const router = useRouter();
  const [showAutoLogout, setShowAutoLogout] = useState(false);
  const [dayEnded, setDayEnded] = useState(false);

  const logs = data?.logs ?? [];
  const tasks = data?.tasks ?? [];
  const mistakes = data?.mistakes ?? [];
  const marks = data?.marks ?? [];
  const todaySessions = data?.todaySessions ?? [];
  const projects = data?.projects ?? [];

  const todaySession = todaySessions.length > 0 ? todaySessions[0] : null;
  const todayStr = getISTDateString();
  const hasLogToday = logs.some((l: any) => l.date === todayStr);
  const assignedProjects = projects.filter(p => p.assigned_intern_ids?.includes(user.id));
  const activeTask = tasks.find(t => t.status === 'in_progress') || null;

  useEffect(() => {
    if (user?.role !== 'intern') return;

    const checkAutoLogout = () => {
      const ist = getISTDate();
      const istMinutes = ist.getHours() * 60 + ist.getMinutes();
      const sessionActive = todaySession && todaySession.status === 'active';

      if (!sessionActive) return;

      // 4:30 PM Last Journal Reminder
      if (istMinutes >= 16 * 60 + 30 && !hasShownLastReminder && !hasLogToday) {
        setShowLastJournalModal(true);
        setHasShownLastReminder(true);
        api.createNotification({
          userId: user.id,
          type: 'final_warning',
          title: 'Final Journal Warning',
          message: 'Submit your last journal before 5:00 PM.',
          isRed: true,
        }).catch(() => {});
      }

      // 4:45 PM Final Warning
      if (istMinutes >= 16 * 60 + 45 && !hasShownFinalWarning && !hasLogToday) {
        setShowFinalWarningModal(true);
        setHasShownFinalWarning(true);
        api.createNotification({
          userId: user.id,
          type: 'final_warning',
          title: 'Final Warning',
          message: 'You must submit your final daily journal before 5:00 PM.',
          isRed: true,
        }).catch(() => {});
      }

      // 5:15 PM Auto Logout
      if (istMinutes >= 17 * 60 + 15) {
        setShowAutoLogout(true);
      }
    };

    checkAutoLogout();
    const interval = setInterval(checkAutoLogout, 60000);

    return () => clearInterval(interval);
  }, [user, logs, todaySession, hasLogToday, hasShownLastReminder, hasShownFinalWarning]);

  useEffect(() => {
    if (user?.role !== 'intern') return;

    const checkJournalReminder = () => {
      const ist = getISTDate();
      const istMinutes = ist.getHours() * 60 + ist.getMinutes();
      const sessionActive = todaySession && todaySession.status === 'active';

      if (!sessionActive) return;

      // 1:00 PM Journal Reminder
      if (istMinutes >= 13 * 60 && !hasShownJournalReminder && !hasLogToday) {
        setShowJournalReminderModal(true);
        setHasShownJournalReminder(true);
        api.createNotification({
          userId: user.id,
          type: 'journal_reminder',
          title: 'Journal Reminder',
          message: 'Submit your daily journal before 1:30 PM.',
          isRed: false,
        }).catch(() => {});
      }

      // 1:30 PM Missed Journal
      if (istMinutes >= 13 * 60 + 30 && !hasShownJournalMissed && !hasLogToday) {
        setHasShownJournalMissed(true);
        api.createNotification({
          userId: user.id,
          type: 'journal_missed',
          title: 'Journal Missed',
          message: 'You missed the 1:30 PM submit. Techlead will take action.',
          isRed: true,
        }).catch(() => {});
      }
    };

    checkJournalReminder();
    const interval = setInterval(checkJournalReminder, 60000);

    return () => clearInterval(interval);
  }, [user, todaySession, hasLogToday, hasShownJournalReminder, hasShownJournalMissed]);

  const performAutoLogout = async () => {
    try {
      if (todaySession?.status === 'active') {
        await api.endDaySession({ intern_id: user.id });
      }
      await api.updateInternStatus(user.id, false);
    } catch (err) {
      console.error("Auto-logout error:", err);
    }
    try {
      await api.logout();
    } catch (err) {
      console.warn("Logout request failed:", err);
    }
    localStorage.removeItem("interntrack_user");
    localStorage.removeItem(`interntrack_log_draft_${user.id}`);
  };

  useEffect(() => {
    if (showAutoLogout) {
      performAutoLogout().finally(() => {
        router.push('/login');
      });
    }
  }, [showAutoLogout]);

  useEffect(() => {
    if (!user?.id) return;

    let subscriptionChannel: any = null;

    try {
      const supabase = getSupabaseClient();
      const channel = supabase
        .channel('intern-dashboard')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'DaySession',
          filter: `intern_id=eq.${user.id}`,
         }, () => {
          refetch().catch((err: any) => {
            if (!(err?.status === 403 && typeof err?.message === "string" && err.message.includes("inactive"))) {
              console.error("Dashboard refetch failed:", err);
            }
          });
        })
        .subscribe();
      subscriptionChannel = channel;
    } catch (err) {
      console.warn("Realtime subscriptions are inactive in InternDashboard:", err);
    }

    return () => {
      if (subscriptionChannel) {
        subscriptionChannel.unsubscribe();
      }
    };
  }, [user.id, refetch]);

  const sessionLoading = startDayMutation.isPending || endDayMutation.isPending;
  const isDev = process.env.NODE_ENV === 'development';

  const streak = useMemo(() => {
    const myLogs = logs.filter((l: any) => l.intern_id === user.id);
    const logDates = Array.from(new Set(myLogs.map((l: any) => l.date))).sort().reverse();
    const todayStr = getISTDateString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const utcYesterday = yesterdayDate.getTime() + yesterdayDate.getTimezoneOffset() * 60000;
    const istYesterday = new Date(utcYesterday + 5.5 * 3600000);
    const yesterdayStr = istYesterday.toISOString().split('T')[0];

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
    return realStreak;
  }, [logs, user.id]);

  const avgMark = useMemo(() => {
    const myMarks = marks.filter((m: any) => m.intern_id === user.id);
    if (myMarks.length > 0) {
      const totalMarks = myMarks.reduce((sum: number, m: any) => sum + (m.score || 0), 0);
      return totalMarks / myMarks.length;
    }
    return null;
  }, [marks, user.id]);

  if (isLoading) {
    return <Preloader key="preloader" visible={true} />;
  }

  const confirmStartDaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (startDayMutation.isPending) return;
    try {
      await startDayMutation.mutateAsync({
        intern_id: user.id,
        today_project: startProject.trim() || undefined,
        today_plan: startPlan.trim() || undefined,
        questions: startQuestions.trim() || undefined,
        git_link: startGitLink.trim() || undefined,
      });
      setShowStartDayModal(false);
      const ist = getISTDate();
      const istMinutes = ist.getHours() * 60 + ist.getMinutes();
      const isBefore930 = istMinutes < 9 * 60 + 30;
      showToast(
        isBefore930
          ? "Your day successfully started before 9:30 AM. Good morning!"
          : "Your day successfully started.",
        "success"
      );
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      console.error("Start day failed", err);
    }
  };

  const handleEndDayClick = async () => {
    if (endDayMutation.isPending) return;
    
    const ist = getISTDate();
    const istMinutes = ist.getHours() * 60 + ist.getMinutes();
    
    // Check for early exit (before 5:00 PM)
    if (istMinutes < 17 * 60 && !todaySession?.earlyExitApproved) {
      if (todaySession?.earlyExitRequested) {
        alert("Your early exit request is pending approval from your Tech Lead.");
      } else {
        setShowEarlyExitModal(true);
      }
      return;
    }

    const todayStr = getISTDateString();
    const hasLogToday = logs.some((l: any) => l.date === todayStr);

    if (!hasLogToday) {
      setShowEndDayPromptModal(true);
      return;
    }

    try {
      await endDayMutation.mutateAsync({ intern_id: user.id });
      setDayEnded(true);
      showToast("You ended the day.", "success");
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      alert(err.message || "End day failed");
    }
  };

  const handleEarlyExitSubmit = async (reason: string) => {
    try {
      await requestEarlyExitMutation.mutateAsync({ intern_id: user.id, reason });
      setShowEarlyExitModal(false);
      alert("Early exit request submitted. Please wait for Tech Lead approval.");
    } catch (err: any) {
      alert(err.message || "Failed to request early exit");
    }
  };

  const handleTaskStatusToggle = async (task: Task) => {
    if (updateTaskStatusMutation.isPending) return;
    if (task.status === 'todo') {
      await updateTaskStatusMutation.mutateAsync({ taskId: task.id, status: 'in_progress' });
      showToast('Task started successfully!', 'success');
      if (onRefreshStats) onRefreshStats();
    } else if (task.status === 'in_progress') {
      setTaskToComplete(task);
      setShowCompleteTaskModal(true);
    }
  };

  const handleCompleteTaskSubmit = async (data: {
    taskId: string;
    pr_link: string;
    completed_description: string;
    self_score?: number;
    self_comment?: string;
  }) => {
    try {
      await updateTaskStatusMutation.mutateAsync({
        taskId: data.taskId,
        status: 'done',
        extra: {
          pr_link: data.pr_link,
          completed_description: data.completed_description,
          self_score: data.self_score,
          self_comment: data.self_comment,
        },
      });
      setShowCompleteTaskModal(false);
      setTaskToComplete(null);
      refetch();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      alert(err.message || 'Failed to complete task');
    }
  };

  const handleLogSubmitSuccess = () => {
    refetch();
    setShowLastJournalModal(false);
    setShowFinalWarningModal(false);
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

  const handleGoToJournalFromReminder = () => {
    setShowJournalReminderModal(false);
    const el = document.getElementById('daily-log-form-container');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      el.classList.add('ring-2', 'ring-teal-500');
      setTimeout(() => el.classList.remove('ring-2', 'ring-teal-500'), 2000);
    }
  };

  const handleGoToJournalFromLastReminder = () => {
    setShowLastJournalModal(false);
    const el = document.getElementById('daily-log-form-container');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      el.classList.add('ring-2', 'ring-amber-500');
      setTimeout(() => el.classList.remove('ring-2', 'ring-amber-500'), 2000);
    }
  };

  const handleGoToJournalFromFinalWarning = () => {
    setShowFinalWarningModal(false);
    const el = document.getElementById('daily-log-form-container');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      el.classList.add('ring-2', 'ring-rose-500');
      setTimeout(() => el.classList.remove('ring-2', 'ring-rose-500'), 2000);
    }
  };

  const completedTasksCount = tasks.filter(t => t.status === 'done').length;

  if (projects.length > 0 && !startProject) {
    const relevant = projects.filter(p => p.owner_id === user.id || p.assigned_intern_ids?.includes(user.id));
    const own = relevant.find(p => p.owner_id === user.id) || relevant[0];
    if (own) {
      setStartProject(own.name);
      setStartGitLink(own.github_url);
    }
  }

  return (
    <>
      <Preloader visible={showAutoLogout} />
      <AnimatePresence mode={isDev ? "sync" : "wait"}>
      <motion.div
        key="dashboard"
        id="intern-workspace-root"
        className={`min-h-[calc(100vh-5rem)] ${GRADIENT_CLASSES.page}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="relative z-10 space-y-6">
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold ${GLASS_VARIANTS.card} ${
                  toast.type === 'success' ? PASTEL_TEXT.success : PASTEL_TEXT.danger
                }`}
              >
                {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {toast.message}
              </motion.div>
            )}
          </AnimatePresence>

          <StartDayHero
            todaySession={todaySession}
            sessionLoading={sessionLoading}
            onStartDay={() => setShowStartDayModal(true)}
            onEndDay={handleEndDayClick}
            hasLogToday={hasLogToday}
            activeTask={activeTask}
            dayEnded={dayEnded}
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
            assignedProjects={assignedProjects}
          />

          <EndDayPromptModal
            show={showEndDayPromptModal}
            onClose={() => setShowEndDayPromptModal(false)}
            onGoToJournal={handleGoToJournal}
          />

          <JournalReminderModal
            show={showJournalReminderModal}
            onClose={() => setShowJournalReminderModal(false)}
            onGoToJournal={handleGoToJournalFromReminder}
          />

          <LastJournalReminderModal
            show={showLastJournalModal}
            onClose={() => setShowLastJournalModal(false)}
            onGoToJournal={handleGoToJournalFromLastReminder}
          />

          <FinalWarningModal
            show={showFinalWarningModal}
            onClose={() => setShowFinalWarningModal(false)}
            onGoToJournal={handleGoToJournalFromFinalWarning}
          />

          <EarlyExitRequestModal
            show={showEarlyExitModal}
            onClose={() => setShowEarlyExitModal(false)}
            onSubmit={handleEarlyExitSubmit}
            isLoading={requestEarlyExitMutation.isPending}
          />

          <CompleteTaskModal
            show={showCompleteTaskModal}
            onClose={() => {
              setShowCompleteTaskModal(false);
              setTaskToComplete(null);
            }}
            task={taskToComplete}
            onSubmit={handleCompleteTaskSubmit}
            submitting={updateTaskStatusMutation.isPending}
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
            <GlassColumn className="lg:col-span-5 space-y-6 p-4">
              <DailyLogForm user={user} onSuccess={handleLogSubmitSuccess} todaySession={todaySession} projects={projects} />

              <FlaggedMistakesBanner mistakes={mistakes} />
            </GlassColumn>

            {/* Right Column: Timelines, Tasks, Feedback */}
            <GlassColumn className="lg:col-span-7 space-y-6 p-4">

              <TasksBoard
                tasks={tasks}
                onTaskStatusToggle={handleTaskStatusToggle}
                taskStatusLoading={updateTaskStatusMutation.isPending}
              />

              <DailyLogTimeline
                logs={logs}
                marks={marks}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
              />
            </GlassColumn>
          </div>
        </div>
      </motion.div>
      </AnimatePresence>
    </>
  );
};

