import React from 'react';
import { PASTEL_TEXT, GLASS_VARIANTS, PASTEL_SHADOWS } from '../../ui/theme/ThemeTokens';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'card' | 'panel' | 'section' | 'column';
  textVariant?: keyof typeof PASTEL_TEXT;
  className?: string;
  shadow?: keyof typeof PASTEL_SHADOWS;
  onClick?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'card',
  textVariant,
  className = '',
  shadow,
  onClick,
}) => {
  const glassClass = GLASS_VARIANTS[variant] || GLASS_VARIANTS.card;
  const textClass = textVariant ? PASTEL_TEXT[textVariant] : '';
  const shadowClass = shadow ? PASTEL_SHADOWS[shadow] : '';

  const combinedClassName = `flex flex-col ${glassClass} ${textClass} ${shadowClass} ${className}`.trim();

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={combinedClassName}>
        {children}
      </button>
    );
  }

  return <div className={combinedClassName}>{children}</div>;
};

export default GlassCard;
