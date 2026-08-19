import React from 'react';
import { GLASS_VARIANTS } from '../../ui/theme/ThemeTokens';

interface GlassInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  name?: string;
  id?: string;
}

const GlassInput: React.FC<GlassInputProps> = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  className = '',
  name,
  id,
}) => {
  const inputClass = GLASS_VARIANTS.input;
  const combinedClassName = `px-4 py-2 outline-none w-full ${inputClass} ${className}`.trim();

  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      name={name}
      id={id}
      className={combinedClassName}
    />
  );
};

export default GlassInput;
