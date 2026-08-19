export const GLASS_CLASSES = {
  card: 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl',
  lightCard: 'bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl',
  container: 'bg-white dark:bg-slate-900 rounded-2xl',
  table: 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl overflow-hidden',
  sidebar: 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-white/20 dark:border-slate-700/30',
  header: 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/30',
  filterBar: 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-xl',
  input: 'bg-white/10 border border-white/20 focus:ring-teal-400/30 focus:border-teal-300 rounded-xl',
  button: {
    primary: 'bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20',
    secondary: 'border border-white/20 dark:border-slate-700/30 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-300',
    ghost: 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300',
  },
  text: {
    primary: 'text-slate-900 dark:text-white',
    secondary: 'text-slate-500 dark:text-slate-400',
    muted: 'text-slate-400 dark:text-slate-500',
    accent: 'text-teal-600 dark:text-teal-400',
  },
};

export const GRADIENT_CLASSES = {
  page: 'bg-gradient-to-br from-teal-950 via-cyan-950 to-emerald-950',
  login: 'bg-gradient-to-br from-teal-950 via-cyan-950 to-emerald-950',
};

export const PASTEL_TEXT = {
  primary: 'text-pink-100',
  secondary: 'text-blue-200',
  muted: 'text-slate-300',
  accent: 'text-teal-200',
  success: 'text-green-200',
  warning: 'text-amber-200',
  danger: 'text-rose-200',
  info: 'text-indigo-200',
  heading: 'text-purple-100',
  label: 'text-cyan-200',
};

export const GLASS_VARIANTS = {
  card: 'bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl',
  panel: 'bg-white/15 dark:bg-slate-900/15 backdrop-blur-2xl border border-white/25 dark:border-slate-700/40 rounded-3xl',
  section: 'bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl',
  column: 'bg-white/5 dark:bg-slate-900/5 backdrop-blur-lg border border-white/10 dark:border-slate-700/20 rounded-2xl',
  input: 'bg-white/10 dark:bg-slate-900/10 border border-white/20 dark:border-slate-700/30 rounded-xl text-pink-100 placeholder:text-slate-500 focus:ring-teal-400/30',
  button: {
    primary: 'bg-teal-500/80 hover:bg-teal-400/80 text-white backdrop-blur-sm border border-white/20 rounded-xl shadow-lg shadow-teal-500/10',
    secondary: 'bg-white/10 hover:bg-white/20 text-blue-200 border border-white/20 rounded-xl backdrop-blur-sm',
    ghost: 'text-blue-200 hover:text-pink-100 hover:bg-white/10 rounded-lg',
  },
  table: 'bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl overflow-hidden',
  sidebar: 'bg-white/10 dark:bg-slate-900/10 backdrop-blur-2xl border-r border-white/20 dark:border-slate-700/30',
  header: 'bg-white/10 dark:bg-slate-900/10 backdrop-blur-2xl border-b border-white/20 dark:border-slate-700/30',
  modal: 'bg-white/10 dark:bg-slate-900/10 backdrop-blur-2xl border border-white/25 dark:border-slate-700/40 rounded-3xl',
};

export const PASTEL_SHADOWS = {
  card: 'shadow-lg shadow-teal-500/5',
  panel: 'shadow-xl shadow-teal-500/10',
  accent: 'shadow-md shadow-blue-500/10',
  danger: 'shadow-md shadow-rose-500/10',
  success: 'shadow-md shadow-green-500/10',
};

export const QUICK_LINK_COLORS: Record<string, {
  bg: string;
  bgDark: string;
  border: string;
  borderDark: string;
  iconBg: string;
  iconBgDark: string;
  iconText: string;
  iconTextDark: string;
}> = {
  teal: {
    bg: 'bg-teal-50/50',
    bgDark: 'dark:bg-teal-950/20',
    border: 'border-teal-100/30',
    borderDark: 'dark:border-teal-900/20',
    iconBg: 'bg-teal-100',
    iconBgDark: 'dark:bg-teal-950/40',
    iconText: 'text-teal-600',
    iconTextDark: 'dark:text-teal-400',
  },
  indigo: {
    bg: 'bg-indigo-50/50',
    bgDark: 'dark:bg-indigo-950/20',
    border: 'border-indigo-100/30',
    borderDark: 'dark:border-indigo-900/20',
    iconBg: 'bg-indigo-100',
    iconBgDark: 'dark:bg-indigo-950/40',
    iconText: 'text-indigo-600',
    iconTextDark: 'dark:text-indigo-400',
  },
  rose: {
    bg: 'bg-rose-50/50',
    bgDark: 'dark:bg-rose-950/20',
    border: 'border-rose-100/30',
    borderDark: 'dark:border-rose-900/20',
    iconBg: 'bg-rose-100',
    iconBgDark: 'dark:bg-rose-950/40',
    iconText: 'text-rose-600',
    iconTextDark: 'dark:text-rose-400',
  },
  amber: {
    bg: 'bg-amber-50/50',
    bgDark: 'dark:bg-amber-950/20',
    border: 'border-amber-100/30',
    borderDark: 'dark:border-amber-900/20',
    iconBg: 'bg-amber-100',
    iconBgDark: 'dark:bg-amber-950/40',
    iconText: 'text-amber-600',
    iconTextDark: 'dark:text-amber-400',
  },
};
