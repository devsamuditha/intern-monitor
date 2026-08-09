"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/src/components/layout/DashboardShell";
import { InternDashboard } from "@/src/views/intern/InternDashboard";
import { MyProjects } from "@/src/views/intern/MyProjects";
import { AskTeamThread } from "@/src/components/intern/AskTeamThread";
import { TeamOverview } from "@/src/views/techlead/TeamOverview";
import { ManagerOverview } from "@/src/views/manager/ManagerOverview";
import { SuperAdminOverview } from "@/src/views/superadmin/SuperAdminOverview";
import { SuperAdminUsers } from "@/src/views/superadmin/SuperAdminUsers";
import { SuperAdminAudit } from "@/src/views/superadmin/SuperAdminAudit";
import { SuperAdminModeration } from "@/src/views/superadmin/SuperAdminModeration";
import { SuperAdminSettings } from "@/src/views/superadmin/SuperAdminSettings";
import { useAuth } from "@/src/context/AuthContext";
import { useSettings } from "@/src/context/SettingsContext";

export default function DashboardPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState(
    user?.role === "tech_lead"
      ? "team_overview"
      : user?.role === "manager"
        ? "analytics"
        : user?.role === "super_admin"
          ? "overview"
          : "dashboard"
  );

  useEffect(() => {
    if (!user) return;

    const defaultTab =
      user.role === "tech_lead"
        ? "team_overview"
        : user.role === "manager"
        ? "analytics"
        : user?.role === "super_admin"
        ? "overview"
        : "dashboard";

    if (activeTab !== defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [user]);

  const renderPanel = () => {
    switch (user?.role) {
      case "intern":
        switch (activeTab) {
          case "discussions":
            return <AskTeamThread currentUser={user} />;
          case "projects":
            return <MyProjects currentUser={user} />;
          default:
            return <InternDashboard user={user} />;
        }
      case "tech_lead":
        return <TeamOverview currentUser={user} />;
      case "manager":
        if (activeTab === "all_projects") {
          return <MyProjects currentUser={user} readOnly />;
        }
        return <ManagerOverview currentUser={user} />;
      case "super_admin":
        switch (activeTab) {
          case "users":
            return <SuperAdminUsers currentUser={user} />;
          case "audit":
            return <SuperAdminAudit currentUser={user} />;
          case "moderation":
            return <SuperAdminModeration />;
          case "settings":
            return <SuperAdminSettings />;
          default:
            return <SuperAdminOverview currentUser={user} />;
        }
      default:
        return null;
    }
  };

  return (
    <DashboardShell settings={settings} activeTab={activeTab} setActiveTab={setActiveTab}>
      {user ? (
        renderPanel()
      ) : (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4" />
          <p className="text-sm text-slate-500">Loading dashboard...</p>
        </div>
      )}
    </DashboardShell>
  );
}
