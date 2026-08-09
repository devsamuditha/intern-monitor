/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSuperAdminContentFlags, useUpdateContentFlag } from '@/src/hooks/queries/useQueries';
import { api } from '../../services/api';
import { ContentFlag } from '../../types.ts';
import { scaleIn } from '../../utils/motion';
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle, Filter, ChevronDown, ChevronUp, MessageSquare, HelpCircle, ArrowUpCircle, FileText } from 'lucide-react';

type StatusFilter = 'pending' | 'dismissed' | 'resolved' | 'all';
type ContentTypeFilter = 'all' | 'message' | 'question' | 'reply' | 'daily_log';

export const SuperAdminModeration: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentTypeFilter>('all');
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'dismiss' | 'resolve' } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const filters: any = { limit, offset };
  if (statusFilter !== 'all') filters.status = statusFilter;
  if (contentTypeFilter !== 'all') filters.contentType = contentTypeFilter;

  const { data, isLoading: loading, refetch } = useSuperAdminContentFlags(filters);
  const flags: ContentFlag[] = data?.flags || [];
  const total = data?.total || 0;
  const updateFlagMutation = useUpdateContentFlag();

  const handleAction = async (id: string, action: 'dismiss' | 'resolve') => {
    setConfirmAction({ id, action });
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);
    try {
      await updateFlagMutation.mutateAsync(confirmAction);
    } catch (e) {
      console.error("Failed to update flag:", e);
    } finally {
      setConfirmLoading(false);
      setConfirmAction(null);
    }
  };

  const loadFlags = refetch;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-100/30 dark:border-amber-900/30"><AlertTriangle className="h-3 w-3" /> Pending</span>;
      case 'dismissed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/30 dark:border-slate-700/30"><XCircle className="h-3 w-3" /> Dismissed</span>;
      case 'resolved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100/30 dark:border-emerald-900/30"><CheckCircle2 className="h-3 w-3" /> Resolved</span>;
      default:
        return null;
    }
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'message': return <MessageSquare className="h-4 w-4 text-teal-600" />;
      case 'question': return <HelpCircle className="h-4 w-4 text-amber-600" />;
      case 'reply': return <ArrowUpCircle className="h-4 w-4 text-emerald-600" />;
      case 'daily_log': return <FileText className="h-4 w-4 text-purple-600" />;
      default: return null;
    }
  };

  const getContentTypeLabel = (contentType: string) => {
    switch (contentType) {
      case 'message': return 'Message';
      case 'question': return 'Question';
      case 'reply': return 'Reply';
      case 'daily_log': return 'Daily Log';
      default: return contentType;
    }
  };

  const pendingFlags = flags.filter(f => f.status === 'pending');

  if (loading) {
    return (
      <motion.div {...scaleIn} className="text-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading moderation queue...</p>
      </motion.div>
    );
  }

  return (
    <motion.div {...scaleIn} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Content Moderation</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review and resolve flagged content</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 dark:border-slate-700/30 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-300 text-xs font-semibold transition"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-xl border border-white/20 dark:border-slate-700/30 p-1">
          {(['pending', 'dismissed', 'resolved', 'all'] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setOffset(0); }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                statusFilter === s
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-xl border border-white/20 dark:border-slate-700/30 p-1">
          {(['all', 'message', 'question', 'reply', 'daily_log'] as ContentTypeFilter[]).map(ct => (
            <button
              key={ct}
              onClick={() => { setContentTypeFilter(ct); setOffset(0); }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                contentTypeFilter === ct
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {ct === 'all' ? 'All Types' : getContentTypeLabel(ct)}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {flags.length === 0 ? (
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/30 p-12 text-center">
            <p className="text-sm text-slate-400 dark:text-slate-500">No content flags to review.</p>
          </div>
        ) : (
          flags.map((flag) => (
            <motion.div
              key={flag.id}
              variants={scaleIn}
              initial="initial"
              animate="animate"
              className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-sm p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {getContentTypeIcon(flag.contentType)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {getContentTypeLabel(flag.contentType)}
                      </span>
                      {getStatusBadge(flag.status)}
                    </div>
                    {flag.preview?.title && (
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{flag.preview.title}</p>
                    )}
                    {flag.preview?.authorName && (
                      <p className="text-[10px] text-slate-400 mt-0.5">by {flag.preview.authorName}</p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-slate-400">{new Date(flag.createdAt).toLocaleString()}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{flag.id.slice(0, 8)}...</p>
                </div>
              </div>

              {flag.preview?.content && (
                <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 line-clamp-3">
                  {flag.preview.content}
                </p>
              )}

              <div className="flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-700 dark:text-slate-300 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded-xl border border-amber-100 dark:border-amber-900/30">
                  <span className="font-semibold">Reason:</span> {flag.reason}
                </p>
              </div>

              {flag.status === 'pending' && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setConfirmAction({ id: flag.id, action: 'dismiss' })}
                    disabled={confirmAction?.id === flag.id && confirmLoading}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 text-[10px] font-bold transition disabled:opacity-50"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => setConfirmAction({ id: flag.id, action: 'resolve' })}
                    disabled={confirmAction?.id === flag.id && confirmLoading}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-[10px] font-bold transition disabled:opacity-50 shadow-sm"
                  >
                    {confirmAction?.id === flag.id && confirmLoading ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    ) : (
                      <>Resolve</>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-slate-400">
            Showing {offset + 1}–{Math.min(offset + limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 disabled:opacity-30 transition"
            >
              Previous
            </button>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 disabled:opacity-30 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmAction && (
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
                    Confirm Action
                  </h3>
                </div>
                <button
                  onClick={() => setConfirmAction(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Are you sure you want to <strong>{confirmAction.action}</strong> this content flag?
              </p>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeAction}
                  disabled={confirmLoading}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition shadow-md ${
                    confirmAction.action === 'resolve'
                      ? 'bg-teal-600 hover:bg-teal-500 text-white'
                      : 'bg-slate-600 hover:bg-slate-500 text-white'
                  } inline-flex items-center gap-2 disabled:opacity-50`}
                >
                  {confirmLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      {confirmAction.action === 'resolve' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      {confirmAction.action === 'resolve' ? 'Resolve' : 'Dismiss'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};



export default SuperAdminModeration;

