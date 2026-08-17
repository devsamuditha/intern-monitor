"use client";

import React from "react";
import { NotificationProvider } from "@/src/context/NotificationContext";
import { NotificationHandler } from "@/src/hooks/useNotificationHandler";
import { useAuth } from "@/src/context/AuthContext";

export function NotificationProviders({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return <>{children}</>;
  }

  return (
    <NotificationProvider userId={user.id}>
      <NotificationHandler />
      {children}
    </NotificationProvider>
  );
}
