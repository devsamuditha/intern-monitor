"use client";

import React, { useState, useEffect } from "react";
import { DashboardShell } from "@/src/components/layout/DashboardShell";
import { InternDashboard } from "@/src/pages/intern/InternDashboard";
import { useAuth } from "@/src/context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [settings, setSettings] = useState<Record<string, any>>({});

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

  return (
    <DashboardShell settings={settings}>
      <div key={`${user.id}-${refreshKey}`}>
        {user.role === "intern" && (
          <InternDashboard user={user} onRefreshStats={handleRefresh} />
        )}
        {user.role === "tech_lead" && (
          <div className="flex items-center justify-center h-64 text-slate-500">
            <p className="text-lg font-semibold">Team Overview — Coming Soon</p>
          </div>
        )}
        {user.role === "manager" && (
          <div className="flex items-center justify-center h-64 text-slate-500">
            <p className="text-lg font-semibold">Org Analytics — Coming Soon</p>
          </div>
        )}
        {user.role === "super_admin" && (
          <div className="flex items-center justify-center h-64 text-slate-500">
            <p className="text-lg font-semibold">Overview Dashboard — Coming Soon</p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
