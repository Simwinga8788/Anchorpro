'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, User, Check, ChevronRight, Loader2, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';

interface OrgData   { companyName: string; industry: string; size: string; timezone: string }
interface AdminData { firstName: string; lastName: string; email: string; password: string; confirm: string }

const INDUSTRIES = [
  'Mining & Extraction', 'Manufacturing', 'Facilities Management', 'Logistics & Fleet',
  'Construction', 'Utilities & Energy', 'Healthcare & Medical', 'Agriculture', 'Other',
];
const SIZES = ['1–10 employees', '11–50 employees', '51–200 employees', '201–500 employees', '500+ employees'];
const TIMEZONES = [
  'Africa/Lusaka', 'Africa/Johannesburg', 'Africa/Nairobi', 'Africa/Lagos',
  'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Chicago', 'Asia/Dubai',
];
const STEPS = [
  { label: 'Organisation', icon: Building2 },
  { label: 'Your account', icon: User },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep]       = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [showPw, setShowPw]   = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  const [org, setOrg]     = useState<OrgData>({ companyName: '', industry: '', size: '', timezone: 'Africa/Lusaka' });
  const [admin, setAdmin] = useState<AdminData>({ firstName: '', lastName: '', email: '', password: '', confirm: '' });

  const step0Valid = org.companyName.trim().length >= 2 && !!org.industry && !!org.size;
  const step1Valid = !!admin.firstName.trim() && !!admin.lastName.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(admin.email) &&
    admin.password.length >= 8 &&
    admin.password === admin.confirm;

  const handleNext = () => {
    setError(null);
    if (step === 0 && !step0Valid) { setError('Please fill in all organisation fields.'); return; }
    if (step === 1) {
      if (!step1Valid) {
        if (admin.password.length < 8) setError('Password must be at least 8 characters.');
        else if (admin.password !== admin.confirm) setError('Passwords do not match.');
        else setError('Please fill in all fields.');
        return;
      }
      handleSubmit();
      return;
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: org.companyName, industry: org.industry, size: org.size, timezone: org.timezone,
          firstName: admin.firstName, lastName: admin.lastName, email: admin.email, password: admin.password, planId: 1,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Registration failed (${res.status})`);
      }
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: admin.email, password: admin.password }),
      });
      router.push(loginRes.ok ? '/dashboard' : '/login?registered=1');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-page)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Barlow', sans-serif",
    }}>
      {/* Top bar */}
      <div style={{
        height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none' }}>
          <div style={{
            width: '28px', height: '28px', background: 'var(--accent-blue)', borderRadius: '7px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', color: '#fff',
            boxShadow: '0 0 12px rgba(77,158,255,0.3)',
          }}>A</div>
          <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Anchor Pro
          </span>
        </Link>
        <Link href="/login" style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
          Already have an account? <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>Sign in</span>
        </Link>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: '520px' }}>

          {/* Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '36px' }}>
            {STEPS.map((s, i) => {
              const state = i < step ? 'done' : i === step ? 'active' : 'idle';
              const Icon = s.icon;
              return (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 600,
                    background: state === 'done' ? 'var(--accent-emerald)' : state === 'active' ? 'var(--accent-blue)' : 'var(--bg-elevated)',
                    color: state === 'idle' ? 'var(--text-muted)' : '#fff',
                    border: state === 'idle' ? '1px solid var(--border-default)' : 'none',
                    boxShadow: state === 'active' ? '0 0 0 4px rgba(77,158,255,0.15)' : 'none',
                    transition: 'all 0.25s',
                  }}>
                    {state === 'done' ? <Check size={14} /> : <Icon size={14} />}
                  </div>
                  <span style={{
                    marginLeft: '9px', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap',
                    color: state === 'active' ? 'var(--text-primary)' : state === 'done' ? 'var(--accent-emerald)' : 'var(--text-muted)',
                    transition: 'color 0.25s',
                  }}>
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div style={{
                      flex: 1, height: '1px', margin: '0 12px',
                      background: state === 'done' ? 'var(--accent-emerald)' : 'var(--border-default)',
                      transition: 'background 0.25s',
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Form card */}
          <div className="card" style={{ padding: '32px' }}>
            {error && (
              <div className="alert alert-error" style={{ marginBottom: '20px' }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            {step === 0 && (
              <>
                <h2 style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                  Set up your workspace
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '28px', lineHeight: 1.6 }}>
                  Tell us about your organisation. You can change these details later.
                </p>

                <div className="input-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Company name *</label>
                  <input className="form-input" placeholder="e.g. Acme Operations Ltd"
                    value={org.companyName} onChange={e => setOrg({ ...org, companyName: e.target.value })} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div className="input-group">
                    <label className="form-label">Industry *</label>
                    <select className="form-select" value={org.industry} onChange={e => setOrg({ ...org, industry: e.target.value })}>
                      <option value="">Select industry</option>
                      {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="form-label">Team size *</label>
                    <select className="form-select" value={org.size} onChange={e => setOrg({ ...org, size: e.target.value })}>
                      <option value="">Select size</option>
                      {SIZES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Timezone</label>
                  <select className="form-select" value={org.timezone} onChange={e => setOrg({ ...org, timezone: e.target.value })}>
                    {TIMEZONES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={handleNext} disabled={!step0Valid} style={{ gap: '7px' }}>
                    Continue <ChevronRight size={15} />
                  </button>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                  Create your admin account
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '28px', lineHeight: 1.6 }}>
                  Primary administrator for <strong style={{ color: 'var(--text-primary)' }}>{org.companyName}</strong>.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div className="input-group">
                    <label className="form-label">First name *</label>
                    <input className="form-input" placeholder="Felix"
                      value={admin.firstName} onChange={e => setAdmin({ ...admin, firstName: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label className="form-label">Last name *</label>
                    <input className="form-input" placeholder="Simwinga"
                      value={admin.lastName} onChange={e => setAdmin({ ...admin, lastName: e.target.value })} />
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Work email *</label>
                  <input className="form-input" type="email" placeholder="you@company.com"
                    value={admin.email} onChange={e => setAdmin({ ...admin, email: e.target.value })} />
                </div>

                <div className="input-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input className="form-input" type={showPw ? 'text' : 'password'} placeholder="Min 8 characters"
                      value={admin.password} onChange={e => setAdmin({ ...admin, password: e.target.value })}
                      style={{ paddingRight: '40px' }} />
                    <button type="button" onClick={() => setShowPw(v => !v)} style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px',
                    }}>
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {admin.password.length > 0 && (
                    <div style={{ fontSize: '11.5px', marginTop: '4px', color: admin.password.length >= 8 ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                      {admin.password.length >= 8 ? '✓ Strong enough' : 'Needs at least 8 characters'}
                    </div>
                  )}
                </div>

                <div className="input-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Confirm password *</label>
                  <div style={{ position: 'relative' }}>
                    <input className="form-input" type={showCpw ? 'text' : 'password'} placeholder="Repeat password"
                      value={admin.confirm} onChange={e => setAdmin({ ...admin, confirm: e.target.value })}
                      style={{ paddingRight: '40px' }} />
                    <button type="button" onClick={() => setShowCpw(v => !v)} style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px',
                    }}>
                      {showCpw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {admin.confirm.length > 0 && (
                    <div style={{ fontSize: '11.5px', marginTop: '4px', color: admin.password === admin.confirm ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                      {admin.password === admin.confirm ? '✓ Passwords match' : "Passwords don't match"}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <button className="btn btn-secondary" onClick={() => { setError(null); setStep(0); }}>
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button className="btn btn-success" onClick={handleNext} disabled={!step1Valid || loading}>
                    {loading
                      ? <><Loader2 size={15} className="spin" /> Creating workspace…</>
                      : <><Check size={15} /> Create workspace</>
                    }
                  </button>
                </div>
              </>
            )}
          </div>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
            By creating an account you agree to our{' '}
            <a href="#" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>Terms of Service</a>
            {' '}and{' '}
            <a href="#" style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
