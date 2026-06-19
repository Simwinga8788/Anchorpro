'use client';

import { Bell, Search, ChevronDown, Sun, Moon, Menu, Check, RefreshCw, LogOut, Settings } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/lib/ThemeContext';
import { useNotifications } from '@/lib/NotificationsContext';
import { useAuth } from '@/lib/AuthContext';
import { useDictionary } from '@/lib/DictionaryContext';
import { adminAccessApi } from '@/lib/api';

interface TopbarProps {
  title: string;
  breadcrumb?: string;
  onMenuToggle?: () => void;
}

const notifDotColor: Record<string, string> = {
  error:   'var(--accent-rose)',
  warning: 'var(--accent-amber)',
  success: 'var(--accent-emerald)',
  info:    'var(--accent-blue)',
};

export default function Topbar({ title, breadcrumb, onMenuToggle }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAllRead, markRead, refresh: refreshNotifs } = useNotifications();
  const { user, logout, isPlatformOwner } = useAuth();
  const { t, workspaceName } = useDictionary();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [tenants, setTenants] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Load tenants for platform owner workspace switcher
  useEffect(() => {
    if (isPlatformOwner) {
      adminAccessApi.getTenants()
        .then(res => setTenants(Array.isArray(res) ? res : []))
        .catch(() => {});
    }
  }, [isPlatformOwner]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (workspaceRef.current && !workspaceRef.current.contains(e.target as Node)) {
        setWorkspaceMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'User'
    : 'User';
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const displayBreadcrumb = workspaceName || 'Anchor Pro';

  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Hamburger — visible on mobile only */}
        <button
          className="topbar-hamburger"
          onClick={onMenuToggle}
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>

        <div ref={workspaceRef} style={{ position: 'relative', minWidth: 0, flex: 1 }}>
          {displayBreadcrumb && (
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: isPlatformOwner ? 'pointer' : 'default' }}
              onClick={() => isPlatformOwner && setWorkspaceMenuOpen(prev => !prev)}
            >
              <div className="topbar-breadcrumb">{displayBreadcrumb}</div>
              {isPlatformOwner && <ChevronDown size={12} style={{ color: 'var(--text-muted)', marginTop: -1 }} />}
            </div>
          )}
          
          {workspaceMenuOpen && isPlatformOwner && tenants.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0,
              width: 240, background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.24)',
              zIndex: 350, overflow: 'hidden',
              marginTop: 4,
            }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Switch Workspace
              </div>
              <div style={{ maxHeight: 250, overflowY: 'auto', padding: 4 }}>
                {tenants.map(t => {
                  const tName = t.name ?? t.companyName;
                  const isCurrent = tName === workspaceName;
                  return (
                    <button
                      key={t.id}
                      className="btn btn-ghost btn-sm"
                      style={{
                        width: '100%', justifyContent: 'flex-start', padding: '7px 10px', gap: 8,
                        fontSize: 13, color: 'var(--text-primary)', fontWeight: 500,
                        textAlign: 'left', display: 'flex', alignItems: 'center',
                      }}
                      onClick={async () => {
                        setWorkspaceMenuOpen(false);
                        try {
                          await adminAccessApi.impersonate(t.id);
                          window.location.href = '/dashboard';
                        } catch (e) {
                          alert('Failed to switch workspace');
                        }
                      }}
                    >
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: isCurrent ? 'var(--accent-blue)' : 'transparent',
                        border: isCurrent ? 'none' : '1px solid var(--border-default)',
                        flexShrink: 0,
                      }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Search */}
        <div className="topbar-search-wrap" style={{ position: 'relative' }}>
          <Search size={13} style={{
            position: 'absolute', left: '10px', top: '50%',
            transform: 'translateY(-50%)', color: 'var(--text-muted)'
          }} />
          <input
            className="search-input"
            placeholder={`Search Job #, ${t('Equipment', 'Equipment')}...`}
            style={{ paddingLeft: '30px', width: '180px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') alert(`Searching for "${e.currentTarget.value}" across ${t('Equipment', 'Equipment')} Registry and Job Cards...`);
            }}
          />
        </div>

        {/* Dark / Light toggle */}
        <button
          className="btn btn-ghost btn-sm"
          style={{ padding: '7px' }}
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost btn-sm"
            style={{ position: 'relative', padding: '7px' }}
            onClick={() => setNotifOpen(prev => !prev)}
            aria-label="Notifications"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '4px', right: '4px',
                width: unreadCount > 9 ? '14px' : '8px',
                height: unreadCount > 9 ? '14px' : '8px',
                borderRadius: '50%',
                background: 'var(--accent-rose)',
                border: '1.5px solid var(--bg-primary)',
                fontSize: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
              }}>
                {unreadCount > 9 ? '9+' : (unreadCount > 1 ? unreadCount : '')}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="notif-drawer">
              <div className="notif-header">
                <span className="notif-title">
                  Notifications
                  {unreadCount > 0 && (
                    <span style={{
                      marginLeft: 8, fontSize: 11, fontWeight: 500,
                      background: 'var(--accent-rose-dim)', color: 'var(--accent-rose)',
                      padding: '1px 6px', borderRadius: 10,
                    }}>
                      {unreadCount} new
                    </span>
                  )}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 6px' }}
                    onClick={refreshNotifs}
                    title="Refresh alerts"
                  >
                    <RefreshCw size={11} />
                  </button>
                  {unreadCount > 0 && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 11, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                      onClick={markAllRead}
                    >
                      <Check size={11} /> Mark all read
                    </button>
                  )}
                </div>
              </div>

              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty">No notifications</div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`notif-item ${!n.read ? 'unread' : ''}`}
                      onClick={() => markRead(n.id)}
                    >
                      <span
                        className="notif-dot"
                        style={{ background: !n.read ? notifDotColor[n.type] : 'var(--border-default)' }}
                      />
                      <div className="notif-content">
                        <div className="notif-item-title">{n.title}</div>
                        <div className="notif-item-msg">{n.message}</div>
                        <div className="notif-item-time">{n.time}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div ref={userRef} style={{ position: 'relative' }}>
          <button
            className="user-chip"
            onClick={() => setUserMenuOpen(prev => !prev)}
          >
            <div className="avatar" style={{ width: '24px', height: '24px', fontSize: '10px' }}>{initials}</div>
            <span className="user-chip-name" style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
              {displayName}
            </span>
            <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
          </button>

          {userMenuOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0,
              width: 200, background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.24)',
              zIndex: 300, overflow: 'hidden',
              animation: 'fadeInUp 0.15s ease forwards',
            }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{displayName}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
                {user?.roles?.[0] && (
                  <span style={{ marginTop: 6, display: 'inline-block', fontSize: 10, padding: '2px 7px', background: 'var(--accent-blue-dim)', color: 'var(--accent-blue)', borderRadius: 4, fontWeight: 500 }}>
                    {user.roles[0]}
                  </span>
                )}
              </div>
              <div style={{ padding: 6 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', padding: '7px 10px', gap: 8 }}
                  onClick={() => { setUserMenuOpen(false); window.location.href = '/dashboard/settings'; }}
                >
                  <Settings size={13} /> Settings
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', padding: '7px 10px', gap: 8, color: 'var(--accent-rose)' }}
                  onClick={() => { setUserMenuOpen(false); logout(); }}
                >
                  <LogOut size={13} /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
