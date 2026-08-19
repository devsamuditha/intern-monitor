import React from 'react';
import { PASTEL_TEXT, GLASS_VARIANTS, PASTEL_SHADOWS } from '../../ui/theme/ThemeTokens';

interface GlassPanelProps {
  children: React.ReactNode;
  variant?: 'card' | 'panel' | 'section' | 'column';
  textVariant?: keyof typeof PASTEL_TEXT;
  className?: string;
  shadow?: keyof typeof PASTEL_SHADOWS;
  onClick?: () => void;
}

const GlassPanel: React.FC<GlassPanelProps> = (props) => {
  const { children, variant = 'panel', textVariant, className = '', shadow, onClick } = props;
  const glassClass = GLASS_VARIANTS[variant] || GLASS_VARIANTS.panel;
  const textClass = textVariant ? PASTEL_TEXT[textVariant] : '';
  const shadowClass = shadow ? PASTEL_SHADOWS[shadow] : '';

  const combinedClassName = `flex flex-col ${glassClass} ${textClass} ${shadowClass} ${className}`.trim();

  return <div className={combinedClassName} onClick={onClick}>{children}</div>;
};

export default GlassPanel;
