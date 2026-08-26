'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { authApi } from '@/lib/api';

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const email = params.get('email') ?? '';
  const token = params.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const missingLink = !email || !token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authApi.resetPassword({ email, token, newPassword });
      setDone(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err?.message || 'Could not reset password. The link may have expired — request a new one.');
    } finally {
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
      <div style={{
        position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(77,158,255,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img
            src="/AnchorPro_logo.png"
            alt="Anchor Pro Logo"
            style={{ height: '125px', width: 'auto', objectFit: 'contain', margin: '0 auto' }}
          />
        </div>

        <div className="card" style={{ padding: '32px' }}>
          {missingLink ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
              <AlertCircle size={32} style={{ color: 'var(--accent-red, #ef4444)', margin: '0 auto' }} />
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Invalid reset link</h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  This link is missing or malformed. Request a new one from the sign-in page.
                </p>
              </div>
              <Link href="/forgot-password" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                Request new link
              </Link>
            </div>
          ) : done ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
              <CheckCircle2 size={32} style={{ color: 'var(--accent-green, #22c55e)', margin: '0 auto' }} />
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Password updated</h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Redirecting you to sign in&hellip;
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>Choose a new password</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Resetting password for <strong>{email}</strong>
                </p>
              </div>

              {error && (
                <div className="alert alert-error">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <div className="input-group">
                <label className="form-label" htmlFor="newPassword">New password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{
                    position: 'absolute', left: '12px', top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
                  }} />
                  <input
                    id="newPassword"
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="form-label" htmlFor="confirmPassword">Confirm new password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{
                    position: 'absolute', left: '12px', top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
                  }} />
                  <input
                    id="confirmPassword"
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '4px', padding: '10px', fontSize: '15px' }}
                disabled={loading}
              >
                {loading ? <Loader2 size={16} className="spin" /> : 'Reset password'}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          <Link href="/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
