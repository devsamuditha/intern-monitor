"use client";

import { useEffect, useRef, useState } from "react";
import { useNotifications } from "@/src/context/NotificationContext";
import { useAuth } from "@/src/context/AuthContext";
import { playNotificationSound } from "@/src/utils/notificationSounds";
import { api } from "@/src/services/api";

interface UseNotificationHandlerOptions {
  enabled?: boolean;
}

export function useNotificationHandler({ enabled = true }: UseNotificationHandlerOptions = {}) {
  const { notifications, markAllAsRead } = useNotifications();
  const { user } = useAuth();
  const [mutedTypes, setMutedTypes] = useState<string[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const permissionRequestedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    if (!enabled || !user) return;

    api
      .getNotificationSettings()
      .then((data) => {
        if (cancelled) return;
        setMutedTypes(data.mutedTypes || []);
      })
      .catch(() => {
        if (cancelled) return;
        setMutedTypes([]);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, user]);

  useEffect(() => {
    if (!enabled || !user) return;

    const currentlyUnread = notifications.filter((n) => !n.isRead);
    const newUnread = currentlyUnread.filter((n) => !seenIdsRef.current.has(n.id));

    for (const notification of newUnread) {
      seenIdsRef.current.add(notification.id);

      if (mutedTypes.includes(notification.type)) {
        continue;
      }

      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "default" && !permissionRequestedRef.current) {
          permissionRequestedRef.current = true;
          Notification.requestPermission().catch(() => {});
        }

        if (Notification.permission === "granted") {
          try {
            new Notification(notification.title, {
              body: notification.message,
              icon: "/favicon.ico",
              tag: notification.id,
            });
          } catch (e) {
            console.warn("Browser notification failed:", e);
          }
        }
      }

      const soundType = notification.isRed ? "warning" : "reminder";
      playNotificationSound(soundType);
    }
  }, [notifications, mutedTypes, enabled, user]);

  return { mutedTypes, markAllAsRead };
}

export function NotificationHandler({ enabled = true }: UseNotificationHandlerOptions = {}) {
  useNotificationHandler({ enabled });
  return null;
}
