"use client";

import React, { useState } from "react";
import { DashboardShell } from "@/src/components/layout/DashboardShell";
import { DailyLogTimeline } from "@/src/components/intern/DailyLogTimeline";
import { useAuth } from "@/src/context/AuthContext";
import { useSettings } from "@/src/context/SettingsContext";
import { useLogs, useMarks } from "@/src/hooks/queries/useDashboardQueries";

export default function LogsPage() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState("logs");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  if (!user) return null;

  const { data: logs = [] } = useLogs(user.id);
  const { data: marks = [] } = useMarks(user.id);

  return (
    <DashboardShell settings={settings} activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="max-w-4xl mx-auto">
        <DailyLogTimeline
          logs={logs}
          marks={marks}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
        />
      </div>
    </DashboardShell>
  );
}
