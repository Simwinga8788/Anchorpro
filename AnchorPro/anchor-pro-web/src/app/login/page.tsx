'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { getDefaultRoute } from '@/lib/rbac';
import { Lock, Mail, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function RegisteredBanner() {
  const params = useSearchParams();
  if (params.get('registered') !== '1') return null;
  return (
    <div className="alert alert-success">
      <CheckCircle2 size={14} /> Workspace created! Sign in to get started.
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await login(email, password);
    if (res.ok) {
      const dest = getDefaultRoute(res.user?.roles ?? [], res.user?.isPlatformOwner ?? false);
      router.push(dest);
    } else {
      setError(res.error || 'Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-page)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(77,158,255,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '44px', height: '44px',
            background: 'var(--accent-blue)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 24px rgba(77,158,255,0.35)',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700, fontSize: '20px', color: '#fff',
          }}>
            A
          </div>
          <h1 style={{
            fontFamily: "'Barlow Semi Condensed', sans-serif",
            fontSize: '22px', fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em', margin: 0,
          }}>
            Anchor Pro
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Operations Platform — Sign in to continue
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Suspense fallback={null}>
              <RegisteredBanner />
            </Suspense>

            {error && (
              <div className="alert alert-error">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <div className="input-group">
              <label className="form-label" htmlFor="email">Work Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{
                  position: 'absolute', left: '12px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="input-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="form-label" htmlFor="password" style={{ margin: 0 }}>Password</label>
                <a href="#" style={{ fontSize: '12px', color: 'var(--accent-blue)', textDecoration: 'none' }}>
                  Forgot password?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{
                  position: 'absolute', left: '12px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '4px', padding: '10px', fontSize: '14px' }}
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="spin" /> : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          No account yet?{' '}
          <Link href="/register" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 600 }}>
            Start free trial →
          </Link>
        </p>

        <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          © 2026 Anchor Pro · v1.3
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
