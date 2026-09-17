'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  time: string;
  read: boolean;
}

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  refresh: () => void;
}

// Shown when the alerts API is unreachable. Deliberately empty — showing fabricated
// equipment/stock alerts here would look like real data and could mislead someone into
// acting on a maintenance issue that doesn't exist.
const FALLBACK: Notification[] = [];

// Map API alert severity → notification type
function severityToType(severity?: string): Notification['type'] {
  if (!severity) return 'info';
  const s = severity.toLowerCase();
  if (s === 'critical' || s === 'high') return 'error';
  if (s === 'medium' || s === 'warning') return 'warning';
  if (s === 'low') return 'info';
  return 'info';
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return 'Recently';
  try {
    let cleanStr = dateStr;
    // If there is no timezone offset indicator, append Z to force UTC parsing
    if (!cleanStr.endsWith('Z') && !cleanStr.includes('+') && !cleanStr.includes('-')) {
      cleanStr = cleanStr + 'Z';
    }
    const diff = Date.now() - new Date(cleanStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return 'Recently';
  }
}

const NotificationsContext = createContext<NotificationsContextValue>({
  notifications: FALLBACK,
  unreadCount: 0,
  markAllRead: () => {},
  markRead: () => {},
  refresh: () => {},
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(FALLBACK);
  const [seeded, setSeeded] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      // Fetch from real GET /api/alerts endpoint
      const res = await fetch('/api/alerts', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        const alerts: Notification[] = (Array.isArray(data) ? data : data?.alerts ?? [])
          .slice(0, 10)
          .map((a: any, i: number) => ({
            id: String(a.id ?? i),
            title: a.title ?? a.alertType ?? 'Alert',
            message: a.message ?? a.description ?? '',
            type: severityToType(a.severity ?? a.level),
            time: timeAgo(a.createdAt ?? a.timestamp),
            read: !!(a.isRead ?? a.acknowledged ?? false),
          }));
        setNotifications(alerts);
        setSeeded(true);
        return;
      }
    } catch {
      // fall through to fallback
    }

    // If not already populated with real data, keep fallback
    if (!seeded) {
      setNotifications(FALLBACK);
    }
  }, [seeded]);

  useEffect(() => {
    // Wait for auth to settle before fetching
    const timer = setTimeout(() => { fetchAlerts(); }, 1500);
    return () => clearTimeout(timer);
  }, [fetchAlerts]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAllRead, markRead, refresh: fetchAlerts }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
