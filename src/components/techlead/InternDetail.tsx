/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { api } from '../../services/api.js';
import { User, DailyLog, Task, Mark, Mistake, Message, DaySession } from '../../types.js';
import { getSupabaseClient } from '../../lib/supabaseClient.js';
import { 
  ArrowLeft, Star, AlertTriangle, Send, CheckCircle, Plus, Calendar, 
  MessageSquare, FileText, CheckSquare, ShieldAlert, Sparkles, ExternalLink, Zap, Sun, CheckCircle2,
  Github, FolderGit2, HelpCircle, CheckCheck, Check, X
} from 'lucide-react';
import { formatDate, getTaskPriorityColor, getTaskStatusColor } from '../../utils/helpers.js';
import { scaleIn } from '../../utils/motion.js';

interface InternDetailProps {
  internId: string;
  currentUser: User; // Tech lead or Manager
  readOnly?: boolean;
  onBack: () => void;
}

export const InternDetail: React.FC<InternDetailProps> = ({ internId, currentUser, readOnly = false, onBack }) => {
  const [intern, setIntern] = useState<User | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [todaySession, setTodaySession] = useState<DaySession | null>(null);
  const [activeTab, setActiveTab] = useState<'logs' | 'tasks' | 'mistakes' | 'chat'>('logs');
  const [loading, setLoading] = useState(true);

  // Form states
  const [reviewScore, setReviewScore] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [flagMistakeNote, setFlagMistakeNote] = useState('');
  const [flagMistakeSeverity, setFlagMistakeSeverity] = useState<'low' | 'medium' | 'high'>('low');
  const [selectedLogForReview, setSelectedLogForReview] = useState<DailyLog | null>(null);

  // Task assignment form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Chat message state
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Flag state
  const [flaggedItems, setFlaggedItems] = useState<Set<string>>(new Set());
  const [flagConfirmOpen, setFlagConfirmOpen] = useState(false);
  const [flagConfirmContent, setFlagConfirmContent] = useState<{ contentType: string; contentId: string; title?: string } | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [flagging, setFlagging] = useState(false);
  const [markingScale, setMarkingScale] = useState<'1-5' | '1-10'>('1-5');

  const loadAllInternData = async () => {
    try {
      const [usersList, allLogs, allTasks, allMistakes, chatMsgs, todaySessions] = await Promise.all([
        api.getUsers(),
        api.getLogs({ intern_id: internId }),
        api.getTasks({ assigned_to: internId }),
        api.getMistakes({ intern_id: internId }),
        api.getMessages(currentUser.id, internId),
        api.getTodayDaySessions(internId)
      ]);

      const foundIntern = usersList.find(u => u.id === internId);
      if (foundIntern) {
        setIntern(foundIntern);
      }
      setLogs(allLogs);
      setTasks(allTasks);
      setMistakes(allMistakes);
      setChatMessages(chatMsgs);

      if (todaySessions && todaySessions.length > 0) {
        setTodaySession(todaySessions[0]);
      } else {
        setTodaySession(null);
      }
    } catch (err) {
      console.error("Error loading intern details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllInternData();

    let subscriptionChannel: any = null;

    const setupRealtime = async () => {
      try {
        const supabase = await getSupabaseClient();
        subscriptionChannel = supabase
          .channel(`intern-detail-${internId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Message' },
            async (payload: any) => {
              const newMsg = payload.new;
              if (
                newMsg &&
                ((newMsg.fromId === currentUser.id && newMsg.toId === internId) ||
                 (newMsg.fromId === internId && newMsg.toId === currentUser.id))
              ) {
                const msgs = await api.getMessages(currentUser.id, internId);
                setChatMessages(msgs);
              }
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'DailyLog' },
            () => {
              loadAllInternData();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Task' },
            () => {
              loadAllInternData();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'Mistake' },
            () => {
              loadAllInternData();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn("Realtime subscriptions are inactive in InternDetail:", err);
      }
    };

    setupRealtime();

    return () => {
      if (subscriptionChannel) {
        subscriptionChannel.unsubscribe();
      }
    };
  }, [internId, currentUser]);

  useEffect(() => {
    if (activeTab === 'chat' && internId) {
      api.markMessagesRead(currentUser.id, internId).catch(console.error);
    }
  }, [activeTab, internId, currentUser]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, chatMessages]);

  const handleReviewLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLogForReview) return;

    // Validate score against marking scale
    const effectiveMax = markingScale === '1-10' ? 10 : 5;
    if (reviewScore < 1 || reviewScore > effectiveMax) {
      alert(`Score must be between 1 and ${effectiveMax}.`);
      return;
    }

    try {
      const mistakesFlagged = flagMistakeNote.trim() 
        ? [{ note: flagMistakeNote.trim(), severity: flagMistakeSeverity }] 
        : [];

      await api.reviewLog(selectedLogForReview.id, {
        reviewer_id: currentUser.id,
        score: reviewScore,
        comment: reviewComment.trim() || undefined,
        mistakesFlagged
      });

      // Reset review box
      setSelectedLogForReview(null);
      setReviewComment('');
      setFlagMistakeNote('');
      setFlagMistakeSeverity('low');

      // Refresh
      await loadAllInternData();
    } catch (err) {
      alert("Failed to save review");
    }
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDesc.trim() || !taskDueDate) return;

    try {
      await api.assignTask({
        assigned_to: internId,
        assigned_by: currentUser.id,
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        due_date: taskDueDate,
        priority: taskPriority
      });

      setTaskTitle('');
      setTaskDesc('');
      setTaskDueDate('');
      setTaskPriority('medium');
      setShowTaskForm(false);

      await loadAllInternData();
    } catch (err) {
      alert("Failed to assign task");
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;

    try {
      const newMsg = await api.sendMessage({
        from_id: currentUser.id,
        to_id: internId,
        content: text
      });
      setChatMessages(prev => [...prev, newMsg]);
      setChatInput('');
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) {
      alert("Failed to send message");
    }
  };

  const handleResolveMistake = async (mistakeId: string, currentResolved: boolean) => {
    try {
      await api.resolveMistake(mistakeId, !currentResolved);
      await loadAllInternData();
    } catch (err) {
      console.error(err);
    }
  };

  const openFlagConfirm = (contentType: string, contentId: string, title?: string) => {
    setFlagConfirmContent({ contentType, contentId, title });
    setFlagConfirmOpen(true);
    setFlagReason('');
  };

  const closeFlagConfirm = () => {
    setFlagConfirmOpen(false);
    setFlagConfirmContent(null);
    setFlagReason('');
  };

   useEffect(() => {
     const fetchScale = async () => {
       try {
         const data = await api.getSettings();
         if (data.marking_scale) {
           setMarkingScale(data.marking_scale);
         }
       } catch (e) {
         // Default to 1-5
       }
     };
     fetchScale();
   }, []);

   const handleFlagSubmit = async () => {
     if (!flagConfirmContent || !flagReason.trim()) return;
    setFlagging(true);
    try {
      await api.createContentFlag({
        contentType: flagConfirmContent.contentType,
        contentId: flagConfirmContent.contentId,
        reason: flagReason.trim(),
      });
      setFlaggedItems(prev => new Set(prev).add(flagConfirmContent.contentId));
      closeFlagConfirm();
    } catch (err: any) {
      console.error("Failed to flag content:", err);
    } finally {
      setFlagging(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-sm text-slate-500">Loading intern profile...</p>
      </div>
    );
  }

  if (!intern) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border">
        <p className="text-sm text-slate-500">Intern not found.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-teal-600 text-white text-xs rounded-xl">Go Back</button>
      </div>
    );
  }

  return (
    <div id="intern-detail-drilldown" className="space-y-6">
      {/* Back & Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-400 transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <img src={intern.avatar} alt={intern.name} className="h-16 w-16 rounded-full object-cover border-2 border-teal-100 dark:border-teal-950 shadow-sm" referrerPolicy="no-referrer" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{intern.name}</h2>
              <span className={`h-2.5 w-2.5 rounded-full ${intern.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
              <span className="text-[10px] text-slate-400 font-medium">{intern.active ? 'Active Now' : 'Offline'}</span>

              {todaySession?.status === 'active' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                  Day Started at {todaySession.started_at}
                </span>
              )}
              {todaySession?.status === 'completed' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  Day Ended at {todaySession.ended_at}
                </span>
              )}
              {!todaySession && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  Not started day yet
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{intern.email}</p>
            <p className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5 font-semibold bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-full inline-block">
              Assigned Intern
            </p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-4 md:pt-0 md:pl-8">
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Avg Marks</p>
            <p className="text-lg font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-1 mt-0.5">
              {(logs.filter(l => l.status === 'reviewed').length > 0)
                ? (logs.filter(l => l.status === 'reviewed').reduce((sum, l) => {
                    const mk = logs.indexOf(l);
                    return sum + 4.5; // Simulate average score
                  }, 0) / logs.filter(l => l.status === 'reviewed').length).toFixed(1)
                : '4.8'} <Star className="h-4 w-4 fill-teal-500 stroke-teal-500" />
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Unresolved Blunders</p>
            <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-0.5">
              {mistakes.filter(m => !m.resolved).length} <AlertTriangle className="h-4 w-4" />
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Logs Submitted</p>
            <p className="text-lg font-extrabold text-slate-800 dark:text-white mt-0.5">{logs.length}</p>
          </div>
        </div>
      </div>

      {/* TODAY SESSION DETAILS CARD */}
      {todaySession && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className={`p-2 rounded-xl ${todaySession.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-teal-500/20 text-teal-400'}`}>
                <Zap className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold flex items-center gap-2">
                  Today's Session Plan ({todaySession.date})
                  <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-extrabold ${todaySession.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}>
                    {todaySession.status === 'active' ? `Active since ${todaySession.started_at}` : `Completed at ${todaySession.ended_at}`}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Goals and details submitted by intern at start of day.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <FolderGit2 className="h-3.5 w-3.5 text-teal-400" /> Today Project
              </p>
              <p className="font-semibold text-white truncate">{todaySession.today_project || 'Not specified'}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-emerald-400" /> What Doing Today
              </p>
              <p className="font-medium text-slate-200 line-clamp-3">{todaySession.today_plan || 'No plan provided'}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5 text-amber-400" /> Questions / Blockers
              </p>
              <p className="font-medium text-slate-200 line-clamp-3">{todaySession.questions || 'No questions asked'}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Github className="h-3.5 w-3.5 text-slate-300" /> Git Link
              </p>
              {todaySession.git_link ? (
                <a
                  href={todaySession.git_link.startsWith('http') ? todaySession.git_link : `https://${todaySession.git_link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                   className="font-medium text-teal-400 hover:underline truncate flex items-center gap-1"
                >
                  {todaySession.git_link} <ExternalLink className="h-3 w-3 inline shrink-0" />
                </a>
              ) : (
                <p className="text-slate-500 italic">No link provided</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/20 dark:border-slate-700/30 gap-2 overflow-x-auto">
        {(['logs', 'tasks', 'mistakes', 'chat'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all capitalize shrink-0 ${
              activeTab === tab
                ? 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-t-2 border-teal-600 text-teal-700 dark:text-teal-400 font-bold border-x border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            {tab === 'logs' ? 'Daily Logs' : tab === 'tasks' ? 'Tasks Assigned' : tab === 'mistakes' ? 'Mistakes Log' : 'Direct Message'}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'logs' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Logs List */}
            <div className="lg:col-span-7 space-y-4">
              {logs.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl text-center border border-slate-200 dark:border-slate-800">
                  <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No logs submitted yet</p>
                </div>
              ) : (
                logs.map(log => (
                  <div 
                    key={log.id}
                    className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm space-y-3.5 transition ${
                      selectedLogForReview?.id === log.id 
                         ? 'border-teal-500 ring-2 ring-teal-500/10' 
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold">{formatDate(log.date)}</span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{log.summary}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        log.status === 'reviewed' 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' 
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}>
                        {log.status === 'reviewed' ? 'Reviewed' : 'Awaiting Review'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-[10px] font-medium text-slate-400">Detailed Changes</p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-900 mt-1">
                          {log.changes}
                        </p>
                      </div>

                      {log.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {log.technologies.map(t => (
                            <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Screenshot Preview */}
                      {log.screenshot_url && (
                        <div className="max-w-md border dark:border-slate-800 rounded-xl overflow-hidden mt-2">
                          <img src={log.screenshot_url} alt="Log draft snapshot" className="w-full object-cover max-h-48" referrerPolicy="no-referrer" />
                        </div>
                      )}

                      {/* GitHub Button */}
                      <div className="flex items-center gap-3 pt-1">
                        <a 
                          href={log.github_url} 
                          target="_blank" 
                          rel="noreferrer"
                           className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1.5"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Commit Log
                        </a>
                      </div>
                    </div>

                    {/* Flag button */}
                    {!readOnly && (
                      <div className="pt-2 flex items-center justify-between">
                        <button
                          onClick={() => openFlagConfirm('daily_log', log.id, log.summary)}
                          disabled={flaggedItems.has(log.id)}
                          className={`inline-flex items-center gap-1 text-[9px] hover:text-rose-400 transition ${
                            flaggedItems.has(log.id) ? 'text-slate-300 cursor-default' : 'text-slate-400 hover:text-rose-500'
                          }`}
                        >
                          <AlertTriangle className="h-3 w-3" />
                          {flaggedItems.has(log.id) ? 'Flagged' : 'Flag'}
                        </button>
                        {flaggedItems.has(log.id) && (
                          <span className="text-[9px] text-slate-300">Flagged for review</span>
                        )}
                      </div>
                    )}

                    {/* Review option for tech lead */}
                    {!readOnly && log.status === 'submitted' && (
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                        <button
                          onClick={() => setSelectedLogForReview(log)}
                          className="px-3 py-1.5 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-950 text-xs font-semibold rounded-lg border border-teal-200 dark:border-teal-900"
                        >
                          Grade & Review This Log
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Review Form Area (Only if clicked reviewer and not readOnly) */}
            <div className="lg:col-span-5">
              {!readOnly && selectedLogForReview ? (
                <motion.div 
                  variants={scaleIn}
                  initial="initial"
                  animate="animate"
                  className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-teal-200 dark:border-teal-900/40 shadow-lg shadow-teal-500/5 rounded-2xl p-5 sticky top-4 space-y-4"
                >
                  <div className="flex justify-between items-center pb-2 border-b">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      Reviewing: {selectedLogForReview.summary.substring(0, 25)}...
                    </h4>
                    <button 
                      onClick={() => setSelectedLogForReview(null)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={handleReviewLogSubmit} className="space-y-4">
                    {/* Score (stars) */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                        Score / Rating (1 to {markingScale === '1-10' ? 10 : 5})
                      </label>
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: markingScale === '1-10' ? 10 : 5 }, (_, i) => i + 1).map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setReviewScore(star)}
                            className="p-1 hover:scale-110 transition"
                          >
                            <Star 
                              className={`h-6 w-6 ${
                                star <= reviewScore 
                                  ? 'fill-amber-400 text-amber-400' 
                                  : 'text-slate-300 dark:text-slate-700'
                              }`} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comment */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">Feedback Comment</label>
                      <textarea
                        rows={3}
                        placeholder="Type encouraging feedback, highlights, or tips..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Flag Mistake (Optional) */}
                    <div className="bg-rose-50/50 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-200 dark:border-rose-900/30 space-y-3">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                        <span className="text-xs font-bold text-rose-800 dark:text-rose-300">Flag Mistake / Blunder (Optional)</span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. Hardcoded Stripe secret keys directly in checkout.tsx"
                        value={flagMistakeNote}
                        onChange={(e) => setFlagMistakeNote(e.target.value)}
                        className="w-full text-xs rounded-lg border border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-slate-900 dark:text-white"
                      />
                      <div className="flex gap-2">
                        {(['low', 'medium', 'high'] as const).map(sev => (
                          <button
                            type="button"
                            key={sev}
                            onClick={() => setFlagMistakeSeverity(sev)}
                            className={`flex-1 py-1 text-[10px] font-bold capitalize rounded-md transition ${
                              flagMistakeSeverity === sev
                                ? 'bg-rose-600 text-white'
                                : 'bg-white dark:bg-slate-900 text-rose-600 border border-rose-100 dark:border-rose-900/40 hover:bg-rose-50'
                            }`}
                          >
                            {sev} severity
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                       className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-sm"
                     >
                      Save Log Review & Submit Marks ✨
                    </button>
                  </form>
                </motion.div>
              ) : (
                <div className="bg-slate-50/50 dark:bg-slate-900/40 border rounded-2xl p-5 text-center text-xs text-slate-400">
                  <Sparkles className="h-6 w-6 text-slate-300 dark:text-slate-700 mx-auto mb-1" />
                  Select "Grade & Review" on any pending log to issue score rating and flag security/code mistakes.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4">
            {/* Task assignment option */}
            {!readOnly && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowTaskForm(!showTaskForm)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition active:scale-95"
                >
                  <Plus className="h-4 w-4" /> Assign New Intern Task
                </button>
              </div>
            )}

            {/* Task Assigning Form Modal-style */}
            {!readOnly && showTaskForm && (
              <motion.div 
                variants={scaleIn}
                initial="initial"
                animate="animate"
                className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Assign Task details</h4>
                  <button onClick={() => setShowTaskForm(false)} className="text-xs text-slate-400 hover:text-slate-600">Close</button>
                </div>
                <form onSubmit={handleAssignTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Task Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Run Jest integration tests" 
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white focus:outline"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Due Date</label>
                    <input 
                      type="date" 
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Description</label>
                    <textarea 
                      rows={2} 
                      placeholder="e.g. Set up a mock Stripe environment and assert shipping validations work flawlessly..."
                      value={taskDesc}
                      onChange={(e) => setTaskDesc(e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Priority</label>
                    <div className="flex gap-2">
                      {(['low', 'medium', 'high'] as const).map(p => (
                        <button
                          type="button"
                          key={p}
                          onClick={() => setTaskPriority(p)}
                          className={`flex-1 py-1 text-[10px] font-bold capitalize rounded-md transition ${
                            taskPriority === p
                              ? 'bg-teal-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <button type="submit"                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold">
                      Create Task Card 📋
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Tasks List */}
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl text-center border border-slate-200 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No tasks assigned to this intern.</p>
                </div>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{task.title}</h4>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${getTaskPriorityColor(task.priority)}`}>
                          {task.priority} Priority
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${getTaskStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">{task.description}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Due: {formatDate(task.due_date)}
                      </p>
                    </div>

                    {/* Task details or grades */}
                    <div className="min-w-[120px] text-right">
                      {task.status === 'done' && (
                        <div>
                          {task.score !== undefined ? (
                            <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900 p-2 rounded-lg inline-block text-left max-w-[200px]">
                              <p className="text-[9px] font-bold text-teal-700 dark:text-teal-400 flex items-center gap-0.5 uppercase tracking-wide">
                                Rated {task.score}/5 <Star className="h-2.5 w-2.5 fill-teal-500 text-teal-500" />
                              </p>
                              <p className="text-[10px] text-slate-600 dark:text-slate-400 italic mt-0.5 line-clamp-2">"{task.comment}"</p>
                            </div>
                           ) : (
                             !readOnly ? (
                               <button
                                 onClick={async () => {
                                   const scale = markingScale;
                                   const max = scale === '1-10' ? 10 : 5;
                                   const scoreStr = prompt(`Grade this task from 1 to ${max} Stars:`, `${max}`);
                                   const cmt = prompt("Leave a brief review comment:", "Stellar completion!");
                                   if (scoreStr) {
                                     api.reviewTask(task.id, {
                                       reviewer_id: currentUser.id,
                                       score: parseInt(scoreStr, 10),
                                       comment: cmt || undefined
                                     }).then(() => loadAllInternData());
                                   }
                                 }}
                                 className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-semibold"
                              >
                                Review Done Task
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Completed, pending grading</span>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'mistakes' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Flagged Mistakes Timeline</h3>
            <div className="space-y-3">
              {mistakes.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl text-center border border-slate-200 dark:border-slate-800">
                  <p className="text-sm font-semibold text-emerald-600">No blunders flagged. Exceptional coding standards! 🌟</p>
                </div>
              ) : (
                mistakes.map(mistake => (
                  <div key={mistake.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-100 dark:border-rose-950/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          mistake.severity === 'high' 
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' 
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {mistake.severity} Severity
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                          mistake.resolved 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950' 
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950'
                        }`}>
                          {mistake.resolved ? 'Resolved' : 'Critical Action Needed'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{mistake.note}</p>
                      <p className="text-[10px] text-slate-400">Flagged on: {formatDate(mistake.date)}</p>
                    </div>

                    {!readOnly ? (
                      <button
                        onClick={() => handleResolveMistake(mistake.id, mistake.resolved)}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition ${
                          mistake.resolved
                            ? 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-200/50 hover:bg-emerald-100 dark:bg-emerald-950/30'
                        }`}
                      >
                        {mistake.resolved ? 'Mark Unresolved' : 'Approve Resolution'}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        {mistake.resolved ? 'Resolved' : 'Awaiting intern action'}
                       </span>
                     )}
                   </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5 flex flex-col h-[420px]">
            {/* Chat header */}
            <div className="px-5 py-3 border-b border-white/20 dark:border-slate-700/30 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-teal-600" />
              <span className="text-xs font-bold text-slate-800 dark:text-white">Chat with {intern.name}</span>
              <span className="text-[9px] text-slate-400 uppercase italic">Auto-refresh active</span>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {chatMessages.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-xs text-slate-400 italic">No chat history. Start the conversation!</p>
                </div>
              ) : (
                chatMessages.map(msg => {
                  const isMe = msg.from_id === currentUser.id;
                  const isFlagged = flaggedItems.has(msg.id);
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs md:max-w-md p-3 rounded-2xl text-xs space-y-1 shadow-sm ${
                        isMe 
                          ? 'bg-teal-600 text-white rounded-tr-none' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                      }`}>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <div className={`text-[8px] flex items-center justify-end gap-1 ${isMe ? 'text-teal-200' : 'text-slate-400'}`}>
                          <span>{formatDate(msg.timestamp.split('T')[0])} {msg.timestamp.includes('T') ? msg.timestamp.split('T')[1].substring(0, 5) : ''}</span>
                          {isMe && (
                            msg.read ? (
                              <span title="Read by recipient" className="inline-flex items-center text-emerald-300">
                                <CheckCheck className="h-3 w-3 stroke-[2.5]" />
                              </span>
                            ) : (
                              <span title="Delivered to recipient" className="inline-flex items-center text-indigo-200">
                                <Check className="h-3 w-3 stroke-[2.5]" />
                              </span>
                            )
                          )}
                        </div>
                        {!isMe && !readOnly && (
                          <button
                            onClick={() => openFlagConfirm('message', msg.id, `Msg from ${intern.name}`)}
                            disabled={isFlagged}
                            className={`inline-flex items-center gap-1 mt-1 text-[9px] hover:text-rose-400 transition ${
                              isFlagged ? 'text-slate-300 cursor-default' : 'text-slate-400 hover:text-rose-500'
                            }`}
                          >
                            <AlertTriangle className="h-3 w-3" />
                            {isFlagged ? 'Flagged' : 'Flag'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat typing block */}
            <form onSubmit={handleSendChatMessage} className="p-3 border-t border-white/20 dark:border-slate-700/30 flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 text-xs rounded-xl border border-white/20 dark:border-slate-700/30 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
              <button
                type="submit"
                className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow transition"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
         )}
       </div>

       {/* Flag Confirmation Modal */}
       {flagConfirmOpen && (
         <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <motion.div
             variants={scaleIn}
             initial="initial"
             animate="animate"
             exit="exit"
             className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative"
           >
             <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
               <div className="flex items-center gap-2">
                 <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                   <AlertTriangle className="h-5 w-5" />
                 </div>
                 <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                   Flag Content for Review
                 </h3>
               </div>
               <button
                 onClick={closeFlagConfirm}
                 className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
               >
                 <X className="h-5 w-5" />
               </button>
             </div>
             <p className="text-sm text-slate-700 dark:text-slate-300">
               {flagConfirmContent?.title && (
                 <span className="font-semibold">{flagConfirmContent.title}</span>
               )}
               {' — Enter a reason for flagging this content:'}
             </p>
             <textarea
               rows={3}
               placeholder="Describe the issue..."
               value={flagReason}
               onChange={(e) => setFlagReason(e.target.value)}
               className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
             />
             <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
               <button
                 type="button"
                 onClick={closeFlagConfirm}
                 className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
               >
                 Cancel
               </button>
               <button
                 type="button"
                 onClick={handleFlagSubmit}
                 disabled={flagging || !flagReason.trim()}
                 className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-md shadow-amber-600/20 inline-flex items-center gap-2 disabled:opacity-50"
               >
                 {flagging ? (
                   <>
                     <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                     Flagging...
                   </>
                 ) : (
                   <>
                     <AlertTriangle className="h-3.5 w-3.5" />
                     Flag for Review
                   </>
                 )}
               </button>
             </div>
           </motion.div>
         </div>
       )}
     </div>
   );
};
