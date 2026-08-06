/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
 
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { 
  LayoutDashboard, FolderKanban, MessageSquare, Sun, Moon, 
  Users, TrendingUp, LogOut, Shield, Target, Settings, AlertTriangle
} from "lucide-react";
import { api } from "../../services/api";
import { ChatPanel } from "../intern/ChatPanel";

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
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const askTheTeamEnabled = settings?.ask_the_team_enabled !== false;
  const { user, logout, refreshCurrentUser } = useAuth();
  const role = user?.role;
  const { isDarkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getNavItems = () => {
    const baseItems = (base: Array<{ id: string; label: string; icon: any }>) =>
      askTheTeamEnabled ? [...base, { id: 'discussions', label: 'Ask the Team', icon: MessageSquare }] : base;
    switch (role) {
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

  // Prevent hydration mismatch by only rendering interactive elements after mount
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-950 via-cyan-950 to-emerald-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">

      {/* Sidebar - Desktop (fixed to screen) */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:h-screen md:fixed md:top-0 md:left-0 md:z-40 bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border-r border-white/20 dark:border-slate-700/30 overflow-y-auto">
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 border-b border-white/20 dark:border-slate-700/30 gap-2.5">
          <div className="bg-teal-600 text-white p-2 rounded-xl shadow-lg shadow-teal-100 dark:shadow-none">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white uppercase font-display">InternTrack</h1>
            <p className="text-[9px] text-teal-200 font-bold uppercase tracking-wider font-mono">Software Engineering</p>
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
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  active 
                    ? 'bg-white/10 text-teal-300' 
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${active ? 'text-teal-300' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile Row */}
        <div className="p-4 border-t border-white/20 dark:border-slate-700/30 space-y-2">
          <div className="flex items-center gap-3 p-2.5 bg-white/10 dark:bg-slate-900/10 border border-white/20 dark:border-slate-700/30 rounded-xl">
            <img src={user?.avatar ?? '/favicon.ico'} alt={user?.name ?? 'Avatar'} className="h-9 w-9 rounded-full object-cover border border-white/20 dark:border-slate-700/30" referrerPolicy="no-referrer" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-white">{user?.name ?? 'User'}</p>
              <p className="text-[9px] text-slate-400 capitalize truncate">{user?.role ?? ''}</p>
            </div>
            {user && (
              <button 
                onClick={handleLogout}
                type="button"
                className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-rose-400 rounded-lg transition"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Container (offset for fixed sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        
        {/* Topbar */}
        <header className="h-20 bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/30 flex items-center justify-between px-8 z-10">
          
          {/* Left indicator / Mobile Title */}
          <div className="flex items-center gap-2">
            <span className="md:hidden bg-teal-600 text-white p-1 rounded-md shrink-0">
              <Target className="h-4 w-4" />
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-300 md:inline-block hidden">Active Dashboard:</span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/10 border border-white/20 text-teal-300 px-2.5 py-1 rounded-full">
                {user?.role === 'tech_lead' ? 'Tech Lead Reviewer' : user?.role === 'manager' ? 'Engineering Director' : user?.role === 'super_admin' ? 'Super Admin' : 'Software Intern'}
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            
            {/* Dark Mode toggle */}
            <button
              onClick={toggleDarkMode}
              type="button"
              className="p-2 border border-white/20 dark:border-slate-700/30 rounded-xl text-slate-300 hover:text-white transition"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Profile Avatar Mobile */}
            <img 
              src={user?.avatar ?? '/favicon.ico'} 
              alt={user?.name ?? 'Avatar'} 
              className="h-8 w-8 rounded-full object-cover border border-white/20 md:hidden" 
              onClick={handleLogout}
              title="Logout"
              referrerPolicy="no-referrer"
            />
          </div>
        </header>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/30 px-4 py-2 justify-around gap-1 shrink-0 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[9px] font-semibold transition ${
                  active 
                    ? 'text-teal-300 bg-white/10' 
                    : 'text-slate-400 hover:text-slate-200'
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

      {/* Floating Chat Panel (fixed to screen) - shown for all authenticated users */}
      {user && <ChatPanel currentUser={user} />}
    </div>
  );
};
