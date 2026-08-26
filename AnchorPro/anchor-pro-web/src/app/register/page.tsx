'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building2, User, Check, ChevronRight, Loader2, Eye, EyeOff, 
  ArrowLeft, AlertCircle, HardHat, ShieldCheck, FileSpreadsheet, Users
} from 'lucide-react';

interface ConstructionOrgData {
  companyName: string;
  contractorCategory: string;
  contractorGrade: string;
  standardContract: string;
  timezone: string;
}

interface AdminData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
}

const CONTRACTOR_CATEGORIES = [
  'General Building & Structural Civil',
  'Roads, Highways & Earthworks',
  'Mining Infrastructure & Concrete',
  'Commercial Fitout & Industrial Turnkey',
  'Mechanical, Electrical & Plumbing (MEP)'
];

const CONTRACTOR_GRADES = [
  'National Reg: Grade 1 (Unlimited / Large Scale)',
  'National Reg: Grade 2 ($5M - $20M)',
  'National Reg: Grade 3 ($1M - $5M)',
  'Regional Specialist Contractor',
  'Independent General Contractor'
];

const CONTRACT_STANDARDS = [
  'JBCC (Joint Building Contracts Committee - Standard)',
  'FIDIC Conditions of Contract (Red / Yellow Book)',
  'GCC (General Conditions of Contract for Civil Engineering)',
  'NEC4 Engineering and Construction Contract'
];

const TIMEZONES = [
  'Africa/Lusaka', 'Africa/Johannesburg', 'Africa/Harare', 'Africa/Nairobi',
  'Africa/Lagos', 'Europe/London', 'Asia/Dubai'
];

const STEPS = [
  { label: 'Contractor Profile', icon: Building2 },
  { label: 'Commercial Admin', icon: HardHat },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  const [org, setOrg] = useState<ConstructionOrgData>({
    companyName: '',
    contractorCategory: CONTRACTOR_CATEGORIES[0],
    contractorGrade: CONTRACTOR_GRADES[0],
    standardContract: CONTRACT_STANDARDS[0],
    timezone: 'Africa/Lusaka'
  });

  const [admin, setAdmin] = useState<AdminData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirm: ''
  });

  const step0Valid = org.companyName.trim().length >= 2;
  const step1Valid = !!admin.firstName.trim() && !!admin.lastName.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(admin.email) &&
    admin.password.length >= 8 &&
    admin.password === admin.confirm;

  const handleNext = () => {
    setError(null);
    if (step === 0 && !step0Valid) {
      setError('Please provide your construction company name.');
      return;
    }
    if (step === 1) {
      if (!step1Valid) {
        if (admin.password.length < 8) setError('Password must be at least 8 characters.');
        else if (admin.password !== admin.confirm) setError('Passwords do not match.');
        else setError('Please fill in all required account fields.');
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
          companyName: org.companyName,
          industry: 'Construction',
          size: org.contractorGrade,
          timezone: org.timezone,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          password: admin.password,
          planId: 1,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Registration failed (${res.status})`);
      }

      // Automatically sign in
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manNumber: admin.email, password: admin.password }),
      });

      router.push(loginRes.ok ? '/dashboard' : '/login?registered=1');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong during setup.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-page, #0f172a)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Barlow', sans-serif",
    }}>
      {/* Top Navigation */}
      <div style={{
        height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.1))', flexShrink: 0,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img
            src="/AnchorPro_logo.png"
            alt="Anchor Pro Logo"
            style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>
            Construction Operations Suite
          </span>
        </Link>
        <Link href="/login" style={{ fontSize: '14px', color: 'var(--text-secondary, #94a3b8)', textDecoration: 'none' }}>
          Have an existing site account? <span style={{ color: 'var(--accent-blue, #3b82f6)', fontWeight: 600 }}>Sign in</span>
        </Link>
      </div>

      {/* Main Registration Container */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '36px 20px' }}>
        <div style={{ width: '100%', maxWidth: '560px' }}>

          {/* Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px' }}>
            {STEPS.map((s, i) => {
              const state = i < step ? 'done' : i === step ? 'active' : 'idle';
              const Icon = s.icon;
              return (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 600,
                    background: state === 'done' ? '#10b981' : state === 'active' ? '#3b82f6' : 'rgba(255,255,255,0.08)',
                    color: state === 'idle' ? '#64748b' : '#fff',
                    boxShadow: state === 'active' ? '0 0 0 4px rgba(59,130,246,0.2)' : 'none',
                    transition: 'all 0.25s',
                  }}>
                    {state === 'done' ? <Check size={16} /> : <Icon size={16} />}
                  </div>
                  <span style={{
                    marginLeft: '10px', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap',
                    color: state === 'active' ? '#f8fafc' : state === 'done' ? '#10b981' : '#64748b',
                  }}>
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div style={{
                      flex: 1, height: '2px', margin: '0 14px',
                      background: state === 'done' ? '#10b981' : 'rgba(255,255,255,0.1)',
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Card */}
          <div className="card" style={{ padding: '32px', background: 'var(--bg-surface, #1e293b)', borderRadius: 12, border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))' }}>
            {error && (
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', 
                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', 
                borderRadius: 8, color: '#ef4444', marginBottom: 20, fontSize: 13 
              }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {/* STEP 0: Contractor Firm Profile */}
            {step === 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <HardHat size={20} style={{ color: '#3b82f6' }} />
                  <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary, #fff)' }}>
                    Set up Construction Company
                  </h2>
                </div>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted, #94a3b8)', marginBottom: '24px' }}>
                  Anchor Pro provides a unified single-company workspace for all your civil & building project sites.
                </p>

                <div className="input-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                    Construction Company Legal Name *
                  </label>
                  <input 
                    className="input-field" 
                    placeholder="e.g. Anchor Civil & Building Contractors Ltd"
                    value={org.companyName} 
                    onChange={e => setOrg({ ...org, companyName: e.target.value })} 
                    required
                  />
                </div>

                <div className="input-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                    Contractor Category / Sector
                  </label>
                  <select 
                    className="input-field" 
                    value={org.contractorCategory} 
                    onChange={e => setOrg({ ...org, contractorCategory: e.target.value })}
                  >
                    {CONTRACTOR_CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#1e293b' }}>{c}</option>)}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div className="input-group">
                    <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                      Contractor Grading / Capacity
                    </label>
                    <select 
                      className="input-field" 
                      value={org.contractorGrade} 
                      onChange={e => setOrg({ ...org, contractorGrade: e.target.value })}
                    >
                      {CONTRACTOR_GRADES.map(g => <option key={g} value={g} style={{ background: '#1e293b' }}>{g}</option>)}
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                      Timezone
                    </label>
                    <select 
                      className="input-field" 
                      value={org.timezone} 
                      onChange={e => setOrg({ ...org, timezone: e.target.value })}
                    >
                      {TIMEZONES.map(t => <option key={t} value={t} style={{ background: '#1e293b' }}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                    Standard Contract Standard (Commercial & IPC Valuation)
                  </label>
                  <select 
                    className="input-field" 
                    value={org.standardContract} 
                    onChange={e => setOrg({ ...org, standardContract: e.target.value })}
                  >
                    {CONTRACT_STANDARDS.map(cs => <option key={cs} value={cs} style={{ background: '#1e293b' }}>{cs}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleNext} 
                    disabled={!step0Valid} 
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    Next: Administrator Account <ChevronRight size={15} />
                  </button>
                </div>
              </>
            )}

            {/* STEP 1: Administrator Account */}
            {step === 1 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <ShieldCheck size={20} style={{ color: '#10b981' }} />
                  <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary, #fff)' }}>
                    Commercial Director / Admin Account
                  </h2>
                </div>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted, #94a3b8)', marginBottom: '24px' }}>
                  Creating primary credentials for <strong style={{ color: '#fff' }}>{org.companyName}</strong>.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div className="input-group">
                    <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>First Name *</label>
                    <input 
                      className="input-field" placeholder="Felix"
                      value={admin.firstName} onChange={e => setAdmin({ ...admin, firstName: e.target.value })} 
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Last Name *</label>
                    <input 
                      className="input-field" placeholder="Simwinga"
                      value={admin.lastName} onChange={e => setAdmin({ ...admin, lastName: e.target.value })} 
                      required
                    />
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Work Email (Username) *</label>
                  <input 
                    className="input-field" type="email" placeholder="director@anchorconstruction.com"
                    value={admin.email} onChange={e => setAdmin({ ...admin, email: e.target.value })} 
                    required
                  />
                </div>

                <div className="input-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      className="input-field" type={showPw ? 'text' : 'password'} placeholder="Min 8 characters"
                      value={admin.password} onChange={e => setAdmin({ ...admin, password: e.target.value })}
                      style={{ paddingRight: '40px' }} 
                      required
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)} style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer',
                    }}>
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label" style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Confirm Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      className="input-field" type={showCpw ? 'text' : 'password'} placeholder="Repeat password"
                      value={admin.confirm} onChange={e => setAdmin({ ...admin, confirm: e.target.value })}
                      style={{ paddingRight: '40px' }} 
                      required
                    />
                    <button type="button" onClick={() => setShowCpw(v => !v)} style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer',
                    }}>
                      {showCpw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <button className="btn btn-secondary" onClick={() => { setError(null); setStep(0); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button className="btn btn-primary" onClick={handleNext} disabled={!step1Valid || loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {loading ? (
                      <><Loader2 size={15} className="spin" /> Launching Construction Suite…</>
                    ) : (
                      <><Check size={15} /> Initialize Workspace</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-muted, #94a3b8)' }}>
            Empowering site & commercial alignment across all active projects.
          </div>
        </div>
      </div>
    </div>
  );
}
