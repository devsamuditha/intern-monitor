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
import { api } from "@/src/services/api";

export default function DashboardPage() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [settings, setSettings] = useState<Record<string, any>>({});
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
    if (user && user.role !== "intern") {
      setRefreshKey((prev) => prev + 1);
    }
  }, [user]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.getSettings();
        setSettings(data);
      } catch (e) {
        setSettings({ ask_the_team_enabled: true, allow_new_registrations: true, marking_scale: "1-5" });
      }
    };
    fetchSettings();
  }, []);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (!user) return null;

  const renderPanel = () => {
    switch (user.role) {
      case "intern":
        switch (activeTab) {
          case "discussions":
            return <AskTeamThread currentUser={user} />;
          case "projects":
            return <MyProjects currentUser={user} />;
          default:
            return <InternDashboard user={user} onRefreshStats={handleRefresh} />;
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
      <div key={`${user.id}-${refreshKey}`}>
        {renderPanel()}
      </div>
    </DashboardShell>
  );
}
