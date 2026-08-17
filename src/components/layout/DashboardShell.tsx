/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
 
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { 
  LayoutDashboard, FolderKanban,
  Users, TrendingUp, LogOut, Shield, Target, Settings, AlertTriangle, Building2, Trophy, Calendar, Bell
} from "lucide-react";
import { ProfileImageModal } from "../ui/ProfileImageModal";
import { CalendarPopover } from "../ui/CalendarPopover";
import { NotificationBell } from "../notifications/NotificationBell";

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
  const router = useRouter();
  const { user, logout, refreshCurrentUser } = useAuth();
  const role = user?.role;
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const handleLogout = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
    }
    router.push('/login');
  };

  const getNavItems = () => {
    switch (role) {
      case 'intern':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'projects', label: 'My Projects', icon: FolderKanban },
          { id: 'ranking', label: 'Rankings', icon: Trophy },
        ];
      case 'tech_lead':
        return [
          { id: 'team_overview', label: 'Team Overview', icon: Users },
          { id: 'projects', label: 'Projects', icon: FolderKanban },
        ];
      case 'manager':
        return [
          { id: 'analytics', label: 'Org Analytics', icon: TrendingUp },
          { id: 'all_projects', label: 'Projects Registry', icon: FolderKanban },
        ];
      case 'super_admin':
        return [
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'organizations', label: 'Organizations', icon: Building2 },
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
                onClick={() => {
                  setActiveTab(item.id);
                  if (role === 'super_admin') {
                    router.push(`/superadmin/${item.id}`);
                  } else if (role === 'manager') {
                    router.push('/manager');
                  } else if (role === 'tech_lead') {
                    if (item.id === 'projects') {
                      router.push('/projects');
                    } else {
                      router.push('/team');
                    }
                  } else if (role === 'intern') {
                    if (item.id === 'dashboard') router.push(`/dashboard`);
                    else if (item.id === 'projects') router.push(`/projects`);
                     else if (item.id === 'ranking') router.push(`/dashboard/ranking`);
                    else router.push(`/${item.id}`);
                  }
                }}
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
          <div className="flex items-center justify-between p-2.5 bg-white/10 dark:bg-slate-900/10 border border-white/20 dark:border-slate-700/30 rounded-xl">
            <button
              onClick={() => router.push('/notifications')}
              type="button"
              className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 px-2 py-1.5 rounded-lg transition"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              All Notifications
            </button>
            <NotificationBell />
          </div>
         <div className="flex items-center gap-3 p-2.5 bg-white/10 dark:bg-slate-900/10 border border-white/20 dark:border-slate-700/30 rounded-xl cursor-pointer" onClick={() => setShowProfileModal(true)}>
              <img src={user?.avatar ?? '/favicon.ico'} alt={user?.name ?? 'Avatar'} className="h-9 w-9 rounded-full object-cover border border-white/20 dark:border-slate-700/30" referrerPolicy="no-referrer" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate text-white">{user?.name ?? 'User'}</p>
                <p className="text-[9px] text-slate-400 capitalize truncate">{user?.role ?? ''}</p>
              </div>
               {user && (
                 <button 
                   onClick={(e) => handleLogout(e)}
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
         <header className="h-20 bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/30 flex items-center justify-between px-8 z-30 relative">
          
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
            
              {role === 'intern' && (
                <button
                  onClick={() => router.push('/dashboard/ranking')}
                  type="button"
                  className="p-2 border border-white/20 dark:border-slate-700/30 rounded-xl text-slate-300 hover:text-white transition"
                  title="Rankings"
                >
                  <Trophy className="h-4 w-4" />
                </button>
              )}

               <button
                 onClick={() => setShowCalendar(!showCalendar)}
                 onMouseDown={(e) => e.stopPropagation()}
                 type="button"
                 className={`p-2 border border-white/20 dark:border-slate-700/30 rounded-xl transition ${
                   showCalendar ? 'text-teal-300 bg-white/10' : 'text-slate-300 hover:text-white'
                 }`}
                 title="My Calendar"
               >
                 <Calendar className="h-4 w-4" />
               </button>

              {/* Profile Avatar */}
              <button
                onClick={() => setShowProfileModal(true)}
                type="button"
                className="h-8 w-8 rounded-full object-cover border border-white/20 cursor-pointer hover:ring-2 hover:ring-teal-400 transition"
                title="Update Profile Picture"
              >
                <img 
                  src={user?.avatar ?? '/favicon.ico'} 
                  alt={user?.name ?? 'Avatar'} 
                  className="h-8 w-8 rounded-full object-cover border border-white/20"
                  referrerPolicy="no-referrer"
                />
              </button>
           </div>
         </header>

        {showCalendar && (
          <div className="fixed top-20 right-8 z-50">
            <CalendarPopover
              isOpen={showCalendar}
              onClose={() => setShowCalendar(false)}
              userId={user?.id ?? ''}
            />
          </div>
        )}

         {/* Mobile Navigation bar */}
        <div className="md:hidden flex bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/30 px-4 py-2 justify-around gap-1 shrink-0 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  if (role === 'super_admin') {
                    router.push(`/superadmin/${item.id}`);
                  } else if (role === 'manager') {
                    router.push('/manager');
                  } else if (role === 'tech_lead') {
                    if (item.id === 'projects') {
                      router.push('/projects');
                    } else {
                      router.push('/team');
                    }
                  } else if (role === 'intern') {
                    if (item.id === 'dashboard') router.push(`/dashboard`);
                    else if (item.id === 'projects') router.push(`/projects`);
                     else if (item.id === 'ranking') router.push(`/dashboard/ranking`);
                    else router.push(`/${item.id}`);
                  }
                }}
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

       {user && showProfileModal && (
        <ProfileImageModal
          userId={user.id}
          currentAvatarUrl={user.avatar ?? '/favicon.ico'}
          onClose={() => setShowProfileModal(false)}
          onUploaded={(newUrl) => {
            if (user) {
              user.avatar = newUrl;
              refreshCurrentUser();
            }
            setShowProfileModal(false);
          }}
        />
      )}
    </div>
  );
};
