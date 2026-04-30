'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, User, Check, ChevronRight, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────── */
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

/* ─── Main ─────────────────────────────────────────────── */
export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep]         = useState(0);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [showPw, setShowPw]     = useState(false);
  const [showCpw, setShowCpw]   = useState(false);

  const [org, setOrg]     = useState<OrgData>({ companyName: '', industry: '', size: '', timezone: 'Africa/Lusaka' });
  const [admin, setAdmin] = useState<AdminData>({ firstName: '', lastName: '', email: '', password: '', confirm: '' });

  /* validation */
  const step0Valid = org.companyName.trim().length >= 2 && org.industry && org.size;
  const step1Valid = admin.firstName.trim() && admin.lastName.trim() &&
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
          companyName: org.companyName,
          industry:    org.industry,
          size:        org.size,
          timezone:    org.timezone,
          firstName:   admin.firstName,
          lastName:    admin.lastName,
          email:       admin.email,
          password:    admin.password,
          planId:      1,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Registration failed (${res.status})`);
      }

      // Auto-login after register
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: admin.email, password: admin.password }),
      });

      if (loginRes.ok) {
        router.push('/dashboard');
      } else {
        // Registration succeeded but auto-login failed — send to login
        router.push('/login?registered=1');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="rp">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Lora:ital,wght@0,600;1,400&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --bg:#0A0A0B;--bg1:#111113;--bg2:#18181B;
          --line:rgba(255,255,255,0.08);--line2:rgba(255,255,255,0.14);
          --text:#EFEDE8;--sub:rgba(239,237,232,.52);--sub2:rgba(239,237,232,.3);
          --blue:#4B8FFF;--blue2:#6AA3FF;--green:#22C55E;--red:#F87171;
        }
        .rp{font-family:'Geist','Helvetica Neue',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;display:flex;flex-direction:column;-webkit-font-smoothing:antialiased}
        ::selection{background:rgba(75,143,255,.25)}

        /* TOPBAR */
        .rp-top{height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 32px;border-bottom:1px solid var(--line)}
        .rp-logo{display:flex;align-items:center;gap:9px;text-decoration:none}
        .rp-lmark{width:28px;height:28px;border-radius:7px;background:var(--blue);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#fff}
        .rp-lname{font-size:14px;font-weight:700;color:var(--text);letter-spacing:-.3px}
        .rp-login{font-size:13px;color:var(--sub);text-decoration:none;transition:color .15s}
        .rp-login:hover{color:var(--text)}

        /* BODY */
        .rp-body{flex:1;display:flex;align-items:center;justify-content:center;padding:40px 20px}
        .rp-card{width:100%;max-width:520px}

        /* STEPPER */
        .rp-stepper{display:flex;align-items:center;margin-bottom:40px;gap:0}
        .rp-step{display:flex;align-items:center;gap:9px;flex:1}
        .rp-step:last-child{flex:0}
        .rp-step-circle{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;flex-shrink:0;transition:all .25s}
        .rp-step-circle.done{background:var(--green);color:#fff}
        .rp-step-circle.active{background:var(--blue);color:#fff;box-shadow:0 0 0 4px rgba(75,143,255,.2)}
        .rp-step-circle.idle{background:var(--bg2);color:var(--sub2);border:1px solid var(--line)}
        .rp-step-lbl{font-size:12px;font-weight:500;white-space:nowrap;transition:color .25s}
        .rp-step-lbl.active{color:var(--text)}
        .rp-step-lbl.done{color:var(--green)}
        .rp-step-lbl.idle{color:var(--sub2)}
        .rp-step-line{flex:1;height:1px;background:var(--line);margin:0 10px;min-width:20px}
        .rp-step-line.done{background:var(--green)}

        /* FORM CARD */
        .rp-form-card{background:var(--bg1);border:1px solid var(--line);border-radius:16px;padding:36px}

        .rp-title{font-family:'Lora',serif;font-size:26px;font-weight:600;letter-spacing:-.5px;color:var(--text);margin-bottom:6px}
        .rp-subtitle{font-size:14px;font-weight:300;color:var(--sub);margin-bottom:28px;line-height:1.6}

        .rp-field{display:flex;flex-direction:column;gap:7px;margin-bottom:18px}
        .rp-label{font-size:12px;font-weight:600;color:var(--sub);letter-spacing:.3px;text-transform:uppercase}
        .rp-input{width:100%;padding:11px 14px;background:var(--bg);border:1px solid var(--line2);border-radius:8px;color:var(--text);font-size:14px;font-family:'Geist',sans-serif;transition:all .15s;outline:none}
        .rp-input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(75,143,255,.12)}
        .rp-input::placeholder{color:var(--sub2)}
        .rp-select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center}
        .rp-pw-wrap{position:relative}
        .rp-pw-wrap .rp-input{padding-right:42px}
        .rp-pw-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--sub);cursor:pointer;display:flex;padding:2px}
        .rp-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .rp-hint{font-size:11.5px;color:var(--sub2);margin-top:4px}
        .rp-hint.ok{color:var(--green)}

        /* ERROR */
        .rp-error{background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.25);border-radius:8px;padding:12px 14px;font-size:13px;color:var(--red);margin-bottom:18px;display:flex;align-items:center;gap:8px}

        /* BUTTONS */
        .rp-actions{display:flex;align-items:center;justify-content:space-between;margin-top:8px;gap:10px}
        .rp-btn-back{display:flex;align-items:center;gap:6px;padding:11px 20px;border-radius:8px;background:transparent;border:1px solid var(--line2);color:var(--sub);font-size:14px;font-weight:500;cursor:pointer;font-family:'Geist',sans-serif;transition:all .15s}
        .rp-btn-back:hover{border-color:rgba(255,255,255,.24);color:var(--text)}
        .rp-btn-next{display:flex;align-items:center;gap:8px;padding:11px 28px;border-radius:8px;background:var(--blue);color:#fff;font-size:14px;font-weight:600;border:none;cursor:pointer;font-family:'Geist',sans-serif;transition:all .15s;margin-left:auto}
        .rp-btn-next:hover:not(:disabled){background:#3a7ef0;transform:translateY(-1px);box-shadow:0 6px 18px rgba(75,143,255,.28)}
        .rp-btn-next:disabled{opacity:.45;cursor:not-allowed}
        .rp-btn-submit{display:flex;align-items:center;gap:8px;padding:11px 28px;border-radius:8px;background:var(--green);color:#fff;font-size:14px;font-weight:600;border:none;cursor:pointer;font-family:'Geist',sans-serif;transition:all .15s;margin-left:auto}
        .rp-btn-submit:hover:not(:disabled){background:#16a34a;transform:translateY(-1px)}
        .rp-btn-submit:disabled{opacity:.45;cursor:not-allowed}

        /* PLAN CARDS */
        .rp-plans{display:flex;flex-direction:column;gap:10px;margin-bottom:6px}
        .rp-plan-opt{display:flex;align-items:flex-start;gap:14px;padding:16px;border-radius:10px;border:1.5px solid var(--line);background:var(--bg);cursor:pointer;transition:all .18s;position:relative}
        .rp-plan-opt.sel{border-color:var(--blue);background:rgba(75,143,255,.06)}
        .rp-plan-opt:hover:not(.sel){border-color:var(--line2);background:var(--bg2)}
        .rp-plan-radio{width:18px;height:18px;border-radius:50%;border:2px solid var(--line2);flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center;transition:all .15s}
        .rp-plan-opt.sel .rp-plan-radio{border-color:var(--blue);background:var(--blue)}
        .rp-plan-dot{width:8px;height:8px;border-radius:50%;background:#fff;display:none}
        .rp-plan-opt.sel .rp-plan-dot{display:block}
        .rp-plan-info{flex:1}
        .rp-plan-row{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:4px}
        .rp-plan-nm{font-size:14px;font-weight:600;color:var(--text)}
        .rp-plan-pr{font-size:16px;font-weight:700;color:var(--text);font-family:'Lora',serif;letter-spacing:-.5px}
        .rp-plan-pr span{font-size:12px;font-weight:300;font-family:'Geist',sans-serif;color:var(--sub)}
        .rp-plan-ds{font-size:12px;color:var(--sub2);margin-bottom:6px}
        .rp-plan-feats{display:flex;flex-wrap:wrap;gap:4px}
        .rp-plan-feat{font-size:11px;color:var(--sub);background:var(--bg2);border:1px solid var(--line);border-radius:4px;padding:2px 7px}
        .rp-popular-badge{position:absolute;top:-1px;right:14px;background:var(--blue);color:#fff;font-size:9px;font-weight:700;padding:2px 10px;border-radius:0 0 6px 6px;letter-spacing:.5px;text-transform:uppercase}

        /* TRIAL NOTE */
        .rp-trial-note{text-align:center;font-size:12px;color:var(--sub2);margin-top:18px}
        .rp-trial-note a{color:var(--blue);text-decoration:none}

        @keyframes spin{to{transform:rotate(360deg)}}
        .spin{animation:spin .9s linear infinite}

        @media(max-width:600px){
          .rp-card{max-width:100%}
          .rp-form-card{padding:24px 18px}
          .rp-row{grid-template-columns:1fr}
          .rp-stepper{gap:0}
          .rp-step-lbl{display:none}
        }
      `}</style>

      {/* TOP BAR */}
      <div className="rp-top">
        <Link href="/" className="rp-logo">
          <div className="rp-lmark">A</div>
          <span className="rp-lname">Anchor Pro</span>
        </Link>
        <Link href="/login" className="rp-login">Already have an account? Sign in</Link>
      </div>

      {/* BODY */}
      <div className="rp-body">
        <div className="rp-card">
          {/* Stepper */}
          <div className="rp-stepper">
            {STEPS.map((s, i) => {
              const state = i < step ? 'done' : i === step ? 'active' : 'idle';
              return (
                <div key={s.label} className="rp-step" style={{flex: i < STEPS.length - 1 ? 1 : 0}}>
                  <div className={`rp-step-circle ${state}`}>
                    {state === 'done'
                      ? <Check size={14}/>
                      : <s.icon size={14}/>
                    }
                  </div>
                  <span className={`rp-step-lbl ${state}`}>{s.label}</span>
                  {i < STEPS.length - 1 && <div className={`rp-step-line${state==='done'?' done':''}`}/>}
                </div>
              );
            })}
          </div>

          {/* Form card */}
          <div className="rp-form-card">
            {error && (
              <div className="rp-error">
                <span>⚠</span> {error}
              </div>
            )}

            {/* ── STEP 0: Organisation ── */}
            {step === 0 && (
              <>
                <h2 className="rp-title">Set up your workspace</h2>
                <p className="rp-subtitle">Tell us about your organisation. You can change these details later.</p>

                <div className="rp-field">
                  <label className="rp-label">Company name *</label>
                  <input className="rp-input" placeholder="e.g. Acme Operations Ltd" value={org.companyName}
                    onChange={e=>setOrg({...org,companyName:e.target.value})}/>
                </div>

                <div className="rp-row">
                  <div className="rp-field">
                    <label className="rp-label">Industry *</label>
                    <select className="rp-input rp-select" value={org.industry} onChange={e=>setOrg({...org,industry:e.target.value})}>
                      <option value="">Select industry</option>
                      {INDUSTRIES.map(i=><option key={i}>{i}</option>)}
                    </select>
                  </div>
                  <div className="rp-field">
                    <label className="rp-label">Team size *</label>
                    <select className="rp-input rp-select" value={org.size} onChange={e=>setOrg({...org,size:e.target.value})}>
                      <option value="">Select size</option>
                      {SIZES.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="rp-field">
                  <label className="rp-label">Timezone</label>
                  <select className="rp-input rp-select" value={org.timezone} onChange={e=>setOrg({...org,timezone:e.target.value})}>
                    {TIMEZONES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>

                <div className="rp-actions">
                  <button className="rp-btn-next" onClick={handleNext} disabled={!step0Valid}>
                    Continue <ChevronRight size={15}/>
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 1: Admin account ── */}
            {step === 1 && (
              <>
                <h2 className="rp-title">Create your admin account</h2>
                <p className="rp-subtitle">This will be the primary administrator for <strong style={{color:'var(--text)',fontWeight:600}}>{org.companyName}</strong>.</p>

                <div className="rp-row">
                  <div className="rp-field">
                    <label className="rp-label">First name *</label>
                    <input className="rp-input" placeholder="Felix" value={admin.firstName}
                      onChange={e=>setAdmin({...admin,firstName:e.target.value})}/>
                  </div>
                  <div className="rp-field">
                    <label className="rp-label">Last name *</label>
                    <input className="rp-input" placeholder="Simwinga" value={admin.lastName}
                      onChange={e=>setAdmin({...admin,lastName:e.target.value})}/>
                  </div>
                </div>

                <div className="rp-field">
                  <label className="rp-label">Work email *</label>
                  <input className="rp-input" type="email" placeholder="felix@company.com" value={admin.email}
                    onChange={e=>setAdmin({...admin,email:e.target.value})}/>
                </div>

                <div className="rp-field">
                  <label className="rp-label">Password *</label>
                  <div className="rp-pw-wrap">
                    <input className="rp-input" type={showPw?'text':'password'} placeholder="Min 8 characters" value={admin.password}
                      onChange={e=>setAdmin({...admin,password:e.target.value})}/>
                    <button type="button" className="rp-pw-eye" onClick={()=>setShowPw(v=>!v)}>
                      {showPw?<EyeOff size={15}/>:<Eye size={15}/>}
                    </button>
                  </div>
                  {admin.password.length > 0 && (
                    <div className={`rp-hint${admin.password.length>=8?' ok':''}`}>
                      {admin.password.length>=8?'✓ Strong enough':'Needs at least 8 characters'}
                    </div>
                  )}
                </div>

                <div className="rp-field">
                  <label className="rp-label">Confirm password *</label>
                  <div className="rp-pw-wrap">
                    <input className="rp-input" type={showCpw?'text':'password'} placeholder="Repeat password" value={admin.confirm}
                      onChange={e=>setAdmin({...admin,confirm:e.target.value})}/>
                    <button type="button" className="rp-pw-eye" onClick={()=>setShowCpw(v=>!v)}>
                      {showCpw?<EyeOff size={15}/>:<Eye size={15}/>}
                    </button>
                  </div>
                  {admin.confirm.length > 0 && (
                    <div className={`rp-hint${admin.password===admin.confirm?' ok':''}`}>
                      {admin.password===admin.confirm?'✓ Passwords match':"Passwords don't match"}
                    </div>
                  )}
                </div>

                <div className="rp-actions">
                  <button className="rp-btn-back" onClick={()=>{setError(null);setStep(0);}}>
                    <ArrowLeft size={14}/> Back
                  </button>
                  <button className="rp-btn-submit" onClick={handleNext} disabled={!step1Valid || loading}>
                    {loading
                      ? <><Loader2 size={15} className="spin"/> Creating workspace…</>
                      : <><Check size={15}/> Create workspace</>
                    }
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
