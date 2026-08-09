"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/src/components/layout/DashboardShell";
import { MyProjects } from "@/src/views/intern/MyProjects";
import { useAuth } from "@/src/context/AuthContext";
import { useSettings } from "@/src/context/SettingsContext";

export default function ProjectsPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState("projects");

  if (!user) return null;

  return (
    <DashboardShell settings={settings} activeTab={activeTab} setActiveTab={setActiveTab}>
      <MyProjects currentUser={user} />
    </DashboardShell>
  );
}
