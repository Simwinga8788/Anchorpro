'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { Shield, Lock, User, Terminal, Loader2 } from 'lucide-react';

export default function LoginPage() {
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
      router.push('/dashboard');
    } else {
      setError(res.error || 'Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Shield size={32} />
          </div>
          <h1>Anchor Pro</h1>
          <p>Maintenance Operations Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
              <Lock size={14} /> {error}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">Work Email</label>
            <div className="input-wrapper">
              <User size={16} className="input-icon" />
              <input
                id="email"
                type="email"
                placeholder="admin@anchor.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Security Credentials</label>
            <div className="input-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <Loader2 className="spin" size={18} />
            ) : (
              'Access Dashboard'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>© 2026 Anchor Pro — Secure Terminal</p>
          <div className="footer-links">
            <Terminal size={12} /> <span>v1.3.2 Production</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: #0f172a;
          /* Premium Radial Gradient */
          background: radial-gradient(circle at top right, #1e293b 0%, #0f172a 100%);
          padding: 20px;
          color: #fff;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-logo {
          width: 64px;
          height: 64px;
          background: #3b82f6;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
        }

        h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.5px;
        }

        p {
          color: #94a3b8;
          font-size: 14px;
          margin: 4px 0 0;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .login-error {
          padding: 12px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 6px;
          color: #ef4444;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        label {
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
        }

        input {
          width: 100%;
          padding: 12px 12px 12px 40px;
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 6px;
          color: #fff;
          font-size: 14px;
          transition: all 0.2s;
        }

        input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .login-button {
          margin-top: 8px;
          padding: 12px;
          background: #3b82f6;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-button:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .login-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .login-footer {
          margin-top: 32px;
          text-align: center;
          border-top: 1px solid #334155;
          padding-top: 24px;
        }

        .login-footer p {
          font-size: 12px;
        }

        .footer-links {
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 10px;
          color: #475569;
          font-family: 'JetBrains Mono', monospace;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
