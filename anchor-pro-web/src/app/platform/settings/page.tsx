'use client';

import { Save, Globe, Mail, Shield, Database } from 'lucide-react';
import { useState } from 'react';

export default function PlatformSettingsPage() {
  const [platformName, setPlatformName] = useState('Anchor Pro');
  const [supportEmail, setSupportEmail] = useState('support@anchorpro.co.zm');
  const [trialDays, setTrialDays] = useState('14');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
        background: value ? 'var(--accent-blue)' : 'rgba(255,255,255,0.1)',
        position: 'relative', transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: '50%', background: 'white',
        position: 'absolute', top: 3, left: value ? 21 : 3,
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  );

  const Field = ({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{sub}</div>}
      </div>
      {children}
    </div>
  );

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-default)',
    borderRadius: 6, padding: '7px 12px', fontSize: 13, color: 'var(--text-primary)',
    outline: 'none', fontFamily: 'inherit', width: 240,
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.5, marginBottom: 4 }}>Platform Settings</h1>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Global configuration for the Anchor Pro SaaS platform</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* General */}
        <div className="card" style={{ padding: '4px 24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 0 4px' }}>
            <Globe size={15} style={{ color: 'var(--accent-blue)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: 0.5 }}>General</span>
          </div>
          <Field label="Platform Name" sub="Displayed in all tenant portals and email headers">
            <input style={inputStyle} value={platformName} onChange={e => setPlatformName(e.target.value)} />
          </Field>
          <Field label="Support Email" sub="Where tenant support requests are forwarded">
            <input style={inputStyle} value={supportEmail} onChange={e => setSupportEmail(e.target.value)} />
          </Field>
          <Field label="Default Trial Period" sub="Days given to new tenants before billing starts">
            <input style={{ ...inputStyle, width: 80 }} value={trialDays} onChange={e => setTrialDays(e.target.value)} type="number" />
          </Field>
        </div>

        {/* Notifications */}
        <div className="card" style={{ padding: '4px 24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 0 4px' }}>
            <Mail size={15} style={{ color: 'var(--accent-violet)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-violet)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Notifications</span>
          </div>
          <Field label="Email Notifications" sub="Receive email on payment approval, new signups and system alerts">
            <Toggle value={emailNotifications} onChange={setEmailNotifications} />
          </Field>
        </div>

        {/* Security */}
        <div className="card" style={{ padding: '4px 24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 0 4px' }}>
            <Shield size={15} style={{ color: 'var(--accent-emerald)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Security</span>
          </div>
          <Field label="Session Timeout" sub="Automatically log users out after inactivity">
            <select style={{ ...inputStyle, width: 140 }}>
              <option>30 minutes</option>
              <option>60 minutes</option>
              <option>4 hours</option>
              <option>Never</option>
            </select>
          </Field>
          <Field label="Failed Login Limit" sub="Block users after N failed attempts">
            <select style={{ ...inputStyle, width: 140 }}>
              <option>3 attempts</option>
              <option>5 attempts</option>
              <option>10 attempts</option>
            </select>
          </Field>
        </div>

        {/* Danger Zone */}
        <div className="card" style={{ padding: '4px 24px 20px', borderColor: 'rgba(244,63,94,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 0 4px' }}>
            <Database size={15} style={{ color: 'var(--accent-rose)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-rose)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Danger Zone</span>
          </div>
          <Field label="Maintenance Mode" sub="Disables all tenant access and shows a maintenance page">
            <Toggle value={maintenanceMode} onChange={setMaintenanceMode} />
          </Field>
          {maintenanceMode && (
            <div style={{ background: 'var(--accent-rose-dim)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 8, padding: '10px 14px', marginTop: 8, fontSize: 12, color: 'var(--accent-rose)', fontWeight: 600 }}>
              ⚠️ Maintenance mode is ON — all tenants are seeing the maintenance page
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary"><Save size={13}/> Save Changes</button>
        </div>
      </div>
    </div>
  );
}
