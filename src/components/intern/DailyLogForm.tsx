/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { api } from '../../services/api';
import { User, Project, DaySession } from '../../types';
import { Check, Save, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { DailyLogReviewModal } from './DailyLogReviewModal';

interface DailyLogFormProps {
  user: User;
  onSuccess: () => void;
  todaySession?: DaySession | null;
}

export const DailyLogForm: React.FC<DailyLogFormProps> = ({ user, onSuccess, todaySession }) => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [summary, setSummary] = useState('');
  const [changes, setChanges] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);

  // Auto-save draft states
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'has_draft'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const draftKey = `interntrack_log_draft_${user.id}`;
  const isInitialLoad = useRef(true);

  // Fetch projects & restore draft
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const pList = await api.getProjects();
        setProjects(pList);

        const savedDraftRaw = localStorage.getItem(draftKey);
        if (savedDraftRaw) {
          try {
            const draft = JSON.parse(savedDraftRaw);
            if (draft.summary || draft.changes) {
              setSummary(draft.summary || '');
              setChanges(draft.changes || '');
              setGithubUrl(draft.githubUrl || '');
              setSelectedTechs(draft.selectedTechs || []);
              if (draft.selectedProjectId) setSelectedProjectId(draft.selectedProjectId);
              if (draft.screenshotUrl) setScreenshotUrl(draft.screenshotUrl);
              setSaveStatus('has_draft');
              setLastSavedTime(draft.savedAt || 'Previous session');
            }
          } catch (e) {
            // Ignore parse error
          }
        }

        if (pList.length > 0 && !selectedProjectId) {
          const own = pList.find(p => p.owner_id === user.id);
          setSelectedProjectId(own ? own.id : pList[0].id);
          if (!githubUrl) setGithubUrl(own ? own.github_url : pList[0].github_url);
        }
      } catch (err) {
        console.error("Error loading projects", err);
      } finally {
        setTimeout(() => {
          isInitialLoad.current = false;
        }, 500);
      }
    };
    fetchProjects();
  }, [user]);

  // Debounced auto-save effect
  useEffect(() => {
    if (isInitialLoad.current) return;
    if (!summary && !changes) return;

    setSaveStatus('saving');
    const timer = setTimeout(() => {
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const draftData = {
        selectedProjectId,
        summary,
        changes,
        githubUrl,
        selectedTechs,
        screenshotUrl,
        savedAt: nowStr
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      setSaveStatus('saved');
      setLastSavedTime(nowStr);
    }, 800);

    return () => clearTimeout(timer);
  }, [summary, changes, githubUrl, selectedTechs, selectedProjectId, screenshotUrl]);

  const clearDraft = () => {
    localStorage.removeItem(draftKey);
    setSummary('');
    setChanges('');
    setScreenshotUrl('');
    setSelectedTechs([]);
    setSaveStatus('idle');
    setLastSavedTime(null);
  };

  const submitLog = async () => {
    if (!selectedProjectId) {
      setError('Please select a project.');
      return false;
    }
    if (!summary.trim()) {
      setError('Please describe what you worked on today.');
      return false;
    }
    if (!changes.trim()) {
      setError('Please outline what changed today (changelog).');
      return false;
    }
    if (!githubUrl.startsWith('http://') && !githubUrl.startsWith('https://')) {
      setError('Please enter a valid GitHub commit or repo URL.');
      return false;
    }

    setLoading(true);
    setError('');

    try {
      await api.submitLog({
        intern_id: user.id,
        project_id: selectedProjectId,
        summary: summary.trim(),
        technologies: selectedTechs,
        changes: changes.trim(),
        screenshot_url: screenshotUrl || undefined,
        github_url: githubUrl.trim()
      });

      localStorage.removeItem(draftKey);
      setSaveStatus('idle');
      setSummary('');
      setChanges('');
      setScreenshotUrl('');
      setSelectedTechs([]);

      setShowSuccessAnim(true);
      setTimeout(() => {
        setShowSuccessAnim(false);
        onSuccess();
      }, 2000);

      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to submit log.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleModalFieldChange = (data: Partial<{
    selectedProjectId: string;
    summary: string;
    technologies: string[];
    changes: string;
    githubUrl: string;
    screenshotUrl: string;
  }>) => {
    if (data.selectedProjectId !== undefined) setSelectedProjectId(data.selectedProjectId);
    if (data.summary !== undefined) setSummary(data.summary);
    if (data.technologies !== undefined) setSelectedTechs(data.technologies);
    if (data.changes !== undefined) setChanges(data.changes);
    if (data.githubUrl !== undefined) setGithubUrl(data.githubUrl);
    if (data.screenshotUrl !== undefined) setScreenshotUrl(data.screenshotUrl);
  };

  return (
    <div id="daily-log-form-container" className="bg-black/10 backdrop-blur-xl rounded-2xl shadow-lg shadow-teal-500/5 p-6 relative overflow-hidden transition-all duration-200">
      <AnimatePresence>
        {showSuccessAnim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-teal-600/95 flex flex-col items-center justify-center z-30 text-white p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="bg-white text-teal-600 rounded-full p-4 mb-4 shadow-lg shadow-teal-900/30"
            >
              <Check className="h-10 w-10 stroke-[3]" />
            </motion.div>
            <motion.h3
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-bold tracking-tight mb-2"
            >
              Daily Log Submitted! 🔥
            </motion.h3>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-teal-100 max-w-sm text-sm"
            >
              Your tech lead has been notified. Keep up the amazing streak!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 ">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            Write Daily Journal
          </h2>
        </div>

        {/* Auto-save status indicator */}
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold animate-pulse">
              <Save className="h-3 w-3" /> Saving draft...
            </span>
          )}
          {(saveStatus === 'saved' || saveStatus === 'has_draft') && (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-200/50 dark:border-emerald-900/30">
                <CheckCircle2 className="h-3 w-3" /> Auto-saved {lastSavedTime ? `at ${lastSavedTime}` : ''}
              </span>
              <button
                type="button"
                onClick={clearDraft}
                title="Discard draft"
                className="p-1 rounded-lg text-white/50 hover:text-rose-400 hover:bg-rose-500/10 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs border border-rose-100 dark:border-rose-900/40">
          {error}
        </div>
      )}

      {/* IST Time-Gated Warning Banner */}
      {todaySession?.status === 'active' && (() => {
        const now = new Date();
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const istDate = new Date(utc + 5.5 * 3600000);
        const istHour = istDate.getHours();
        const istMinute = istDate.getMinutes();
        const istTimeMinutes = istHour * 60 + istMinute;
        const onePMMinutes = 13 * 60;

        if (istTimeMinutes < onePMMinutes) {
          const totalMinutes = onePMMinutes - istTimeMinutes;
          const hours = Math.floor(totalMinutes / 60);
          const mins = totalMinutes % 60;
          const remainingStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

          return (
            <div className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                ⏰ You must submit your daily journal before 1:00 PM IST
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-amber-900/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-60"
                    style={{ width: `${Math.min(100, ((istTimeMinutes - 9 * 60) / (onePMMinutes - 9 * 60)) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-amber-300 shrink-0">{remainingStr} remaining</span>
              </div>
            </div>
          );
        }

        return null;
      })()}

      {/* Progress Bar */}
      {todaySession?.status === 'active' && (() => {
        const now = new Date();
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const istDate = new Date(utc + 5.5 * 3600000);
        const istHour = istDate.getHours();
        const istMinute = istDate.getMinutes();
        const istTimeMinutes = istHour * 60 + istMinute;
        const onePMMinutes = 13 * 60;
        const fivePMMinutes = 17 * 60;

        let progressLabel: string;
        let progressPercent: number;
        let gradientFrom: string;
        let gradientTo: string;

        if (istTimeMinutes < onePMMinutes) {
          const totalSpan = onePMMinutes - 9 * 60;
          const elapsed = istTimeMinutes - 9 * 60;
          progressPercent = Math.min(100, Math.max(0, (elapsed / totalSpan) * 100));
          progressLabel = `Time remaining until 1:00 PM`;
          gradientFrom = 'from-teal-500';
          gradientTo = 'to-emerald-400';
        } else {
          const totalSpan = fivePMMinutes - onePMMinutes;
          const elapsed = istTimeMinutes - onePMMinutes;
          progressPercent = Math.min(100, Math.max(0, (elapsed / totalSpan) * 100));
          progressLabel = `Working hours remaining until 5:00 PM`;
          gradientFrom = 'from-emerald-500';
          gradientTo = 'to-teal-400';
        }

        return (
          <div className="mb-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-white/50">{progressLabel}</span>
              <span className="text-[10px] font-mono text-white/40">{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${gradientFrom} ${gradientTo} transition-all duration-60`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        );
      })()}

      {/* Submit for Review Button */}
      {todaySession?.status === 'active' && (
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setShowReviewModal(true)}
            className="w-full py-2 rounded-xl text-white font-medium bg-teal-600 hover:bg-teal-700 active:scale-[0.98] transition-all duration-150 text-sm shadow-sm flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Submit for Review
          </button>
        </div>
      )}

      {/* Review Modal */}
      <DailyLogReviewModal
        show={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onConfirm={async () => {
          setShowReviewModal(false);
          await submitLog();
        }}
        projects={projects}
        logData={{
          selectedProjectId,
          summary,
          technologies: selectedTechs,
          changes,
          githubUrl,
          screenshotUrl,
        }}
        onFieldChange={handleModalFieldChange}
      />
    </div>
  );
};