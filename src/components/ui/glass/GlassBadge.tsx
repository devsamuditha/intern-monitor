import React from 'react';

interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const variantClasses: Record<string, string> = {
  success: 'bg-green-500/20 text-green-200 border border-green-500/30',
  warning: 'bg-amber-500/20 text-amber-200 border border-amber-500/30',
  danger: 'bg-rose-500/20 text-rose-200 border border-rose-500/30',
  info: 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/30',
};

const GlassBadge: React.FC<GlassBadgeProps> = ({
  children,
  variant = 'info',
  className = '',
}) => {
  const variantClass = variantClasses[variant] || variantClasses.info;
  const combinedClassName = `rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${variantClass} ${className}`.trim();

  return <span className={combinedClassName}>{children}</span>;
};

export default GlassBadge;
