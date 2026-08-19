"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Bell, X, ChevronDown, ChevronUp, VolumeX, Volume2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/src/context/NotificationContext';
import { api } from '@/src/services/api';

interface NotificationBellProps {
  onToggle?: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onToggle }) => {
  const { unreadCount, markAsRead, notifications, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [showMuteSection, setShowMuteSection] = useState(false);
  const [mutedTypes, setMutedTypes] = useState<string[]>([]);
  const [isClearing, setIsClearing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadMutedTypes = async () => {
    try {
      const data = await api.getNotificationSettings();
      setMutedTypes(data.mutedTypes || []);
    } catch {
      setMutedTypes([]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMutedTypes();
    }
  }, [isOpen]);

  const toggleMute = async (type: string) => {
    const newMuted = mutedTypes.includes(type)
      ? mutedTypes.filter((t) => t !== type)
      : [...mutedTypes, type];
    setMutedTypes(newMuted);
    try {
      await api.updateNotificationSettings(newMuted);
    } catch {
      // revert on failure
      setMutedTypes((prev) =>
        prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
      );
    }
  };

  const distinctTypes = useMemo(() => {
    const types = new Set<string>();
    notifications.forEach((n) => types.add(n.type));
    return Array.from(types);
  }, [notifications]);

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    setIsOpen(false);
    router.push('/notifications');
  };

  const handleClearAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isClearing || notifications.length === 0) return;
    if (!window.confirm('Delete all notifications permanently?')) return;
    setIsClearing(true);
    try {
      await clearAll();
      setIsOpen(false);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (onToggle) onToggle();
        }}
        type="button"
        className="p-2 border border-white/20 dark:border-slate-700/30 rounded-xl text-slate-300 hover:text-white transition relative"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div ref={panelRef} className="absolute right-0 top-full mt-2 z-50">
          <div className="w-96 max-h-[500px] overflow-y-auto bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-slate-700/30">
              <h3 className="text-sm font-bold text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {distinctTypes.length > 0 && (
                  <button
                    onClick={() => setShowMuteSection(!showMuteSection)}
                    type="button"
                    className="text-slate-400 hover:text-white transition"
                    title="Mute notification types"
                  >
                    {showMuteSection ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                )}
                <button
                  onClick={handleClearAll}
                  disabled={isClearing || notifications.length === 0}
                  className="text-slate-400 hover:text-rose-400 transition disabled:opacity-50"
                  title="Clear all notifications"
                >
                  {isClearing ? <span className="text-[10px]">...</span> : <Trash2 className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {showMuteSection && distinctTypes.length > 0 && (
              <div className="p-3 border-b border-white/20 dark:border-slate-700/30">
                <p className="text-[10px] text-slate-400 uppercase font-semibold mb-2">Mute by type</p>
                <div className="space-y-1">
                  {distinctTypes.map((type) => {
                    const isMuted = mutedTypes.includes(type);
                    return (
                      <button
                        key={type}
                        onClick={() => toggleMute(type)}
                        className="w-full flex items-center justify-between p-1.5 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition"
                        type="button"
                      >
                        <span className="truncate">{type}</span>
                        {isMuted ? (
                          <VolumeX className="h-3 w-3 text-rose-400" />
                        ) : (
                          <Volume2 className="h-3 w-3 text-teal-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="p-2">
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No notifications yet</p>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 rounded-xl mb-2 cursor-pointer transition border-l-4 ${
                      notification.isRead
                        ? 'bg-white/40 dark:bg-slate-800/40 border-l-slate-300'
                        : notification.isRed
                        ? 'bg-rose-500/10 border-l-rose-500'
                        : 'bg-teal-500/10 border-l-teal-400'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`mt-0.5 ${notification.isRed ? 'text-rose-400' : 'text-teal-400'}`}>
                        {notification.isRed ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${notification.isRead ? 'text-slate-500' : 'text-white'}`}>
                          {notification.title}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{notification.message}</p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {new Date(notification.createdAt).toLocaleString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-rose-500 rounded-full shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
