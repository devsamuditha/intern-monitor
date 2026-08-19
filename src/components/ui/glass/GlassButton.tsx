import React from 'react';
import { GLASS_VARIANTS } from '../../ui/theme/ThemeTokens';

interface GlassButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
  type = 'button',
  className = '',
}) => {
  const buttonClass = GLASS_VARIANTS.button[variant] || GLASS_VARIANTS.button.primary;
  const combinedClassName = `px-4 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonClass} ${className}`.trim();

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClassName}
    >
      {children}
    </button>
  );
};

export default GlassButton;
