"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/src/components/layout/DashboardShell";
import { useAuth } from "@/src/context/AuthContext";
import { useSettings } from "@/src/context/SettingsContext";
import { useNotifications } from "@/src/context/NotificationContext";
import { api } from "@/src/services/api";
import { CheckCircle, AlertCircle, Bell, VolumeX, Volume2, Check } from "lucide-react";

const FILTERS = ["all", "unread"] as const;
type FilterType = (typeof FILTERS)[number];

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState("notifications");
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const [filter, setFilter] = useState<FilterType>("all");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [mutedTypes, setMutedTypes] = useState<string[]>([]);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    api
      .getNotificationSettings()
      .then((data) => {
        setMutedTypes(data.mutedTypes || []);
        setSettingsLoaded(true);
      })
      .catch(() => {
        setMutedTypes([]);
        setSettingsLoaded(true);
      });
  }, [user]);

  const toggleMute = async (type: string) => {
    const newMuted = mutedTypes.includes(type)
      ? mutedTypes.filter((t) => t !== type)
      : [...mutedTypes, type];
    setMutedTypes(newMuted);
    try {
      await api.updateNotificationSettings(newMuted);
    } catch {
      setMutedTypes((prev) =>
        prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
      );
    }
  };

  const distinctTypes = useMemo(() => {
    const types = new Set<string>();
    notifications.forEach((n) => types.add(n.type));
    return Array.from(types).sort();
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === "unread" && n.isRead) return false;
      if (typeFilter && n.type !== typeFilter) return false;
      return true;
    });
  }, [notifications, filter, typeFilter]);

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.relatedId) {
      const routeMap: Record<string, (id: string) => string> = {
        task: (id) => `/dashboard?tab=tasks&task=${id}`,
        project: (id) => `/projects/${id}`,
        daily_log: (id) => `/dashboard?tab=logs&log=${id}`,
      };
      const routeFn = routeMap[notification.type];
      if (routeFn) {
        router.push(routeFn(notification.relatedId));
        return;
      }
    }
  };

  if (!user) return null;

  return (
    <DashboardShell settings={settings} activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-teal-400" />
            <h1 className="text-xl font-bold text-white">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl transition"
              type="button"
            >
              <Check className="h-4 w-4" />
              Mark All Read
            </button>
          )}
        </div>

        {settingsLoaded && distinctTypes.length > 0 && (
          <div className="p-4 bg-white/10 dark:bg-slate-900/10 border border-white/20 dark:border-slate-700/30 rounded-2xl space-y-3">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Mute notification types</p>
            <div className="flex flex-wrap gap-2">
              {distinctTypes.map((type) => {
                const isMuted = mutedTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleMute(type)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      isMuted
                        ? "bg-rose-500/20 text-rose-300"
                        : "bg-white/10 dark:bg-slate-800/40 text-slate-300 hover:text-white"
                    }`}
                    type="button"
                  >
                    {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    {type}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setTypeFilter(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                filter === f
                  ? "bg-teal-600 text-white"
                  : "bg-white/10 dark:bg-slate-800/40 text-slate-300 hover:text-white"
              }`}
              type="button"
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          {distinctTypes.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                typeFilter === t
                  ? "bg-teal-600 text-white"
                  : "bg-white/10 dark:bg-slate-800/40 text-slate-300 hover:text-white"
              }`}
              type="button"
            >
              {t}
            </button>
          ))}
        </div>

        {typeFilter && (
          <button
            onClick={() => setTypeFilter(null)}
            className="mb-4 text-xs text-slate-400 hover:text-white underline"
            type="button"
          >
            Clear type filter: {typeFilter}
          </button>
        )}

        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Bell className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No notifications{filter === "unread" ? " unread" : ""} yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((notification) => {
              const isMuted = mutedTypes.includes(notification.type);
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 rounded-xl cursor-pointer transition border-l-4 ${
                    notification.isRead
                      ? "bg-white/40 dark:bg-slate-800/40 border-l-slate-300"
                      : notification.isRed
                      ? "bg-rose-500/10 border-l-rose-500"
                      : "bg-teal-500/10 border-l-teal-400"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${notification.isRed ? "text-rose-400" : "text-teal-400"}`}>
                      {notification.isRed ? (
                        <AlertCircle className="h-5 w-5" />
                      ) : (
                        <CheckCircle className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-semibold ${notification.isRead ? "text-slate-500" : "text-white"}`}>
                          {notification.title}
                        </p>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded ${
                            isMuted
                              ? "bg-rose-500/20 text-rose-300"
                              : "bg-teal-500/20 text-teal-300"
                          }`}
                          title={isMuted ? "Muted" : "Unmuted"}
                        >
                          {notification.type}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMute(notification.type);
                          }}
                          className="ml-auto text-slate-400 hover:text-white"
                          title={isMuted ? "Unmute" : "Mute"}
                          type="button"
                        >
                          {isMuted ? (
                            <VolumeX className="h-3 w-3" />
                          ) : (
                            <Volume2 className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{notification.message}</p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {new Date(notification.createdAt).toLocaleString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-rose-500 rounded-full shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
