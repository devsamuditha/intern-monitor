"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/src/components/layout/DashboardShell";
import { ManagerOverview } from "@/src/views/manager/ManagerOverview";
import { useAuth } from "@/src/context/AuthContext";
import { useSettings } from "@/src/context/SettingsContext";

export default function ManagerPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState("analytics");

  if (!user) return null;

  return (
    <DashboardShell settings={settings} activeTab={activeTab} setActiveTab={setActiveTab}>
      <ManagerOverview currentUser={user} />
    </DashboardShell>
  );
}
