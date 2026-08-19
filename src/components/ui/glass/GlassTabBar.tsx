"use client";

import { SetStateAction, ElementType, FC } from 'react';

interface GlassTabBarProps {
  tabs: { id: string; label: string; icon?: ElementType }[];
  activeTab: string;
  onTabChange: (tabId: string) => void | ((value: SetStateAction<string>) => void);
  className?: string;
}

export const GlassTabBar: FC<GlassTabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}) => {
  return (
    <div className={`flex border-b border-white/20 dark:border-slate-700/30 gap-2 overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold rounded-t-2xl transition border-t-2 whitespace-nowrap ${
              isActive
                ? 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-teal-600 text-teal-700 dark:text-teal-400 border-x border-white/20 dark:border-slate-700/30 shadow-lg shadow-teal-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
