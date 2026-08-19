import React from 'react';
import { GLASS_VARIANTS, PASTEL_SHADOWS } from '../../ui/theme/ThemeTokens';

interface GlassStatProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  iconColor?: string;
  className?: string;
}

const getColorClasses = (color: string) => {
  switch (color) {
    case 'amber': return { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/50', hoverBorder: 'hover:border-amber-400 dark:hover:border-amber-500', shadow: 'hover:shadow-amber-500/10' };
    case 'emerald': return { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/50', hoverBorder: 'hover:border-emerald-400 dark:hover:border-emerald-500', shadow: 'hover:shadow-emerald-500/10' };
    case 'teal': 
    default: 
      return { bg: 'bg-teal-50 dark:bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800/50', hoverBorder: 'hover:border-teal-400 dark:hover:border-teal-500', shadow: 'hover:shadow-teal-500/10' };
  }
};

const GlassStat: React.FC<GlassStatProps> = ({
  icon: Icon,
  label,
  value,
  iconColor,
  className = '',
}) => {
  const colors = getColorClasses(iconColor || 'teal');
  const combinedClassName = `relative flex flex-col p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border ${colors.border} ${colors.hoverBorder} transition-all duration-300 shadow-sm hover:shadow-lg ${colors.shadow} hover:-translate-y-1 ${className}`.trim();

  return (
    <div className={combinedClassName}>
      <div className="flex items-center gap-4">
        <div className={`p-3.5 rounded-2xl ${colors.bg}`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
        <div className="flex-1">
          <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default GlassStat;
