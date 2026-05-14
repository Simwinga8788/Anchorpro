'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

const API_BASE = '';

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  tenantId?: number;
  isPlatformOwner: boolean;
}

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; user?: UserProfile; error?: string }>;
  logout: () => Promise<void>;
  hasRole: (...roles: string[]) => boolean;
  isAdmin: boolean;
  isTechnician: boolean;
  isPlanner: boolean;
  isPlatformOwner: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, try to fetch current user from the C# backend session
  useEffect(() => {
    fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        return { ok: false, error: err.message ?? 'Login failed' };
      }
      const data: UserProfile = await res.json();
      setUser(data);
      return { ok: true, user: data };
    } catch {
      return { ok: false, error: 'Cannot reach server' };
    }
  };

  const logout = async () => {
    await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    setUser(null);
  };

  const hasRole = (...roles: string[]) =>
    roles.some(r => user?.roles?.includes(r));

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      hasRole,
      isAdmin:         hasRole('Admin'),
      isTechnician:    hasRole('Technician'),
      isPlanner:       hasRole('Planner', 'Supervisor'),
      isPlatformOwner: user?.isPlatformOwner ?? false,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
