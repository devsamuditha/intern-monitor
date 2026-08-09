"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/src/components/layout/DashboardShell";
import { RankingChart } from "@/src/components/intern/RankingChart";
import { useAuth } from "@/src/context/AuthContext";
import { useSettings } from "@/src/context/SettingsContext";

export default function RankingPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState("ranking");

  if (!user) return null;

  return (
    <DashboardShell settings={settings} activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="max-w-4xl mx-auto">
        <RankingChart currentUserId={user.id} />
      </div>
    </DashboardShell>
  );
}
