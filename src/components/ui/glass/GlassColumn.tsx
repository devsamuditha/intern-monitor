import React from 'react';
import { PASTEL_TEXT, GLASS_VARIANTS, PASTEL_SHADOWS } from '../../ui/theme/ThemeTokens';

interface GlassColumnProps {
  children: React.ReactNode;
  variant?: 'card' | 'panel' | 'column';
  textVariant?: keyof typeof PASTEL_TEXT;
  className?: string;
  shadow?: keyof typeof PASTEL_SHADOWS;
}

const GlassColumn: React.FC<GlassColumnProps> = ({
  children,
  variant = 'column',
  textVariant,
  className = '',
  shadow,
}) => {
  const glassClass = GLASS_VARIANTS[variant] || GLASS_VARIANTS.column;
  const textClass = textVariant ? PASTEL_TEXT[textVariant] : '';
  const shadowClass = shadow ? PASTEL_SHADOWS[shadow] : '';

  const combinedClassName = `flex flex-col ${glassClass} ${textClass} ${shadowClass} ${className}`.trim();

  return <div className={combinedClassName}>{children}</div>;
};

export default GlassColumn;
