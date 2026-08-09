"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { api } from "@/src/services/api";

const DEFAULT_SETTINGS: Record<string, any> = {
  ask_the_team_enabled: true,
  allow_new_registrations: true,
  marking_scale: "1-5",
};

interface SettingsContextType {
  settings: Record<string, any>;
  isLoading: boolean;
  error: unknown;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_CACHE_TIME = 5 * 60 * 1000;

export function SettingsProvider({ children }: { children: ReactNode }) {
  const {
    data: settings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.getSettings(),
    staleTime: SETTINGS_CACHE_TIME,
    gcTime: SETTINGS_CACHE_TIME,
    placeholderData: DEFAULT_SETTINGS,
  } as UseQueryOptions<Record<string, any>>);

  const value: SettingsContextType = {
    settings: settings || DEFAULT_SETTINGS,
    isLoading,
    error,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

export function useMarkingScale(): "1-5" | "1-10" {
  const { settings } = useSettings();
  const scale = settings?.marking_scale;
  return scale === "1-10" ? "1-10" : "1-5";
}
