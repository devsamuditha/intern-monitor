import React from 'react';
import { PASTEL_TEXT, GLASS_VARIANTS, PASTEL_SHADOWS } from '../../ui/theme/ThemeTokens';

interface GlassSectionProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: 'card' | 'panel' | 'section';
  textVariant?: keyof typeof PASTEL_TEXT;
  className?: string;
  shadow?: keyof typeof PASTEL_SHADOWS;
}

const GlassSection: React.FC<GlassSectionProps> = ({
  children,
  title,
  description,
  variant = 'section',
  textVariant,
  className = '',
  shadow,
}) => {
  const glassClass = GLASS_VARIANTS[variant] || GLASS_VARIANTS.section;
  const textClass = textVariant ? PASTEL_TEXT[textVariant] : '';
  const shadowClass = shadow ? PASTEL_SHADOWS[shadow] : '';

  const combinedClassName = `flex flex-col ${glassClass} ${textClass} ${shadowClass} ${className}`.trim();

  return (
    <div className={combinedClassName}>
      {(title || description) && (
        <div className="mb-3">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && <p className="text-sm opacity-80">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

export default GlassSection;
