"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '@/src/services/api';
import { getSupabaseClient } from '@/src/lib/supabaseClient';

export interface Notification {
  id: string;
  organizationId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  isRed: boolean;
  relatedId?: string;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<any>;
  clearAll: () => Promise<{ success: boolean; count: number }>;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode; userId?: string }> = ({ children, userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refreshNotifications = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const result = await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      return result;
    } catch (e) {
      console.error('Failed to mark all notifications as read:', e);
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      const result = await api.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      return result;
    } catch (e) {
      console.error('Failed to clear notifications:', e);
      throw e;
    }
  }, []);

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 60000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  useEffect(() => {
    let subscriptionChannel: any = null;

    try {
      const supabase = getSupabaseClient();
      subscriptionChannel = supabase
        .channel('notifications-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Notification' }, () => {
          refreshNotifications();
        })
        .subscribe();
    } catch (err) {
      console.warn("Realtime notifications are inactive:", err);
    }

    return () => {
      if (subscriptionChannel) {
        subscriptionChannel.unsubscribe();
      }
    };
  }, [refreshNotifications]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, refreshNotifications, markAsRead, markAllAsRead, clearAll, isLoading }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      notifications: [],
      unreadCount: 0,
      refreshNotifications: async () => {},
      markAsRead: async () => {},
      markAllAsRead: async () => ({ success: true, count: 0 }),
      clearAll: async () => ({ success: true, count: 0 }),
      isLoading: false,
    };
  }
  return context;
};
