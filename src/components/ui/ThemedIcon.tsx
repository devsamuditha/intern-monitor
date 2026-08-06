import React from 'react';
import { LucideIcon } from 'lucide-react';

type IconColor = 'teal' | 'emerald' | 'amber' | 'rose' | 'slate' | 'white' | 'purple';

interface ThemedIconProps {
  icon: LucideIcon;
  color?: IconColor;
  size?: number;
  className?: string;
  fill?: boolean;
}

const colorClasses: Record<IconColor, string> = {
  teal: 'text-teal-400',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400',
  slate: 'text-slate-400',
  white: 'text-white',
  purple: 'text-purple-400',
};

export const ThemedIcon: React.FC<ThemedIconProps> = ({
  icon: Icon,
  color = 'teal',
  size = 16,
  className = '',
  fill = false,
}) => {
  return (
    <Icon
      className={`${colorClasses[color]} ${className} ${fill ? 'fill-current' : ''}`}
      size={size}
    />
  );
};
