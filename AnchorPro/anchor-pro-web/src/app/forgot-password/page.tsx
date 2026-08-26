'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
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
          {sent ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
              <CheckCircle2 size={32} style={{ color: 'var(--accent-green, #22c55e)', margin: '0 auto' }} />
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Check your email</h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset your password.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>Forgot your password?</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Enter the email address on your account and we&apos;ll send you a link to reset it.
                </p>
              </div>

              {error && (
                <div className="alert alert-error">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <div className="input-group">
                <label className="form-label" htmlFor="email">Email</label>
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

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '4px', padding: '10px', fontSize: '15px' }}
                disabled={loading}
              >
                {loading ? <Loader2 size={16} className="spin" /> : 'Send reset link'}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          <Link href="/login" style={{ color: 'var(--accent-blue)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
