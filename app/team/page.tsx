"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/src/components/layout/DashboardShell";
import { TeamOverview } from "@/src/pages/techlead/TeamOverview";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/services/api";

export default function TeamPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Record<string, any>>({});

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

  if (!user) return null;

  return (
    <DashboardShell settings={settings}>
      <TeamOverview currentUser={user} />
    </DashboardShell>
  );
}
