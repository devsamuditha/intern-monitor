/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Helper to format dates cleanly
export const formatDate = (dateStr: string): string => {
  if (!dateStr || dateStr === "Never") return dateStr;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

// Helper for relative time formatting (e.g. "3 hours ago")
export const formatRelativeTime = (isoString: string): string => {
  try {
    const now = new Date();
    const past = new Date(isoString);
    const diffMs = now.getTime() - past.getTime();
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
};

// Get status badge colors
export const getTaskPriorityColor = (priority: 'low' | 'medium' | 'high') => {
  switch (priority) {
    case 'low':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40';
    case 'medium':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/40';
    case 'high':
      return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/40';
    default:
      return 'bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300';
  }
};

export const getTaskStatusColor = (status: 'todo' | 'in_progress' | 'done') => {
  switch (status) {
    case 'todo':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    case 'in_progress':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
    case 'done':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

