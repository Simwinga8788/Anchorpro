'use client';

import { Save, Globe, Mail, Shield, Database, RefreshCw, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { settingsApi } from '@/lib/api';

export default function PlatformSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    platformName:          'Anchor Pro',
    supportEmail:          'support@anchorpro.co.zm',
    trialDays:             '14',
    maxTenantsPerNode:     '100',
    defaultPlanId:         '1',
    maintenanceMode:       false,
    emailNotifications:    true,
    allowSelfSignup:       true,
    requireEmailVerify:    false,
    sessionTimeout:        '60',
    failedLoginLimit:      '5',
    jwtExpiryHours:        '24',
    smtpHost:              '',
    smtpPort:              '587',
    smtpUser:              '',
    smtpFromName:          'Anchor Pro',
    stripePublicKey:       '',
    stripeWebhookSecret:   '',
  });

  const KEY_MAP: Record<string, string> = {
    platformName:          'Platform.Name',
    supportEmail:          'Platform.SupportEmail',
    trialDays:             'Platform.TrialDays',
    maxTenantsPerNode:     'Platform.MaxTenants',
    defaultPlanId:         'Platform.DefaultPlanId',
    maintenanceMode:       'Platform.MaintenanceMode',
    emailNotifications:    'Platform.EmailNotifications',
    allowSelfSignup:       'Platform.AllowSelfSignup',
    requireEmailVerify:    'Platform.RequireEmailVerify',
    sessionTimeout:        'Security.SessionTimeoutMinutes',
    failedLoginLimit:      'Security.FailedLoginLimit',
    jwtExpiryHours:        'Security.JwtExpiryHours',
    smtpHost:              'Email.SmtpHost',
    smtpPort:              'Email.SmtpPort',
    smtpUser:              'Email.SmtpUser',
    smtpFromName:          'Email.FromName',
    stripePublicKey:       'Stripe.PublicKey',
    stripeWebhookSecret:   'Stripe.WebhookSecret',
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
          platformName:          get('Platform.Name',                 prev.platformName),
          supportEmail:          get('Platform.SupportEmail',         prev.supportEmail),
          trialDays:             get('Platform.TrialDays',            prev.trialDays),
          maxTenantsPerNode:     get('Platform.MaxTenants',           prev.maxTenantsPerNode),
          defaultPlanId:         get('Platform.DefaultPlanId',        prev.defaultPlanId),
          maintenanceMode:       get('Platform.MaintenanceMode',      'false') === 'true',
          emailNotifications:    get('Platform.EmailNotifications',   'true')  === 'true',
          allowSelfSignup:       get('Platform.AllowSelfSignup',      'true')  === 'true',
          requireEmailVerify:    get('Platform.RequireEmailVerify',   'false') === 'true',
          sessionTimeout:        get('Security.SessionTimeoutMinutes',prev.sessionTimeout),
          failedLoginLimit:      get('Security.FailedLoginLimit',     prev.failedLoginLimit),
          jwtExpiryHours:        get('Security.JwtExpiryHours',       prev.jwtExpiryHours),
          smtpHost:              get('Email.SmtpHost',                prev.smtpHost),
          smtpPort:              get('Email.SmtpPort',                prev.smtpPort),
          smtpUser:              get('Email.SmtpUser',                prev.smtpUser),
          smtpFromName:          get('Email.FromName',                prev.smtpFromName),
          stripePublicKey:       get('Stripe.PublicKey',              prev.stripePublicKey),
          stripeWebhookSecret:   get('Stripe.WebhookSecret',         prev.stripeWebhookSecret),
        }));
      }
    } catch {
      // Settings endpoint may not exist on all deploys — use defaults silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true); setErr(null);
    try {
      const entries = Object.entries(settings) as [string, any][];
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

      {saved && (
        <div style={{ padding: '10px 16px', borderRadius: 8, background: 'rgba(15,157,103,0.1)', border: '1px solid rgba(15,157,103,0.25)', color: 'var(--accent-emerald)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <CheckCircle2 size={15} /> Platform settings saved successfully
        </div>
      )}
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
          <Field label="Platform Name" sub="Displayed in all tenant portals and email headers">
            <input style={inputStyle} value={settings.platformName}
              onChange={e => setSettings(s => ({ ...s, platformName: e.target.value }))} />
          </Field>
          <Field label="Support Email" sub="Where tenant support requests are forwarded">
            <input style={inputStyle} value={settings.supportEmail}
              onChange={e => setSettings(s => ({ ...s, supportEmail: e.target.value }))} />
          </Field>
          <Field label="Default Trial Period (days)" sub="Days given to new tenants before billing starts">
            <input style={{ ...inputStyle, width: 100 }} type="number" value={settings.trialDays}
              onChange={e => setSettings(s => ({ ...s, trialDays: e.target.value }))} />
          </Field>
          <Field label="Max Tenants per Node" sub="Soft limit before scaling is recommended">
            <input style={{ ...inputStyle, width: 100 }} type="number" value={settings.maxTenantsPerNode}
              onChange={e => setSettings(s => ({ ...s, maxTenantsPerNode: e.target.value }))} />
          </Field>
          <Field label="Allow Self-Signup" sub="Let companies register without a platform invitation">
            <Toggle value={settings.allowSelfSignup} onChange={v => setSettings(s => ({ ...s, allowSelfSignup: v }))} />
          </Field>
          <Field label="Require Email Verification" sub="New accounts must verify email before accessing the platform">
            <Toggle value={settings.requireEmailVerify} onChange={v => setSettings(s => ({ ...s, requireEmailVerify: v }))} />
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
          <Field label="From Display Name" sub="Shown as the sender in outbound emails">
            <input style={inputStyle} value={settings.smtpFromName}
              onChange={e => setSettings(s => ({ ...s, smtpFromName: e.target.value }))} />
          </Field>
        </div>

        {/* Stripe */}
        <div className="card" style={{ padding: '4px 24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 0 4px' }}>
            <span style={{ fontSize: 12 }}>💳</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Stripe / Payments</span>
          </div>
          <Field label="Stripe Publishable Key" sub="pk_live_... or pk_test_... from your Stripe dashboard">
            <input style={inputStyle} placeholder="pk_..." value={settings.stripePublicKey}
              onChange={e => setSettings(s => ({ ...s, stripePublicKey: e.target.value }))} />
          </Field>
          <Field label="Stripe Webhook Secret" sub="whsec_... — used to verify incoming webhook events">
            <input style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 11 }} type="password" placeholder="whsec_..." value={settings.stripeWebhookSecret}
              onChange={e => setSettings(s => ({ ...s, stripeWebhookSecret: e.target.value }))} />
          </Field>
        </div>

        {/* Security */}
        <div className="card" style={{ padding: '4px 24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 0 4px' }}>
            <Shield size={15} style={{ color: 'var(--accent-amber)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-amber)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Security</span>
          </div>
          <Field label="Session Timeout (minutes)" sub="Automatically log users out after inactivity">
            <select style={{ ...inputStyle, width: 160 }} value={settings.sessionTimeout}
              onChange={e => setSettings(s => ({ ...s, sessionTimeout: e.target.value }))}>
              <option value="30">30 minutes</option>
              <option value="60">60 minutes</option>
              <option value="240">4 hours</option>
              <option value="480">8 hours</option>
              <option value="0">Never</option>
            </select>
          </Field>
          <Field label="Failed Login Limit" sub="Block accounts after N consecutive failed attempts">
            <select style={{ ...inputStyle, width: 160 }} value={settings.failedLoginLimit}
              onChange={e => setSettings(s => ({ ...s, failedLoginLimit: e.target.value }))}>
              <option value="3">3 attempts</option>
              <option value="5">5 attempts</option>
              <option value="10">10 attempts</option>
            </select>
          </Field>
          <Field label="JWT Token Expiry (hours)" sub="How long authentication tokens remain valid">
            <select style={{ ...inputStyle, width: 160 }} value={settings.jwtExpiryHours}
              onChange={e => setSettings(s => ({ ...s, jwtExpiryHours: e.target.value }))}>
              <option value="1">1 hour</option>
              <option value="8">8 hours</option>
              <option value="24">24 hours</option>
              <option value="72">72 hours</option>
            </select>
          </Field>
        </div>

        {/* Danger Zone */}
        <div className="card" style={{ padding: '4px 24px 20px', border: '1px solid rgba(244,63,94,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 0 4px' }}>
            <Database size={15} style={{ color: 'var(--accent-rose)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-rose)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Danger Zone</span>
          </div>
          <Field label="Maintenance Mode" sub="Disables all tenant access and shows a maintenance page">
            <Toggle value={settings.maintenanceMode} onChange={v => setSettings(s => ({ ...s, maintenanceMode: v }))} />
          </Field>
          {settings.maintenanceMode && (
            <div style={{ background: 'var(--accent-rose-dim)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 8, fontSize: 12, color: 'var(--accent-rose)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={14} /> Maintenance mode is ON — all tenants are currently locked out
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn btn-secondary" onClick={load} disabled={loading}>Discard Changes</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : <><Save size={13} /> Save Changes</>}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
