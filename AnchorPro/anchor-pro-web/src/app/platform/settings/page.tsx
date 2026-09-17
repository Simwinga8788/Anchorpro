'use client';

import { Save, Globe, Mail, RefreshCw, CheckCircle2, AlertTriangle, Loader2, Bot, X } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { settingsApi } from '@/lib/api';

// Hoisted to module scope — defining these inside the page component would give them a new
// identity on every render (e.g. every keystroke), causing React to unmount/remount every
// input on every change and drop focus/scroll position mid-typing.
const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button onClick={() => onChange(!value)} style={{
    width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
    background: value ? 'var(--accent-blue)' : 'rgba(255,255,255,0.1)',
    position: 'relative', transition: 'background 0.2s', flexShrink: 0,
  }}>
    <div style={{
      width: 18, height: 18, borderRadius: '50%', background: 'white',
      position: 'absolute', top: 3, left: value ? 21 : 3,
      transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    }} />
  </button>
);

const Field = ({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--border-subtle)' }}>
    <div style={{ flex: 1, paddingRight: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{sub}</div>}
    </div>
    {children}
  </div>
);

export default function PlatformSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [editingGeminiKey, setEditingGeminiKey] = useState(false);
  const [newGeminiKey, setNewGeminiKey] = useState('');
  const [editingSmtpPass, setEditingSmtpPass] = useState(false);
  const [newSmtpPass, setNewSmtpPass] = useState('');
  // Tracks whether the initial load actually succeeded — Save must never write settings.*
  // to the database while this is false, or it silently clobbers every real value with
  // the blank/default initial state (confirmed live: wiped Smtp_Host and Smtp_User).
  const [loadedOk, setLoadedOk] = useState(false);

  const [settings, setSettings] = useState({
    ownerEmail:            '',
    trialDays:             '14',
    emailNotifications:    true,
    allowSelfSignup:       true,
    smtpHost:              '',
    smtpPort:              '587',
    smtpUser:              '',
    smtpPass:              '',
    smtpFromName:          'Anchor Pro',
    smtpFromAddress:       '',
    geminiApiKey:          '',
  });

  const KEY_MAP: Record<string, string> = {
    ownerEmail:            'Platform.OwnerEmail',
    trialDays:             'Platform.TrialDays',
    // Reads/writes the same key Services/SmtpEmailService.cs actually checks before
    // sending — not a dead platform-only flag.
    emailNotifications:    'Email_Enabled',
    allowSelfSignup:       'Platform.AllowSelfSignup',
    // NOTE: these map to the underscore-named keys Services/SmtpEmailService.cs
    // actually reads at send time — NOT the old "Email.Smtp*" dot-named keys this
    // page used to write, which the email service never looked at (so SMTP could
    // never be configured through this page at all before this fix).
    smtpHost:              'Smtp_Host',
    smtpPort:              'Smtp_Port',
    smtpUser:              'Smtp_User',
    smtpPass:              'Smtp_Pass',
    smtpFromName:          'Email_From_Name',
    smtpFromAddress:       'Email_From_Address',
    geminiApiKey:          'Integration.Gemini.ApiKey',
  };

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const all = await settingsApi.getGlobal();
      if (Array.isArray(all)) {
        const get = (key: string, fallback: string) =>
          all.find((s: any) => s.key === key)?.value ?? fallback;
        setSettings(prev => ({
          ownerEmail:            get('Platform.OwnerEmail',           prev.ownerEmail),
          trialDays:             get('Platform.TrialDays',            prev.trialDays),
          emailNotifications:    get('Email_Enabled',                 'true')  === 'true',
          allowSelfSignup:       get('Platform.AllowSelfSignup',      'true')  === 'true',
          smtpHost:              get('Smtp_Host',                     prev.smtpHost),
          smtpPort:              get('Smtp_Port',                     prev.smtpPort),
          smtpUser:              get('Smtp_User',                     prev.smtpUser),
          smtpPass:              get('Smtp_Pass',                     prev.smtpPass),
          smtpFromName:          get('Email_From_Name',               prev.smtpFromName),
          smtpFromAddress:       get('Email_From_Address',            prev.smtpFromAddress),
          geminiApiKey:          get('Integration.Gemini.ApiKey',    get('Gemini.ApiKey', prev.geminiApiKey)),
        }));
        setLoadedOk(true);
      }
    } catch (e: any) {
      // Do NOT silently swallow this — Save must be blocked until a real load succeeds,
      // otherwise it writes the blank initial state over every already-configured value.
      setLoadedOk(false);
      setErr('Failed to load current settings (' + (e?.message || 'unknown error') + '). Saving is disabled until this succeeds — reload the page.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!loadedOk) {
      setErr('Cannot save: the current settings never finished loading, so saving now would overwrite real values with blanks. Reload the page and try again.');
      return;
    }
    setSaving(true); setErr(null);
    try {
      const finalSettings = { ...settings };
      // Auto-commit any pending Gemini key edit so they don't have to explicitly click "Set Key"
      if (editingGeminiKey && newGeminiKey) {
        finalSettings.geminiApiKey = newGeminiKey;
        setSettings(finalSettings);
        setEditingGeminiKey(false);
      }
      if (editingSmtpPass && newSmtpPass) {
        finalSettings.smtpPass = newSmtpPass;
        setSettings(finalSettings);
        setEditingSmtpPass(false);
      }

      const entries = Object.entries(finalSettings) as [string, any][];
      for (const [localKey, value] of entries) {
        const apiKey = KEY_MAP[localKey];
        if (apiKey) {
          await settingsApi.upsertGlobal(apiKey, String(value));
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setErr(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-default)',
    borderRadius: 6, padding: '7px 12px', fontSize: 13, color: 'var(--text-primary)',
    outline: 'none', fontFamily: 'inherit', width: 240,
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 10, color: 'var(--text-muted)' }}>
        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading platform settings...
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.5, marginBottom: 4 }}>Platform Settings</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Global configuration for the Anchor Pro SaaS platform — changes apply to all tenants</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={13} /> Reload
        </button>
      </div>

      {err && (
        <div style={{ padding: '10px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <AlertTriangle size={15} /> {err}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* General */}
        <div className="card" style={{ padding: '4px 24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 0 4px' }}>
            <Globe size={15} style={{ color: 'var(--accent-blue)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: 0.5 }}>General</span>
          </div>
          <Field label="Platform Owner Email" sub="Receives critical platform alerts and billing notifications">
            <input style={inputStyle} value={settings.ownerEmail} placeholder="platform@anchorpro.com"
              onChange={e => setSettings(s => ({ ...s, ownerEmail: e.target.value }))} />
          </Field>
          <Field label="Default Trial Period (days)" sub="Days given to new self-service sign-ups before billing starts">
            <input style={{ ...inputStyle, width: 100 }} type="number" value={settings.trialDays}
              onChange={e => setSettings(s => ({ ...s, trialDays: e.target.value }))} />
          </Field>
          <Field label="Allow Self-Signup" sub="Let companies register without a platform invitation — Platform Owner tenant creation always works regardless">
            <Toggle value={settings.allowSelfSignup} onChange={v => setSettings(s => ({ ...s, allowSelfSignup: v }))} />
          </Field>
        </div>

        {/* Email / SMTP */}
        <div className="card" style={{ padding: '4px 24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 0 4px' }}>
            <Mail size={15} style={{ color: 'var(--accent-violet)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-violet)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Email / SMTP</span>
          </div>
          <Field label="Email Notifications" sub="Enable outbound email from the platform">
            <Toggle value={settings.emailNotifications} onChange={v => setSettings(s => ({ ...s, emailNotifications: v }))} />
          </Field>
          <Field label="SMTP Host" sub="e.g. smtp.gmail.com or smtp.sendgrid.net">
            <input style={inputStyle} placeholder="smtp.example.com" value={settings.smtpHost}
              onChange={e => setSettings(s => ({ ...s, smtpHost: e.target.value }))} />
          </Field>
          <Field label="SMTP Port" sub="Usually 587 (TLS) or 465 (SSL)">
            <input style={{ ...inputStyle, width: 100 }} type="number" value={settings.smtpPort}
              onChange={e => setSettings(s => ({ ...s, smtpPort: e.target.value }))} />
          </Field>
          <Field label="SMTP Username" sub="Authentication username / API key">
            <input style={inputStyle} placeholder="apikey or user@example.com" value={settings.smtpUser}
              onChange={e => setSettings(s => ({ ...s, smtpUser: e.target.value }))} />
          </Field>
          <Field label="SMTP Password" sub="For Gmail, use a 16-character App Password, not the account password">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
              {settings.smtpPass && !editingSmtpPass ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ ...inputStyle, width: 240, fontFamily: 'monospace', fontSize: 13, letterSpacing: 3, color: 'var(--text-muted)', pointerEvents: 'none', userSelect: 'none' }}>
                    {'•'.repeat(16)}
                  </div>
                  <button
                    onClick={() => { setNewSmtpPass(''); setEditingSmtpPass(true); }}
                    style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', color: '#818cf8', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
                  >
                    Replace
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 11, width: 240 }}
                    type="password"
                    placeholder="Paste your App Password here…"
                    value={newSmtpPass}
                    onChange={e => setNewSmtpPass(e.target.value)}
                    autoComplete="off"
                  />
                  <button
                    onClick={() => { setSettings(s => ({ ...s, smtpPass: newSmtpPass })); setEditingSmtpPass(false); }}
                    disabled={!newSmtpPass}
                    style={{ background: newSmtpPass ? 'rgba(15,157,103,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${newSmtpPass ? 'rgba(15,157,103,0.4)' : 'var(--border-subtle)'}`, borderRadius: 6, padding: '6px 14px', cursor: newSmtpPass ? 'pointer' : 'default', color: newSmtpPass ? 'var(--accent-emerald, #10b981)' : 'var(--text-muted)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
                  >
                    Set
                  </button>
                  {settings.smtpPass && (
                    <button
                      onClick={() => setEditingSmtpPass(false)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 6 }}
                      title="Cancel"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}
              {settings.smtpPass && !editingSmtpPass && (
                <div style={{ fontSize: 11, color: 'var(--accent-emerald, #10b981)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CheckCircle2 size={11} /> SMTP password is configured
                </div>
              )}
            </div>
          </Field>
          <Field label="From Display Name" sub="Shown as the sender in outbound emails">
            <input style={inputStyle} value={settings.smtpFromName}
              onChange={e => setSettings(s => ({ ...s, smtpFromName: e.target.value }))} />
          </Field>
          <Field label="From Email Address" sub="The sender address recipients see">
            <input style={inputStyle} placeholder="no-reply@anchorpro.com" value={settings.smtpFromAddress}
              onChange={e => setSettings(s => ({ ...s, smtpFromAddress: e.target.value }))} />
          </Field>
        </div>

        {/* AI & Copilot */}
        <div className="card" style={{ padding: '4px 24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 0 4px' }}>
            <Bot size={15} style={{ color: 'var(--accent-cyan, #06b6d4)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-cyan, #06b6d4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>AI Copilot & Intelligence</span>
          </div>
          <Field label="Google Gemini API Key" sub="Powers multimodal voice processing and dynamic tool execution across all tenants">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
              {settings.geminiApiKey && !editingGeminiKey ? (
                /* Key is set — show masked indicator + Replace button (Stripe/GitHub pattern) */
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ ...inputStyle, width: 240, fontFamily: 'monospace', fontSize: 13, letterSpacing: 3, color: 'var(--text-muted)', pointerEvents: 'none', userSelect: 'none' }}>
                    {'•'.repeat(24)}
                  </div>
                  <button
                    onClick={() => { setNewGeminiKey(''); setEditingGeminiKey(true); }}
                    style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', color: '#818cf8', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
                  >
                    Replace Key
                  </button>
                </div>
              ) : (
                /* No key set, or user clicked Replace — show fresh empty input */
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 11, width: 240 }}
                    type="text"
                    placeholder="Paste your Gemini API key here…"
                    value={newGeminiKey}
                    onChange={e => setNewGeminiKey(e.target.value)}
                    autoComplete="off"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setSettings(s => ({ ...s, geminiApiKey: newGeminiKey }));
                      setEditingGeminiKey(false);
                    }}
                    disabled={!newGeminiKey}
                    style={{ background: newGeminiKey ? 'rgba(15,157,103,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${newGeminiKey ? 'rgba(15,157,103,0.4)' : 'var(--border-subtle)'}`, borderRadius: 6, padding: '6px 14px', cursor: newGeminiKey ? 'pointer' : 'default', color: newGeminiKey ? 'var(--accent-emerald, #10b981)' : 'var(--text-muted)', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
                  >
                    Set Key
                  </button>
                  {settings.geminiApiKey && (
                    <button
                      onClick={() => setEditingGeminiKey(false)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 6 }}
                      title="Cancel"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}
              {settings.geminiApiKey && !editingGeminiKey && (
                <div style={{ fontSize: 11, color: 'var(--accent-emerald, #10b981)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CheckCircle2 size={11} /> Gemini API key is configured
                </div>
              )}
            </div>
          </Field>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center' }}>
          {saved && (
            <div style={{ color: 'var(--accent-emerald, #10b981)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginRight: 10, animation: 'fadeIn 0.2s ease-out' }}>
              <CheckCircle2 size={15} /> Saved successfully!
            </div>
          )}
          <button className="btn btn-secondary" onClick={load} disabled={loading}>Discard Changes</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !loadedOk} title={!loadedOk ? 'Settings have not finished loading yet' : undefined} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Save size={13} /> Save Changes</>}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
