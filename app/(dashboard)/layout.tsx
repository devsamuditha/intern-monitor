"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import {
  LayoutDashboard, FolderKanban, MessageSquare, Sun, Moon,
  Users, TrendingUp, LogOut, Shield, Power, ChevronDown, CheckCircle, Flame, Target, Settings, AlertTriangle
} from "lucide-react";
import { api } from "@/src/services/api";
import type { User } from "@/src/types";

interface DashboardShellProps {
  children: React.ReactNode;
  settings?: Record<string, any>;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  children,
  settings,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, switchUser, allDemoUsers, refreshCurrentUser } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [showUserSwitcher, setShowUserSwitcher] = React.useState(false);

  const askTheTeamEnabled = settings?.ask_the_team_enabled !== false;

  if (!user) return <>{children}</>;

  const handleStatusToggle = async () => {
    try {
      const nextActive = !user.active;
      await api.toggleUserStatus(user.id, nextActive);
      await refreshCurrentUser();
    } catch (e) {
      console.error(e);
    }
  };

  const getNavItems = () => {
    const baseItems = (base: Array<{ id: string; label: string; icon: any }>) =>
      askTheTeamEnabled ? [...base, { id: "discussions", label: "Ask the Team", icon: MessageSquare }] : base;
    switch (user.role) {
      case "intern":
        return baseItems([
          { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
          { id: "projects", label: "My Projects", icon: FolderKanban },
        ]);
      case "tech_lead":
        return baseItems([
          { id: "team_overview", label: "Team Overview", icon: Users },
        ]);
      case "manager":
        return baseItems([
          { id: "analytics", label: "Org Analytics", icon: TrendingUp },
          { id: "all_projects", label: "Projects Registry", icon: FolderKanban },
        ]);
      case "super_admin":
        return [
          { id: "overview", label: "Overview", icon: TrendingUp },
          { id: "users", label: "Users", icon: Users },
          { id: "audit", label: "Audit", icon: Shield },
          { id: "moderation", label: "Moderation", icon: AlertTriangle },
          { id: "settings", label: "Settings", icon: Settings },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const isActive = (tabId: string) => {
    if (tabId === "dashboard") return pathname === "/dashboard" || pathname === "/";
    if (tabId === "all_projects") return pathname === "/projects";
    return pathname === `/dashboard/${tabId}`;
  };

  const handleNavClick = (tabId: string) => {
    if (tabId === "dashboard") router.push("/dashboard");
    else if (tabId === "all_projects") router.push("/projects");
    else router.push(`/dashboard/${tabId}`);
  };

  const handleUserSwitch = (targetUser: User) => {
    switchUser(targetUser);
    setShowUserSwitcher(false);
    if (targetUser.role === "intern") router.push("/dashboard");
    else if (targetUser.role === "tech_lead") router.push("/dashboard/team_overview");
    else if (targetUser.role === "manager") router.push("/dashboard/analytics");
    else if (targetUser.role === "super_admin") router.push("/dashboard/overview");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      <aside className="hidden md:flex flex-col w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-white/20 dark:border-slate-700/30 shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-white/20 dark:border-slate-700/30 gap-2.5">
          <div className="bg-teal-600 text-white p-2 rounded-xl shadow-lg shadow-teal-100 dark:shadow-none">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase font-display">InternTrack</h1>
            <p className="text-[9px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider font-mono">Software Engineering</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.id);
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  active
                    ? "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${active ? "text-teal-700 dark:text-teal-400" : "text-slate-400"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/20 dark:border-slate-700/30 space-y-2">
          <div className="p-3 bg-teal-50/50 dark:bg-teal-950/10 rounded-xl border border-teal-100/30 dark:border-teal-900/10">
            <p className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold leading-relaxed font-mono">
              💡 Use the top menu to switch roles instantly and test different dashboard interfaces!
            </p>
          </div>

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

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-white/20 dark:border-slate-700/30 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-2">
            <span className="md:hidden bg-teal-600 text-white p-1 rounded-md shrink-0">
              <Target className="h-4 w-4" />
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800 dark:text-white md:inline-block hidden">Active Dashboard:</span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 px-2.5 py-1 rounded-full border border-teal-100/30 dark:border-teal-900/30">
                {user.role === "tech_lead" ? "Tech Lead Reviewer" : user.role === "manager" ? "Engineering Director" : user.role === "super_admin" ? "Super Admin" : "Software Intern"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user.role === "intern" && (
              <button
                onClick={handleStatusToggle}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition flex items-center gap-1.5 ${
                  user.active
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-850 dark:text-slate-400"
                }`}
              >
                <Power className="h-3 w-3" />
                {user.active ? "Status: Working Now 🔥" : "Status: Away / Inactive"}
              </button>
            )}

            <button
              onClick={toggleDarkMode}
              className="p-2 border border-white/20 dark:border-slate-700/30 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950 transition"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserSwitcher(!showUserSwitcher)}
                className="px-3 py-2 border border-teal-200 dark:border-teal-900 bg-teal-50/50 dark:bg-teal-950/30 hover:bg-teal-100/50 text-teal-600 dark:text-teal-400 rounded-xl text-[10px] font-bold flex items-center gap-1 transition"
              >
                <Shield className="h-3.5 w-3.5" /> Test Other Role <ChevronDown className="h-3 w-3" />
              </button>

              {showUserSwitcher && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl z-20 overflow-hidden py-1">
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-b">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Demo Quick Switch</p>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {allDemoUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleUserSwitch(u)}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-950 text-left transition ${
                          user.id === u.id ? "bg-teal-50/40 dark:bg-teal-950/20 font-bold" : ""
                        }`}
                      >
                        <img src={u.avatar} alt={u.name} className="h-7 w-7 rounded-full object-cover border" referrerPolicy="no-referrer" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{u.name}</p>
                          <p className="text-[9px] text-slate-400 capitalize">{u.role}</p>
                        </div>
                        {user.id === u.id && (
                          <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

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

        <div className="md:hidden flex bg-white dark:bg-slate-900 border-b border-white/20 dark:border-slate-700/30 px-4 py-2 justify-around gap-1 shrink-0 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.id);
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[9px] font-semibold transition ${
                  active
                    ? "text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/30"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardShell;

