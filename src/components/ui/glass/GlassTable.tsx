import React from 'react';
import { GLASS_VARIANTS } from '../../ui/theme/ThemeTokens';

interface GlassTableProps {
  children: React.ReactNode;
  className?: string;
}

const GlassTable: React.FC<GlassTableProps> = ({
  children,
  className = '',
}) => {
  const tableClass = GLASS_VARIANTS.table;
  const combinedClassName = `${tableClass} ${className}`.trim();

  return (
    <div className={combinedClassName}>
      <table className="w-full">{children}</table>
    </div>
  );
};

export default GlassTable;
