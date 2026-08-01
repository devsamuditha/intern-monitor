/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
 
"use client";

import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { 
  LayoutDashboard, FolderKanban, MessageSquare, Sun, Moon, 
  Users, TrendingUp, LogOut, Shield, Target, Settings, AlertTriangle
} from "lucide-react";
import { api } from "../../services/api";

interface DashboardShellProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRefresh?: () => void;
  settings?: Record<string, any>;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({ 
  children, 
  activeTab, 
  setActiveTab,
  onRefresh,
  settings,
}) => {
  const askTheTeamEnabled = settings?.ask_the_team_enabled !== false;
  const { user, logout, refreshCurrentUser } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();

  if (!user) return <>{children}</>;

  const getNavItems = () => {
    const baseItems = (base: Array<{ id: string; label: string; icon: any }>) =>
      askTheTeamEnabled ? [...base, { id: 'discussions', label: 'Ask the Team', icon: MessageSquare }] : base;
    switch (user.role) {
      case 'intern':
        return baseItems([
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'projects', label: 'My Projects', icon: FolderKanban },
        ]);
      case 'tech_lead':
        return baseItems([
          { id: 'team_overview', label: 'Team Overview', icon: Users },
        ]);
      case 'manager':
        return baseItems([
          { id: 'analytics', label: 'Org Analytics', icon: TrendingUp },
          { id: 'all_projects', label: 'Projects Registry', icon: FolderKanban },
        ]);
      case 'super_admin':
        return [
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'audit', label: 'Audit', icon: Shield },
          { id: 'moderation', label: 'Moderation', icon: AlertTriangle },
          { id: 'settings', label: 'Settings', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-white/20 dark:border-slate-700/30 shrink-0">
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 border-b border-white/20 dark:border-slate-700/30 gap-2.5">
          <div className="bg-teal-600 text-white p-2 rounded-xl shadow-lg shadow-teal-100 dark:shadow-none">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase font-display">InternTrack</h1>
            <p className="text-[9px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider font-mono">Software Engineering</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  active 
                    ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${active ? 'text-teal-700 dark:text-teal-400' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile Row */}
        <div className="p-4 border-t border-white/20 dark:border-slate-700/30 space-y-2">
          
          <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-850 rounded-xl">
            <img src={user.avatar} alt={user.name} className="h-9 w-9 rounded-full object-cover border border-white/20 dark:border-slate-700/30" referrerPolicy="no-referrer" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-slate-900 dark:text-white">{user.name}</p>
              <p className="text-[9px] text-slate-400 capitalize truncate">{user.role}</p>
            </div>
            <button 
              onClick={logout}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-400 hover:text-rose-600 rounded-lg transition"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Topbar */}
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-white/20 dark:border-slate-700/30 flex items-center justify-between px-8 z-10">
          
          {/* Left indicator / Mobile Title */}
          <div className="flex items-center gap-2">
            <span className="md:hidden bg-teal-600 text-white p-1 rounded-md shrink-0">
              <Target className="h-4 w-4" />
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800 dark:text-white md:inline-block hidden">Active Dashboard:</span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 px-2.5 py-1 rounded-full border border-teal-100/30 dark:border-teal-900/30">
                {user.role === 'tech_lead' ? 'Tech Lead Reviewer' : user.role === 'manager' ? 'Engineering Director' : user.role === 'super_admin' ? 'Super Admin' : 'Software Intern'}
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            
            {/* Dark Mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 border border-white/20 dark:border-slate-700/30 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950 transition"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Profile Avatar Mobile */}
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="h-8 w-8 rounded-full object-cover border md:hidden" 
              onClick={logout}
              title="Logout"
              referrerPolicy="no-referrer"
            />
          </div>
        </header>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex bg-white dark:bg-slate-900 border-b border-white/20 dark:border-slate-700/30 px-4 py-2 justify-around gap-1 shrink-0 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[9px] font-semibold transition ${
                  active 
                    ? 'text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/30' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
