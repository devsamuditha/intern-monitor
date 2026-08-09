"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/src/components/layout/DashboardShell";
import { SuperAdminOrganizations } from "@/src/views/superadmin/SuperAdminOrganizations";
import { useAuth } from "@/src/context/AuthContext";
import { useSettings } from "@/src/context/SettingsContext";

export default function SuperAdminOrganizationsPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState("organizations");

  if (!user) return null;

  return (
    <DashboardShell settings={settings} activeTab={activeTab} setActiveTab={setActiveTab}>
      <SuperAdminOrganizations currentUser={user} />
    </DashboardShell>
  );
}
