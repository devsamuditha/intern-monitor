/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  TrendingUp,
  LogOut,
  Shield,
  Target,
  Settings,
  AlertTriangle,
  Building2,
  Trophy,
  Calendar,
  Bell,
  CheckSquare,
  BookOpen,
  ClipboardList,
  UserCheck,
  ShieldAlert,
  User as UserIcon,
  LogIn,
  Clock,
} from "lucide-react";
import { ProfileImageModal } from "../ui/ProfileImageModal";
import { CalendarPopover } from "../ui/CalendarPopover";
import { NotificationBell } from "../notifications/NotificationBell";
import { GLASS_VARIANTS, GRADIENT_CLASSES } from "../ui/theme/ThemeTokens";
import { GlassTabBar } from "../ui/glass/GlassTabBar";

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
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const handleLogout = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
    }
    router.push("/login");
  };

  const getNavItems = () => {
    switch (role) {
      case "intern":
        return [
          { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
          { id: "projects", label: "My Projects", icon: FolderKanban },
          { id: "ranking", label: "Rankings", icon: Trophy },
          { id: "assigned-board", label: "Assigned Board", icon: CheckSquare },
          { id: "logs", label: "Past Logs History", icon: Clock },
          { id: "mistakes", label: "Mistakes", icon: ShieldAlert },
          { id: "profile", label: "Profile", icon: UserIcon },
          { id: "requests", label: "Request", icon: LogIn },
        ];
      case "tech_lead":
        return [
          { id: "team_overview", label: "Team Overview", icon: Users },
          { id: "review_queue", label: "Review Queue", icon: CheckSquare },
          { id: "intern_summary", label: "Intern Summary", icon: BookOpen },
          { id: "ranking", label: "Rankings", icon: Trophy },
          { id: "projects", label: "Projects", icon: FolderKanban },
          { id: "manager_assignments", label: "Manager Assign Projects", icon: ClipboardList },
          { id: "interns", label: "Interns", icon: UserCheck },
        ];
      case "manager":
        return [
          { id: "analytics", label: "Org Analytics", icon: TrendingUp },
          { id: "all_projects", label: "Projects Registry", icon: FolderKanban },
        ];
      case "super_admin":
        return [
          { id: "overview", label: "Overview", icon: TrendingUp },
          { id: "organizations", label: "Organizations", icon: Building2 },
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

  const getInternPath = (id: string) => {
    switch (id) {
      case "dashboard":
        return "/dashboard";
      case "projects":
        return "/projects";
      case "ranking":
        return "/dashboard/ranking";
      case "assigned-board":
        return "/dashboard/assigned-board";
      case "logs":
        return "/dashboard/logs";
      case "mistakes":
        return "/dashboard/mistakes";
      case "profile":
        return "/dashboard/profile";
      case "requests":
        return "/dashboard/requests";
      default:
        return `/${id}`;
    }
  };

  const handleNavClick = (e: React.MouseEvent, item: { id: string }) => {
    e.preventDefault();
    setActiveTab(item.id);
    if (role === "super_admin") {
      router.push(`/superadmin/${item.id}`);
    } else if (role === "manager") {
      router.push("/manager");
    } else if (role === "tech_lead") {
      router.push(`/dashboard?tab=${item.id}`);
    } else if (role === "intern") {
      router.push(getInternPath(item.id));
    }
  };

  return (
    <div className={`min-h-screen ${GRADIENT_CLASSES.page} text-slate-900 dark:text-slate-100 transition-colors duration-200`}>
      {/* Sidebar - Desktop (fixed to screen) */}
      <aside
        className={`hidden md:flex md:flex-col md:h-screen md:fixed md:top-0 md:left-0 md:z-40 bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border-r border-white/20 dark:border-slate-700/30 overflow-y-auto transition-all duration-300 ease-in-out ${sidebarExpanded ? "md:w-64" : "md:w-16"}`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {/* Brand Header */}
        <div className={`h-20 flex items-center ${sidebarExpanded ? "px-6" : "px-3 justify-center"} gap-2.5 border-b border-white/20 dark:border-slate-700/30`}>
          <div className="bg-teal-600 text-white p-2 rounded-xl shadow-lg shadow-teal-100 dark:shadow-none shrink-0">
            <Target className="h-5 w-5" />
          </div>
          <div className={`whitespace-nowrap overflow-hidden transition-all ${sidebarExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"}`}>
            <h1 className="text-sm font-black tracking-tight text-white uppercase font-display">InternTrack</h1>
            <p className="text-[9px] text-teal-200 font-bold uppercase tracking-wider font-mono">Software Engineering</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className={`flex-1 px-4 py-6 ${sidebarExpanded ? "space-y-2" : "space-y-3"}`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={(e) => handleNavClick(e, item)}
                className={`flex items-center ${sidebarExpanded ? "w-full justify-start gap-3 px-4 py-3" : "w-fit mx-auto justify-center gap-0 px-2 py-2"} rounded-xl text-xs font-semibold transition-all duration-150 overflow-hidden ${
                  active ? "bg-white/10 text-teal-300" : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 ${active ? "text-teal-300" : "text-slate-400"}`} />
                <span className={`inline-block whitespace-nowrap overflow-hidden transition-all ${sidebarExpanded ? "opacity-100 w-auto ml-3" : "opacity-0 w-0 ml-0"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions: Notifications + Logout */}
        <div className="p-4 border-t border-white/20 dark:border-slate-700/30 space-y-2">
          <button
            onClick={() => router.push("/notifications")}
            type="button"
            className={`flex items-center ${sidebarExpanded ? "w-full justify-start gap-2 px-3 py-2" : "w-fit mx-auto justify-center gap-0 px-2 py-2"} text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition overflow-hidden`}
            title="Notifications"
          >
            <Bell className="h-4 w-4 shrink-0" />
            <span className={`inline-block whitespace-nowrap overflow-hidden transition-all ${sidebarExpanded ? "opacity-100 w-auto ml-3" : "opacity-0 w-0"}`}>
              All Notifications
            </span>
          </button>
          {user && (
            <button
              onClick={(e) => handleLogout(e)}
              type="button"
              className={`flex items-center ${sidebarExpanded ? "w-full justify-start gap-2 px-3 py-2" : "w-fit mx-auto justify-center gap-0 px-2 py-2"} text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition overflow-hidden`}
              title="Logout"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className={`inline-block whitespace-nowrap overflow-hidden transition-all ${sidebarExpanded ? "opacity-100 w-auto ml-3" : "opacity-0 w-0"}`}>
                Logout
              </span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Container (offset for fixed sidebar) */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${sidebarExpanded ? "md:ml-64" : "md:ml-16"}`}>
        {/* Topbar */}
        <header className="h-20 bg-white/10 dark:bg-slate-900/10 backdrop-blur-xl border-b border-white/20 dark:border-slate-700/30 flex items-center justify-between px-8 z-30 relative">
          {/* Left indicator / Mobile Title */}
          <div className="flex items-center gap-2">
            <span className="md:hidden bg-teal-600 text-white p-1 rounded-md shrink-0">
              <Target className="h-4 w-4" />
            </span>
            <div className="flex items-center gap-1.5">
              {user?.role === "tech_lead" ? (
                <span className="text-xs font-bold text-slate-300 md:inline-block hidden">Hello, {user?.name}! 👋</span>
              ) : (
                <>
                  <span className="text-xs font-bold text-slate-300 md:inline-block hidden">Active Dashboard:</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/10 border border-white/20 text-teal-300 px-2.5 py-1 rounded-full">
                    {user?.role === "manager" ? "Engineering Director" : user?.role === "super_admin" ? "Super Admin" : "Software Intern"}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {role === "intern" && (
              <button
                onClick={() => router.push("/dashboard/ranking")}
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
                showCalendar ? "text-teal-300 bg-white/10" : "text-slate-300 hover:text-white"
              }`}
              title="My Calendar"
            >
              <Calendar className="h-4 w-4" />
            </button>

            <NotificationBell />

            {/* Profile Avatar */}
            <button
              onClick={() => setShowProfileModal(true)}
              type="button"
              className="h-8 w-8 rounded-full object-cover border border-white/20 cursor-pointer hover:ring-2 hover:ring-teal-400 transition"
              title="Update Profile Picture"
            >
              <img
                src={user?.avatar ?? "/favicon.ico"}
                alt={user?.name ?? "Avatar"}
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
              userId={user?.id ?? ""}
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
                onClick={(e) => handleNavClick(e, item)}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[9px] font-semibold transition ${
                  active ? "text-teal-300 bg-white/10" : "text-slate-400 hover:text-slate-200"
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
          currentAvatarUrl={user.avatar ?? "/favicon.ico"}
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
