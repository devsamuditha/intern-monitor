"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/src/components/layout/DashboardShell";
import { SuperAdminSettings } from "@/src/views/superadmin/SuperAdminSettings";
import { useAuth } from "@/src/context/AuthContext";
import { useSettings } from "@/src/context/SettingsContext";

export default function SuperAdminSettingsPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState("settings");

  if (!user) return null;

  return (
    <DashboardShell settings={settings} activeTab={activeTab} setActiveTab={setActiveTab}>
      <SuperAdminSettings />
    </DashboardShell>
  );
}
