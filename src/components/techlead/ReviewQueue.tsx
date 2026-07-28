/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api';
import { User, DailyLog, Task, MistakeSeverity } from '../../types.ts';
import { 
  CheckSquare, FileText, Filter, Search, Star, AlertTriangle, 
  ChevronLeft, ChevronRight, CheckCircle2, Clock, X, ExternalLink, 
  Github, Sparkles, MessageSquare, Award, RefreshCw, User as UserIcon
} from 'lucide-react';
import { formatDate } from '../../utils/helpers';
import { scaleIn } from '../../utils/motion';

interface ReviewQueueProps {
  currentUser: User;
  onSelectIntern?: (internId: string) => void;
}

export type QueueItemType = 'all' | 'log' | 'task';
export type QueueStatusFilter = 'pending' | 'reviewed' | 'all';

export interface UnifiedReviewItem {
  type: 'log' | 'task';
  id: string;
  internId: string;
  internName: string;
  internAvatar: string;
  title: string;
  details: string;
  date: string;
  status: 'pending' | 'reviewed';
  score?: number;
  comment?: string;
  githubUrl?: string;
  originalLog?: DailyLog;
  originalTask?: Task;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ currentUser, onSelectIntern }) => {
  const [loading, setLoading] = useState(true);
  const [interns, setInterns] = useState<User[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Filtering states
  const [statusFilter, setStatusFilter] = useState<QueueStatusFilter>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Platform settings
  const [markingScale, setMarkingScale] = useState<'1-5' | '1-10'>('1-5');

  // Filter states (for future use)
  const [typeFilter, setTypeFilter] = useState<QueueItemType>('all');
  const [selectedInternFilter, setSelectedInternFilter] = useState<string>('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Active Review Modal state
  const [activeItem, setActiveItem] = useState<UnifiedReviewItem | null>(null);
  const [reviewScore, setReviewScore] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [flagMistake, setFlagMistake] = useState(false);
  const [mistakeNote, setMistakeNote] = useState('');
  const [mistakeSeverity, setMistakeSeverity] = useState<MistakeSeverity>('low');
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const loadQueueData = async () => {
    setLoading(true);
    try {
      const [usersList, allLogs, allTasks] = await Promise.all([
        api.getUsers({ assigned_tech_lead_id: currentUser.id }),
        api.getLogs(),
        api.getTasks()
      ]);

      // Only keep assigned interns if tech lead
      const myInterns = currentUser.role === 'manager' 
        ? usersList.filter(u => u.role === 'intern')
        : usersList.filter(u => u.role === 'intern' && (u.assigned_tech_lead_id === currentUser.id || !u.assigned_tech_lead_id));

      const myInternIds = new Set(myInterns.map(i => i.id));

      setInterns(myInterns);
      setLogs(allLogs.filter(l => myInternIds.has(l.intern_id)));
      setTasks(allTasks.filter(t => myInternIds.has(t.assigned_to)));
    } catch (err) {
      console.error("Error loading review queue data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueueData();
  }, [currentUser]);

  // Construct unified review queue
  const unifiedItems: UnifiedReviewItem[] = [];

  const internMap = new Map<string, User>();
  interns.forEach(i => internMap.set(i.id, i));

  // Add Daily Logs
  logs.forEach(log => {
    const intern = internMap.get(log.intern_id);
    unifiedItems.push({
      type: 'log',
      id: log.id,
      internId: log.intern_id,
      internName: intern ? intern.name : 'Unknown Intern',
      internAvatar: intern ? intern.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      title: log.summary,
      details: log.changes,
      date: log.date,
      status: log.status === 'reviewed' ? 'reviewed' : 'pending',
      githubUrl: log.github_url,
      originalLog: log,
    });
  });

  // Add Sprint Tasks (Tasks marked as 'done' or with scores)
  tasks.forEach(task => {
    const intern = internMap.get(task.assigned_to);
    // Task needs review if completed ('done') or already scored
    const isReviewed = task.score !== undefined && task.score !== null && task.score > 0;
    const isPendingReview = task.status === 'done' && !isReviewed;

    // We include tasks that are either done or reviewed
    if (task.status === 'done' || isReviewed) {
      unifiedItems.push({
        type: 'task',
        id: task.id,
        internId: task.assigned_to,
        internName: intern ? intern.name : 'Unknown Intern',
        internAvatar: intern ? intern.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        title: task.title,
        details: task.description,
        date: task.completed_at || task.due_date,
        status: isReviewed ? 'reviewed' : 'pending',
        score: task.score,
        comment: task.comment,
        githubUrl: task.pr_link,
        originalTask: task,
      });
    }
  });

  // Apply filters
  const filteredItems = unifiedItems.filter(item => {
    // Status filter
    if (statusFilter === 'pending' && item.status !== 'pending') return false;
    if (statusFilter === 'reviewed' && item.status !== 'reviewed') return false;

    // Type filter
    if (typeFilter === 'log' && item.type !== 'log') return false;
    if (typeFilter === 'task' && item.type !== 'task') return false;

    // Intern filter
    if (selectedInternFilter !== 'all' && item.internId !== selectedInternFilter) return false;

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = item.internName.toLowerCase().includes(q);
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDetails = item.details.toLowerCase().includes(q);
      if (!matchName && !matchTitle && !matchDetails) return false;
    }

    return true;
  });

  // Sort: Pending items first, then by date descending
  filteredItems.sort((a, b) => {
    if (a.status === 'pending' && b.status === 'reviewed') return -1;
    if (a.status === 'reviewed' && b.status === 'pending') return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Pagination logic
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filters change
   useEffect(() => {
     setCurrentPage(1);
   }, [statusFilter, typeFilter, selectedInternFilter, searchQuery, itemsPerPage]);

   // Load platform marking scale setting
   useEffect(() => {
     const fetchSettings = async () => {
       try {
         const data = await api.getSettings();
         if (data.marking_scale) {
           setMarkingScale(data.marking_scale);
         }
       } catch (e) {
         // Default to 1-5 if settings unavailable
       }
     };
     fetchSettings();
   }, []);

   const handleOpenReviewModal = (item: UnifiedReviewItem) => {
    setActiveItem(item);
    setReviewScore(item.score || 5);
    setReviewComment(item.comment || '');
    setFlagMistake(false);
    setMistakeNote('');
    setMistakeSeverity('low');
    setReviewError(null);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;

     setSubmitting(true);
     setReviewError(null);

     // Validate score against marking scale
     const effectiveMaxScore = markingScale === '1-10' ? 10 : 5;
     if (reviewScore < 1 || reviewScore > effectiveMaxScore) {
       setReviewError(`Score must be between 1 and ${effectiveMaxScore}.`);
       setSubmitting(false);
       return;
     }

     try {
      if (activeItem.type === 'log') {
        const mistakesToFlag = (flagMistake && mistakeNote.trim()) ? [{
          note: mistakeNote.trim(),
          severity: mistakeSeverity
        }] : undefined;

        await api.reviewLog(activeItem.id, {
          reviewer_id: currentUser.id,
          score: reviewScore,
          comment: reviewComment.trim() || undefined,
          mistakesFlagged: mistakesToFlag
        });
      } else {
        await api.reviewTask(activeItem.id, {
          reviewer_id: currentUser.id,
          score: reviewScore,
          comment: reviewComment.trim() || undefined
        });
      }

      setActiveItem(null);
      await loadQueueData();
    } catch (err: any) {
      console.error("Failed to submit review:", err);
      setReviewError(err.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = unifiedItems.filter(i => i.status === 'pending').length;
  const reviewedCount = unifiedItems.filter(i => i.status === 'reviewed').length;

   const maxScore = markingScale === '1-10' ? 10 : 5;

   const scoreRatings = Array.from({ length: maxScore }, (_, i) => ({
     score: i + 1,
     label: i + 1 <= 5
       ? ['', 'Needs Improvement', 'Below Target', 'Satisfactory', 'Great Work', 'Exceptional'][i + 1]
       : `Level ${i + 1}`,
   }));

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Loading team review queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/30 p-6 shadow-lg shadow-teal-500/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                <CheckSquare className="h-5 w-5" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Team Review Queue & Grading Desk
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Grade daily code journals and completed sprint tasks, award 5-star ratings with mentor feedback, and persist reviews to team logs.
            </p>
          </div>

          <button
            onClick={loadQueueData}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Queue
          </button>
        </div>

        {/* Quick Counter Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          <div 
            onClick={() => setStatusFilter('pending')}
            className={`p-3.5 rounded-xl border cursor-pointer transition ${
              statusFilter === 'pending'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 ring-2 ring-amber-400/20'
                : 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Pending Review
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 text-xs font-black">
                {pendingCount}
              </span>
            </div>
            <p className="text-lg font-black text-amber-900 dark:text-amber-200 mt-1">{pendingCount} Items</p>
          </div>

          <div 
            onClick={() => setStatusFilter('reviewed')}
            className={`p-3.5 rounded-xl border cursor-pointer transition ${
              statusFilter === 'reviewed'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-400/20'
                : 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Reviewed & Graded
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 text-xs font-black">
                {reviewedCount}
              </span>
            </div>
            <p className="text-lg font-black text-emerald-900 dark:text-emerald-200 mt-1">{reviewedCount} Items</p>
          </div>

          <div 
            onClick={() => setStatusFilter('all')}
            className={`p-3.5 rounded-xl border cursor-pointer transition col-span-2 sm:col-span-1 ${
              statusFilter === 'all'
                ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-800 ring-2 ring-teal-400/20'
                : 'bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-teal-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1">
                <Award className="h-3.5 w-3.5" /> Total In Queue
              </span>
              <span className="px-2 py-0.5 rounded-full bg-teal-200 dark:bg-teal-900/80 text-teal-900 dark:text-teal-200 text-xs font-black">
                {unifiedItems.length}
              </span>
            </div>
            <p className="text-lg font-black text-teal-900 dark:text-teal-200 mt-1">{unifiedItems.length} Total</p>
          </div>
        </div>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/30 p-4 shadow-lg shadow-teal-500/5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as QueueStatusFilter)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="pending">⏳ Pending Review Only</option>
              <option value="reviewed">✅ Reviewed & Graded Only</option>
              <option value="all">🌐 All Statuses</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Item Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as QueueItemType)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">📁 All Types (Logs & Tasks)</option>
              <option value="log">📝 Daily Journals Only</option>
              <option value="task">📌 Sprint Tasks Only</option>
            </select>
          </div>

          {/* Intern Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Team Intern</label>
            <select
              value={selectedInternFilter}
              onChange={(e) => setSelectedInternFilter(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">👥 All Assigned Interns</option>
              {interns.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Search Keywords</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search intern name, code changes, tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
               />
            </div>
          </div>

        </div>
      </div>

      {/* Review Queue Items List */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-teal-500/5 border border-white/20 dark:border-slate-700/30 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Showing {paginatedItems.length} of {filteredItems.length} queued items
          </span>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-slate-400">Page size:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white font-semibold"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {paginatedItems.length === 0 ? (
            <div className="py-16 text-center space-y-3 p-6">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-slate-400">
                <CheckSquare className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800 dark:text-white">No queue items match your filter criteria</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Try clearing search keywords or switching your status filter to view all entries.
                </p>
              </div>
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setSelectedInternFilter('all');
                  setSearchQuery('');
                }}
                className="px-4 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 text-xs font-bold hover:bg-teal-100 dark:hover:bg-teal-900 transition"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            paginatedItems.map(item => (
              <div 
                key={`${item.type}-${item.id}`}
                className="p-5 hover:bg-slate-50/70 dark:hover:bg-slate-950/50 transition flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Item type badge */}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                      item.type === 'log'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                        : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-900'
                    }`}>
                      {item.type === 'log' ? <FileText className="h-3 w-3" /> : <CheckSquare className="h-3 w-3" />}
                      {item.type === 'log' ? 'Daily Journal' : 'Sprint Task'}
                    </span>

                    {/* Status badge */}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.status === 'reviewed'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}>
                      {item.status === 'reviewed' ? '✅ Reviewed' : '⏳ Pending Review'}
                    </span>

                    {/* Date */}
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDate(item.date)}
                    </span>
                  </div>

                  {/* Intern Info & Title */}
                  <div className="flex items-center gap-2.5 pt-0.5">
                    <img 
                      src={item.internAvatar} 
                      alt={item.internName} 
                      className="h-7 w-7 rounded-full object-cover border" 
                      referrerPolicy="no-referrer" 
                    />
                    <div>
                      <span 
                        onClick={() => onSelectIntern && onSelectIntern(item.internId)}
                         className="text-xs font-bold text-slate-900 dark:text-white hover:text-teal-700 dark:hover:text-teal-400 cursor-pointer"
                      >
                        {item.internName}
                      </span>
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                        {item.title}
                      </h4>
                    </div>
                  </div>

                  {/* Code changes / Description snippet */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 bg-slate-50 dark:bg-slate-950/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/80 font-mono">
                    {item.details}
                  </p>

                  {/* GitHub or PR Link if exists */}
                  {item.githubUrl && (
                    <a
                      href={item.githubUrl.startsWith('http') ? item.githubUrl : `https://${item.githubUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                    >
                      <Github className="h-3 w-3" />
                      View Code / Pull Request Link
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}

                  {/* If already reviewed, display score & comment */}
                  {item.status === 'reviewed' && item.score && (
                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          Awarded Score: {item.score} / {maxScore} Stars
                        </span>
                        <span className="text-[9px] text-slate-400 italic">Persisted in DB</span>
                      </div>
                      {item.comment && (
                        <p className="text-xs text-slate-700 dark:text-slate-300 italic">"{item.comment}"</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Review Action Button */}
                <div className="shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleOpenReviewModal(item)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                      item.status === 'reviewed'
                        ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                         : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/20'
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {item.status === 'reviewed' ? 'Edit Review Grade' : 'Grade & Review'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Footer Controls */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Page <span className="font-bold text-slate-800 dark:text-white">{safeCurrentPage}</span> of{' '}
              <span className="font-bold text-slate-800 dark:text-white">{totalPages}</span>
            </p>

            <div className="flex items-center gap-1.5">
              <button
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    p === safeCurrentPage
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Review & Grading Modal */}
      <AnimatePresence>
        {activeItem && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              variants={scaleIn}
              initial="initial"
              animate="animate"
              exit="exit"
              className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative overflow-hidden"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Grading & Mentor Feedback
                    </h3>
                    <p className="text-xs text-slate-400">
                      Reviewing {activeItem.type === 'log' ? 'Daily Journal' : 'Sprint Task'} for {activeItem.internName}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveItem(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {reviewError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs text-rose-600 dark:text-rose-400">
                  {reviewError}
                </div>
              )}

              {/* Item Details Summary */}
              <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
                <p className="text-xs font-bold text-slate-900 dark:text-white">{activeItem.title}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-mono line-clamp-3 leading-relaxed">
                  {activeItem.details}
                </p>
              </div>

              <form onSubmit={handleSaveReview} className="space-y-4">
                 {/* Rating Picker */}
                 <div>
                   <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                     Award Rating (1 to {maxScore} Stars) *
                   </label>
                   <div className="flex items-center gap-2">
                     {Array.from({ length: maxScore }, (_, i) => i + 1).map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewScore(star)}
                        className="p-1 hover:scale-110 transition focus:outline-none"
                      >
                        <Star
                          className={`h-7 w-7 ${
                            star <= reviewScore
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300 dark:text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-extrabold text-teal-600 dark:text-teal-400">
                      {scoreRatings.find(r => r.score === reviewScore)?.label || `${reviewScore} Stars`}
                    </span>
                  </div>
                </div>

                {/* Mentor Feedback Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1">
                    Mentor Notes & Feedback
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Write detailed advice, recommendations, or kudos for the intern..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                     className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Optional Blunder / Mistake Flagging (Only for logs) */}
                {activeItem.type === 'log' && (
                  <div className="p-4 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={flagMistake}
                        onChange={(e) => setFlagMistake(e.target.checked)}
                        className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                      />
                      <span className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-rose-600" />
                        Flag Code Blunder / Mistake
                      </span>
                    </label>

                    {flagMistake && (
                      <div className="space-y-2 pt-1">
                        <input
                          type="text"
                          placeholder="Describe error (e.g. Hardcoded API key in client component)"
                          value={mistakeNote}
                          onChange={(e) => setMistakeNote(e.target.value)}
                          className="w-full text-xs rounded-lg border border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-950 px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />

                        <div className="flex gap-2">
                          {(['low', 'medium', 'high'] as const).map(sev => (
                            <button
                              type="button"
                              key={sev}
                              onClick={() => setMistakeSeverity(sev)}
                              className={`flex-1 py-1.5 text-[10px] font-bold capitalize rounded-lg transition ${
                                mistakeSeverity === sev
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100/50'
                              }`}
                            >
                              {sev} Severity
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveItem(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                     className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-md shadow-teal-600/20 flex items-center gap-1.5"
                  >
                    {submitting ? 'Persisting to DB...' : 'Save Grade & Persist Review ✨'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};



