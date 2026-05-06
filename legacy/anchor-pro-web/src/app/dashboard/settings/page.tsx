'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Shield, User, Building2, Bell, CheckCircle2, AlertTriangle, Key, Database, Loader2, BookA, ExternalLink, Sliders, Plus, Trash2, Smartphone } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useDictionary } from '@/lib/DictionaryContext';
import { settingsApi, subscriptionApi, platformApi } from '@/lib/api';
import SlideOver from '@/components/SlideOver';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const isOwner = user?.roles?.includes('PlatformOwner') || user?.roles?.includes('Admin');
  
  const [activeTab, setActiveTab] = useState('billing');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [allPlans, setAllPlans] = useState<any[]>([]);
  const [upgrading, setUpgrading] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  // Org / workspace state
  const [org, setOrg] = useState<any>(null);
  const [orgForm, setOrgForm] = useState({ name: '', currency: 'ZMW' });
  const [savingOrg, setSavingOrg] = useState(false);

  // Profile state
  const [profileForm, setProfileForm] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Operational configuration state
  const [opSettings, setOpSettings] = useState({
    defaultSlaHours: '24',
    criticalSlaHours: '4',
    overdueWarningHours: '8',
    lowStockThreshold: '10',
    autoAssignEnabled: false,
    requireSafetyPermit: true,
    allowTechnicianCloseJob: false,
    maxJobsPerTechnician: '5',
    timezone: 'Africa/Lusaka',
    dateFormat: 'DD/MM/YYYY',
    workingDaysStart: '07:00',
    workingDaysEnd: '17:00',
  });
  const [savingOp, setSavingOp] = useState(false);
  const [opSaved, setOpSaved] = useState(false);

  // Job types & downtime categories management
  const [jobTypes, setJobTypes] = useState<any[]>([]);
  const [downtimeCategories, setDowntimeCategories] = useState<any[]>([]);
  const [newJobType, setNewJobType] = useState('');
  const [newDtCat, setNewDtCat] = useState('');
  const [savingJobType, setSavingJobType] = useState(false);
  const [savingDtCat, setSavingDtCat] = useState(false);

  // Integration/connection state
  const [integrations] = useState([
    { id: 'email',   name: 'Email (SMTP)',       status: 'not-configured', desc: 'Send job notifications and reports by email',     icon: '📧' },
    { id: 'sms',     name: 'SMS Gateway',         status: 'not-configured', desc: 'Alert technicians via SMS on urgent jobs',        icon: '📱' },
    { id: 'stripe',  name: 'Stripe Payments',     status: 'configured',     desc: 'Billing and subscription management',            icon: '💳' },
    { id: 'webhook', name: 'Webhooks',            status: 'not-configured', desc: 'Push events to external systems on job changes',  icon: '🔗' },
    { id: 'google',  name: 'Google Workspace',    status: 'not-configured', desc: 'Calendar sync and Drive report exports',          icon: '🔵' },
    { id: 'api',     name: 'REST API Access',     status: 'configured',     desc: 'AnchorPro public API for custom integrations',    icon: '⚙️' },
  ]);

  // Departments state
  const [departments, setDepartments] = useState<any[]>([]);
  const [newDeptName, setNewDeptName] = useState('');
  const [savingDept, setSavingDept] = useState(false);

  const loadDepartments = () => {
    fetch('/api/org/departments', { credentials: 'include' })
      .then(r => r.ok ? r.json() : []).then(setDepartments).catch(() => setDepartments([]));
  };

  const handleAddDepartment = async () => {
    if (!newDeptName.trim()) return;
    setSavingDept(true);
    try {
      const res = await fetch('/api/org/departments', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDeptName.trim() }),
      });
      if (res.ok) { setNewDeptName(''); loadDepartments(); }
      else { const b = await res.json().catch(() => ({})); alert(b.message || 'Failed to add department.'); }
    } finally { setSavingDept(false); }
  };

  const handleDeleteDepartment = async (id: number) => {
    if (!confirm('Delete this department?')) return;
    await fetch(`/api/org/departments/${id}`, { method: 'DELETE', credentials: 'include' });
    loadDepartments();
  };

  const { refreshDictionary, dict } = useDictionary();
  const [dictState, setDictState] = useState<Record<string, string>>({});
  const [savingDict, setSavingDict] = useState(false);

  useEffect(() => {
    subscriptionApi.getCurrentPlan().then(setCurrentPlan).catch(console.error);
    subscriptionApi.getPlans().then(setAllPlans).catch(console.error);
    platformApi.getOrg().then((o: any) => {
      if (o) {
        setOrg(o);
        setOrgForm({ name: o.name || '', currency: o.currency || 'ZMW' });
      }
    }).catch(console.error);
    // Load reference data for config tab
    loadDepartments();
    fetch('/api/referencedata/jobtypes', { credentials: 'include' })
      .then(r => r.ok ? r.json() : []).then(setJobTypes).catch(() => setJobTypes([]));
    fetch('/api/referencedata/downtimecategories', { credentials: 'include' })
      .then(r => r.ok ? r.json() : []).then(setDowntimeCategories).catch(() => setDowntimeCategories([]));
    // Load operational settings
    settingsApi.getAll().then((all: any[]) => {
      if (!Array.isArray(all)) return;
      const get = (key: string, fallback: string) => all.find(s => s.key === key)?.value ?? fallback;
      setOpSettings(prev => ({
        ...prev,
        defaultSlaHours: get('Op.DefaultSlaHours', prev.defaultSlaHours),
        criticalSlaHours: get('Op.CriticalSlaHours', prev.criticalSlaHours),
        overdueWarningHours: get('Op.OverdueWarningHours', prev.overdueWarningHours),
        lowStockThreshold: get('Op.LowStockThreshold', prev.lowStockThreshold),
        autoAssignEnabled: get('Op.AutoAssignEnabled', 'false') === 'true',
        requireSafetyPermit: get('Op.RequireSafetyPermit', 'true') === 'true',
        allowTechnicianCloseJob: get('Op.AllowTechnicianCloseJob', 'false') === 'true',
        maxJobsPerTechnician: get('Op.MaxJobsPerTechnician', prev.maxJobsPerTechnician),
        timezone: get('Op.Timezone', prev.timezone),
        dateFormat: get('Op.DateFormat', prev.dateFormat),
        workingDaysStart: get('Op.WorkingDaysStart', prev.workingDaysStart),
        workingDaysEnd: get('Op.WorkingDaysEnd', prev.workingDaysEnd),
      }));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (activeTab === 'dictionary') {
      setDictState({
        'Equipment': dict['Equipment'] || 'Equipment',
        'Job Cards': dict['Job Cards'] || 'Job Cards',
        'Technicians': dict['Technicians'] || 'Technicians',
        'Inventory & Parts': dict['Inventory & Parts'] || 'Inventory & Parts',
        'Emails.Recipients': dict['Emails.Recipients'] || ''
      });
    }
  }, [activeTab, dict]);

  const handleSaveDictionary = async () => {
    setSavingDict(true);
    try {
      for (const [key, value] of Object.entries(dictState)) {
        await settingsApi.set(`Dict.${key}`, value);
      }
      await refreshDictionary();
      alert("Nomenclature updated across the application.");
    } catch(err:any) {
      alert("Failed to save terms: " + err.message);
    } finally {
      setSavingDict(false);
    }
  };
  
  const handleSaveOpSettings = async () => {
    setSavingOp(true);
    try {
      const entries: [string, string][] = [
        ['Op.DefaultSlaHours',         opSettings.defaultSlaHours],
        ['Op.CriticalSlaHours',        opSettings.criticalSlaHours],
        ['Op.OverdueWarningHours',     opSettings.overdueWarningHours],
        ['Op.LowStockThreshold',       opSettings.lowStockThreshold],
        ['Op.AutoAssignEnabled',       String(opSettings.autoAssignEnabled)],
        ['Op.RequireSafetyPermit',     String(opSettings.requireSafetyPermit)],
        ['Op.AllowTechnicianCloseJob', String(opSettings.allowTechnicianCloseJob)],
        ['Op.MaxJobsPerTechnician',    opSettings.maxJobsPerTechnician],
        ['Op.Timezone',               opSettings.timezone],
        ['Op.DateFormat',             opSettings.dateFormat],
        ['Op.WorkingDaysStart',       opSettings.workingDaysStart],
        ['Op.WorkingDaysEnd',         opSettings.workingDaysEnd],
      ];
      for (const [key, value] of entries) {
        await settingsApi.set(key, value, '', 'Operational');
      }
      setOpSaved(true);
      setTimeout(() => setOpSaved(false), 3000);
    } catch (err: any) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSavingOp(false);
    }
  };

  const handleAddJobType = async () => {
    if (!newJobType.trim()) return;
    setSavingJobType(true);
    try {
      await fetch('/api/referencedata/jobtypes', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newJobType.trim() }),
      });
      setNewJobType('');
      const updated = await fetch('/api/referencedata/jobtypes', { credentials: 'include' }).then(r => r.json());
      setJobTypes(updated || []);
    } catch (err: any) {
      alert('Failed: ' + err.message);
    } finally { setSavingJobType(false); }
  };

  const handleAddDtCat = async () => {
    if (!newDtCat.trim()) return;
    setSavingDtCat(true);
    try {
      await fetch('/api/referencedata/downtimecategories', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDtCat.trim() }),
      });
      setNewDtCat('');
      const updated = await fetch('/api/referencedata/downtimecategories', { credentials: 'include' }).then(r => r.json());
      setDowntimeCategories(updated || []);
    } catch (err: any) {
      alert('Failed: ' + err.message);
    } finally { setSavingDtCat(false); }
  };

  const ToggleSwitch = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!value)} style={{
      width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
      background: value ? 'var(--accent-emerald)' : 'rgba(255,255,255,0.12)',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: 'white',
        position: 'absolute', top: 3, left: value ? 21 : 3,
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  );

  const tabs = [
    { id: 'profile',       icon: <User size={15}/>,       label: 'My Account' },
    { id: 'workspace',     icon: <Building2 size={15}/>,  label: 'Workspace' },
    { id: 'departments',   icon: <Building2 size={15}/>,  label: 'Departments' },
    { id: 'operations',    icon: <Sliders size={15}/>,    label: 'Operations Config' },
    { id: 'integrations',  icon: <Smartphone size={15}/>, label: 'Integrations' },
    { id: 'billing',       icon: <CreditCard size={15}/>, label: 'Plans & Billing' },
    { id: 'dictionary',    icon: <BookA size={15}/>,      label: 'Nomenclature' },
    { id: 'security',      icon: <Shield size={15}/>,     label: 'Security' },
    { id: 'notifications', icon: <Bell size={15}/>,       label: 'Notifications' },
    { id: 'tools',         icon: <Database size={15}/>,   label: 'Data & Tools' },
  ];

  const handleOpenPortal = async () => {
    setOpeningPortal(true);
    try {
      const res = await platformApi.createPortal();
      if (res?.url) {
        window.open(res.url, '_blank');
      } else {
        alert('Stripe billing portal opened. Check your browser for the new tab.');
      }
    } catch {
      alert('Stripe billing portal is not configured yet. Contact support.');
    } finally {
      setOpeningPortal(false);
    }
  };

  const handleAction = (action: string) => {
    if (action === 'upgrade') setShowUpgradeModal(true);
    if (action === 'delete') setShowDeleteConfirm(true);
    if (action === 'payment') handleOpenPortal();
    if (action === 'pwd') alert("Password reset link sent to your email.");
  };

  const handleSaveOrg = async () => {
    setSavingOrg(true);
    try {
      await platformApi.updateOrg({ ...org, name: orgForm.name, currency: orgForm.currency });
      alert('Workspace settings saved.');
    } catch {
      // /api/org not yet wired on backend — save to settings as fallback
      try {
        await settingsApi.set('Org.Name', orgForm.name, 'Organisation name', 'Org');
        await settingsApi.set('Org.Currency', orgForm.currency, 'Default currency', 'Org');
        alert('Workspace settings saved.');
      } catch (e2: any) {
        alert('Failed to save: ' + e2.message);
      }
    } finally {
      setSavingOrg(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await fetch('/api/auth/profile', {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: profileForm.firstName, lastName: profileForm.lastName }),
      });
      alert('Profile updated.');
    } catch (err: any) {
      alert('Failed to save profile: ' + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpgrade = async (planId: number) => {
    setUpgrading(true);
    try {
      const res = await subscriptionApi.upgrade(planId);
      alert(res.message || "Upgrade requested.");
      subscriptionApi.getCurrentPlan().then(setCurrentPlan);
      setShowUpgradeModal(false);
    } catch(err: any) {
      alert("Error upgrading: " + err.message);
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div>
      <SlideOver open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} title="Change Plan" subtitle="Select a subscription tier that matches your operational scale.">
         <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
           {allPlans.length === 0 ? (
             <div style={{ color: 'var(--text-muted)' }}>Loading plans...</div>
           ) : allPlans.map(plan => {
             const active = currentPlan?.id === plan.id;
             return (
             <div key={plan.id} style={{ padding: 20, border: '1px solid var(--border-subtle)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: active ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = active ? 'var(--accent-blue)' : 'var(--border-subtle)'}>
                <div style={{ flex: 1, paddingRight: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{plan.name}</div>
                    {active && <span className="badge badge-blue">Current</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{plan.description}</div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                    K {(plan.monthlyPrice ?? 0).toLocaleString()} <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>/ mo</span>
                  </div>
                  <button className={`btn btn-sm ${active ? 'btn-secondary' : 'btn-primary'}`} 
                          onClick={(e) => { e.stopPropagation(); handleUpgrade(plan.id); }} 
                          disabled={active || upgrading} style={{ minWidth: 90 }}>
                    {active ? 'Active' : (upgrading ? 'Wait...' : 'Upgrade')}
                  </button>
                </div>
             </div>
             )
           })}
           <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>
             All prices are billed monthly in Zambian Kwacha (ZMW). Annual billing saves 15%.
           </div>
         </div>
      </SlideOver>

      <SlideOver open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Workspace" subtitle="Irreversible destructive action.">
         <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: 20, borderRadius: 8, border: '1px outset rgba(244, 63, 94, 0.3)' }}>
           <AlertTriangle size={32} style={{ color: 'var(--accent-rose)', marginBottom: 12 }} />
           <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-rose)', margin: '0 0 10px 0' }}>Are you absolutely sure?</h3>
           <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 20 }}>
             This action cannot be undone. This will permanently delete the <strong>Anchor Pro</strong> workspace, all job cards, inventory databases, and remove all team member associations.
           </p>
           <div className="form-field">
             <label className="form-label" style={{ color: 'var(--accent-rose)' }}>Type "PERMANENTLY DELETE" to confirm</label>
             <input className="form-input" placeholder="" />
           </div>
           <button className="btn btn-primary" style={{ background: 'var(--accent-rose)', border: 'none', width: '100%', marginTop: 20 }}>Delete Everything</button>
         </div>
      </SlideOver>

      <div className="page-header" style={{ marginBottom: 30 }}>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account, workspace preferences, and subscription.</p>
      </div>

      <div className="settings-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 300px) 1fr', gap: 30, alignItems: 'start' }}>

        {/* Sidebar Nav */}
        <div className="settings-tab-nav" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tabs.map(nav => (
            <button key={nav.id} 
              onClick={() => setActiveTab(nav.id)}
              style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              border: 'none', background: activeTab === nav.id ? 'rgba(255,255,255,0.06)' : 'transparent',
              color: activeTab === nav.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderRadius: 6, fontSize: 13, fontWeight: activeTab === nav.id ? 600 : 500,
              cursor: 'pointer', transition: 'background 0.1s', textAlign: 'left'
            }}>
              <span style={{ color: activeTab === nav.id ? 'var(--text-primary)' : 'var(--text-muted)' }}>{nav.icon}</span>
              {nav.label}
            </button>
          ))}
        </div>

        {/* Settings Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
          
          {activeTab === 'billing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
              <section>
                <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>Current Plan: {currentPlan?.name || 'Loading...'}</h3>
                      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>You are on the {currentPlan?.name || 'Anchor Pro'} tier. {currentPlan?.description}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>K {currentPlan?.priceMonthly?.toLocaleString() || '0'}<span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>/mo</span></div>
                      <div style={{ fontSize: 11, color: 'var(--accent-blue)', marginTop: 8, fontWeight: 600 }}>Billing unmetered</div>
                    </div>
                  </div>
                  <div style={{ padding: '16px 24px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CreditCard size={18} style={{ color: 'var(--text-muted)' }}/>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Visa ending in 4242</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Expires 12/2028</div>
                      </div>
                    </div>
                    {isOwner && (
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleAction('payment')} disabled={openingPortal} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {openingPortal ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <ExternalLink size={12} />}
                          Billing Portal
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => handleAction('upgrade')}>Upgrade Plan</button>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>Workspace Usage</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  {[
                    { label: 'Registered Team', used: 12, max: 20, unit: 'Seats' },
                    { label: 'Asset Library', used: 45, max: 'Unlimited', unit: 'Assets' },
                    { label: 'Storage Space', used: 3.2, max: 5, unit: 'TB' },
                  ].map(stat => (
                    <div key={stat.label} className="card" style={{ padding: 20 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>{stat.label}</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                        {stat.used} <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>/ {stat.max} {stat.unit}</span>
                      </div>
                      <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--accent-blue)', width: typeof stat.max === 'number' ? `${(stat.used / stat.max) * 100}%` : '5%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="card-elevated" style={{ padding: 30 }}>
               <h3 style={{ fontSize: 18, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 24 }}>Personal Information</h3>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                 <div className="form-field">
                   <label className="form-label">First Name</label>
                   <input className="form-input" value={profileForm.firstName} onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))} />
                 </div>
                 <div className="form-field">
                   <label className="form-label">Last Name</label>
                   <input className="form-input" value={profileForm.lastName} onChange={e => setProfileForm(f => ({ ...f, lastName: e.target.value }))} />
                 </div>
               </div>

               <div className="form-field" style={{ marginBottom: 24 }}>
                 <label className="form-label">Email Address</label>
                 <input className="form-input" readOnly value={user?.email || ''} style={{ background: 'var(--bg-app)' }} />
               </div>

               <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 24, display: 'flex', gap: 10 }}>
                 <button className="btn btn-primary" onClick={handleSaveProfile} disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save Changes'}</button>
               </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card-elevated" style={{ padding: 30 }}>
               <h3 style={{ fontSize: 18, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                 <Key size={18} /> Password & Access
               </h3>
               
               <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 20 }}>
                 Your account is secured via standard username/password authentication. You can choose to reset your credentials.
               </p>

               <button className="btn btn-secondary" onClick={() => handleAction('pwd')}>Send Password Reset Email</button>
               
               <div style={{ marginTop: 40 }}>
                 <h4 style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 10 }}>Active Sessions</h4>
                 <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 16 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div>
                       <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>Windows PC — Chrome</div>
                       <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Lusaka, ZM · Active now</div>
                     </div>
                     <span className="badge badge-green">Current Session</span>
                   </div>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'workspace' && (
             <div className="card-elevated" style={{ padding: 30 }}>
              <h3 style={{ fontSize: 18, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 24 }}>Workspace Settings</h3>

              <div className="form-field" style={{ marginBottom: 24 }}>
                <label className="form-label">Organization Name</label>
                <input className="form-input" value={orgForm.name} onChange={e => setOrgForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div className="form-field" style={{ marginBottom: 24 }}>
                <label className="form-label">Base Currency</label>
                <select className="form-select" value={orgForm.currency} onChange={e => setOrgForm(f => ({ ...f, currency: e.target.value }))}>
                  <option value="ZMW">Zambian Kwacha (ZMW)</option>
                  <option value="USD">US Dollar (USD)</option>
                </select>
              </div>

              <button className="btn btn-primary" onClick={handleSaveOrg} disabled={savingOrg}>{savingOrg ? 'Saving...' : 'Save Configuration'}</button>

              {isOwner && (
                <section style={{ marginTop: 40 }}>
                  <div style={{ border: '1px solid rgba(244, 63, 94, 0.3)', background: 'rgba(244, 63, 94, 0.05)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-rose)', margin: '0 0 6px 0' }}>Danger Zone</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '0 0 16px 0' }}>Permanently delete this workspace and all associated data. This action cannot be undone.</p>
                    <button className="btn btn-sm" style={{ background: 'var(--accent-rose)', color: '#fff', border: 'none' }} onClick={() => handleAction('delete')}>Delete Workspace</button>
                  </div>
                </section>
              )}
             </div>
          )}

          {activeTab === 'departments' && (
            <div className="card-elevated" style={{ padding: 30 }}>
              <h3 style={{ fontSize: 18, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8 }}>Departments</h3>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 24 }}>Create departments to organise your team members and job cards.</p>

              <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
                <input
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="e.g. Electrical, Mechanical, HVAC..."
                  value={newDeptName}
                  onChange={e => setNewDeptName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddDepartment(); }}
                />
                <button className="btn btn-primary" onClick={handleAddDepartment} disabled={savingDept || !newDeptName.trim()}>
                  {savingDept ? <Loader2 size={14} className="spin"/> : <Plus size={14}/>} Add
                </button>
              </div>

              {departments.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>No departments yet. Add one above.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {departments.map((d: any) => (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
                      <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{d.name}</span>
                      <button onClick={() => handleDeleteDepartment(d.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'dictionary' && (
             <div className="card-elevated" style={{ padding: 30 }}>
               <h3 style={{ fontSize: 18, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8 }}>Dynamic Nomenclature</h3>
               <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 24 }}>
                 Customize how Anchor Pro reads for your team. Overwrite industry-standard terms with words your workspace uses natively.
               </p>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginBottom: 24 }}>
                 {[
                   { key: 'Equipment', default: 'Equipment', hint: 'Examples: Medical Devices, Software Licenses, Vehicles' },
                   { key: 'Job Cards', default: 'Job Cards', hint: 'Examples: Procedures, Delivery Orders, Projects' },
                   { key: 'Technicians', default: 'Technicians', hint: 'Examples: Nurses, Drivers, Consultants' },
                   { key: 'Inventory & Parts', default: 'Inventory & Parts', hint: 'Examples: Medical Supplies, Fuel, Ad Spend' }
                 ].map(term => (
                   <div key={term.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ width: '40%' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Terminal Default: "{term.default}"</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{term.hint}</div>
                      </div>
                      <div style={{ width: '55%' }}>
                        <input className="form-input" 
                          value={dictState[term.key] || ''} 
                          onChange={e => setDictState({...dictState, [term.key]: e.target.value})} 
                          placeholder={term.default} />
                      </div>
                   </div>
                 ))}
               </div>

               <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 24 }}>
                 <button className="btn btn-primary" onClick={handleSaveDictionary} disabled={savingDict}>
                   {savingDict ? 'Applying...' : 'Save Vocabulary'}
                 </button>
               </div>
             </div>
          )}
          
          {activeTab === 'notifications' && (
             <div className="card-elevated" style={{ padding: 30 }}>
               <h3 style={{ fontSize: 18, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8 }}>Notification & Email Routing</h3>
               <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 24 }}>
                 Configure where automated platform reports and alerts are sent.
               </p>

               <div style={{ marginBottom: 30 }}>
                 <div className="form-field">
                   <label className="form-label" style={{ fontWeight: 600 }}>Report Recipients (comma separated)</label>
                   <input className="form-input" 
                     value={dictState['Emails.Recipients'] || ''} 
                     onChange={e => setDictState({...dictState, 'Emails.Recipients': e.target.value})} 
                     placeholder="manager@company.com, ceo@company.com" />
                   <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                     These emails will receive the End-of-Day Profitability and KPI digest.
                   </p>
                 </div>
               </div>

               <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>In-App Notification Routing</h4>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                 {[
                   { label: 'Weekly Summary Emails', desc: 'Receive a digest of all jobs and downtime.', active: true },
                   { label: 'Critical Asset Alerts', desc: 'Immediate notification if High Priority assets fail.', active: true },
                   { label: 'Inventory Reorder Alerts', desc: 'When stock drops below defined threshold.', active: false },
                   { label: 'Technician Assignment', desc: 'When a new job is routed to your queue.', active: true }
                 ].map(n => (
                   <label key={n.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, border: '1px solid var(--border-subtle)', borderRadius: 8, cursor: 'pointer' }}>
                     <div>
                       <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{n.label}</div>
                       <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{n.desc}</div>
                     </div>
                     <input type="checkbox" defaultChecked={n.active} style={{ transform: 'scale(1.2)' }} />
                   </label>
                 ))}
               </div>
             </div>
          )}

          {activeTab === 'operations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {opSaved && (
                <div style={{ padding: '10px 16px', borderRadius: 8, background: 'rgba(15,157,103,0.1)', border: '1px solid rgba(15,157,103,0.25)', color: 'var(--accent-emerald)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={15} /> Settings saved successfully
                </div>
              )}

              {/* SLA & Escalation */}
              <div className="card-elevated" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>SLA & Escalation Thresholds</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Define response time windows that trigger overdue alerts and escalations</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {[
                    { label: 'Default SLA (hours)', key: 'defaultSlaHours', hint: 'Standard jobs must be completed within this window' },
                    { label: 'Critical SLA (hours)', key: 'criticalSlaHours', hint: 'Critical priority jobs — tighter response time' },
                    { label: 'Overdue Warning (hours)', key: 'overdueWarningHours', hint: 'Warn before SLA breach by this many hours' },
                    { label: 'Max Jobs per Technician', key: 'maxJobsPerTechnician', hint: 'Soft cap for concurrent job assignments' },
                  ].map(f => (
                    <div className="form-field" key={f.key}>
                      <label className="form-label">{f.label}</label>
                      <input className="form-input" type="number" min="1"
                        value={(opSettings as any)[f.key]}
                        onChange={e => setOpSettings(s => ({ ...s, [f.key]: e.target.value }))} />
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{f.hint}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workflow Rules */}
              <div className="card-elevated" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Workflow Rules</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Control how jobs flow through the system</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { label: 'Auto-assign jobs to available technicians', key: 'autoAssignEnabled', desc: 'System picks the least-loaded available technician on job creation' },
                    { label: 'Require safety permit before starting jobs', key: 'requireSafetyPermit', desc: 'Job cards cannot be moved to In Progress without an active permit' },
                    { label: 'Allow technicians to close their own jobs', key: 'allowTechnicianCloseJob', desc: 'If off, only Supervisors and Admins can mark jobs as Completed' },
                  ].map(rule => (
                    <div key={rule.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{rule.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{rule.desc}</div>
                      </div>
                      <ToggleSwitch value={(opSettings as any)[rule.key]} onChange={v => setOpSettings(s => ({ ...s, [rule.key]: v }))} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Locale & Time */}
              <div className="card-elevated" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Locale & Working Hours</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>Used for due date calculations and report timestamps</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-field">
                    <label className="form-label">Timezone</label>
                    <select className="form-select" value={opSettings.timezone} onChange={e => setOpSettings(s => ({ ...s, timezone: e.target.value }))}>
                      {['Africa/Lusaka','Africa/Johannesburg','Africa/Nairobi','Africa/Lagos','UTC','Europe/London','America/New_York'].map(tz => <option key={tz} value={tz}>{tz}</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Date Format</label>
                    <select className="form-select" value={opSettings.dateFormat} onChange={e => setOpSettings(s => ({ ...s, dateFormat: e.target.value }))}>
                      {['DD/MM/YYYY','MM/DD/YYYY','YYYY-MM-DD'].map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Work Day Start</label>
                    <input className="form-input" type="time" value={opSettings.workingDaysStart} onChange={e => setOpSettings(s => ({ ...s, workingDaysStart: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Work Day End</label>
                    <input className="form-input" type="time" value={opSettings.workingDaysEnd} onChange={e => setOpSettings(s => ({ ...s, workingDaysEnd: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Low Stock Alert Threshold</label>
                    <input className="form-input" type="number" min="1" value={opSettings.lowStockThreshold} onChange={e => setOpSettings(s => ({ ...s, lowStockThreshold: e.target.value }))} />
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Warn when inventory quantity drops below this number</div>
                  </div>
                </div>
              </div>

              {/* Reference data management */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Job Types */}
                <div className="card-elevated" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Job Types</h3>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>Categories that appear when creating job cards</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                    {jobTypes.length === 0 ? (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>None yet</div>
                    ) : jobTypes.map((jt: any) => (
                      <div key={jt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 6, background: 'var(--bg-app)', border: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{jt.name}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="form-input" style={{ flex: 1 }} placeholder="New job type..." value={newJobType} onChange={e => setNewJobType(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddJobType()} />
                    <button className="btn btn-primary btn-sm" disabled={savingJobType || !newJobType.trim()} onClick={handleAddJobType}>
                      <Plus size={13} />
                    </button>
                  </div>
                </div>

                {/* Downtime Categories */}
                <div className="card-elevated" style={{ padding: 24 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Downtime Categories</h3>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>Used when reporting breakdowns and equipment downtime</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                    {downtimeCategories.length === 0 ? (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>None yet</div>
                    ) : downtimeCategories.map((cat: any) => (
                      <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 6, background: 'var(--bg-app)', border: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{cat.name}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="form-input" style={{ flex: 1 }} placeholder="New category..." value={newDtCat} onChange={e => setNewDtCat(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddDtCat()} />
                    <button className="btn btn-primary btn-sm" disabled={savingDtCat || !newDtCat.trim()} onClick={handleAddDtCat}>
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" disabled={savingOp} onClick={handleSaveOpSettings}>
                  {savingOp ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : 'Save Configuration'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card-elevated" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Connected Services</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Connect AnchorPro to external tools and services</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {integrations.map(intg => {
                    const isConfigured = intg.status === 'configured';
                    return (
                      <div key={intg.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                            {intg.icon}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                              {intg.name}
                              <span className={`badge ${isConfigured ? 'badge-green' : 'badge-muted'}`} style={{ fontSize: 9 }}>
                                {isConfigured ? 'Connected' : 'Not Connected'}
                              </span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{intg.desc}</div>
                          </div>
                        </div>
                        <button className={`btn btn-sm ${isConfigured ? 'btn-secondary' : 'btn-primary'}`}
                          onClick={() => alert(isConfigured ? `${intg.name} is configured. Contact your platform administrator to update credentials.` : `${intg.name} integration requires API credentials. Contact your Anchor Pro administrator.`)}>
                          {isConfigured ? 'Manage' : 'Configure'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card-elevated" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>API Access</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Use the AnchorPro REST API to build custom integrations or connect to BI tools</p>
                <div style={{ padding: '12px 16px', borderRadius: 8, background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', fontFamily: 'monospace', fontSize: 12, color: 'var(--accent-blue)', marginBottom: 12 }}>
                  https://anchorpro-production.up.railway.app/api
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => window.open('https://anchorpro-production.up.railway.app/swagger', '_blank')}>
                    <ExternalLink size={12} /> View API Docs
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => alert('API key generation coming soon — contact support@anchorpro.co.zm')}>
                    Generate API Key
                  </button>
                </div>
              </div>

              <div className="card-elevated" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Smartphone size={15} /> Mobile App (PWA)
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>AnchorPro is a Progressive Web App — it installs directly from the browser, no app store required</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {[
                    { icon: '📱', label: 'iOS (Safari)', steps: 'Open in Safari → tap Share → "Add to Home Screen"' },
                    { icon: '🤖', label: 'Android (Chrome)', steps: 'Open in Chrome → tap ⋮ menu → "Add to Home Screen" or "Install App"' },
                    { icon: '🖥️', label: 'Desktop (Chrome/Edge)', steps: 'Click the install icon (⊕) in the address bar or go to Settings → Install' },
                  ].map(p => (
                    <div key={p.label} style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', display: 'flex', gap: 12 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{p.icon}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{p.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{p.steps}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(35,131,226,0.08)', border: '1px solid rgba(35,131,226,0.2)', fontSize: 12, color: 'var(--accent-blue)' }}>
                  ✓ Works offline · ✓ Push notifications ready · ✓ Full-screen experience · ✓ No app store needed
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tools' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
              <div className="card-elevated" style={{ padding: 30 }}>
                <h3 style={{ fontSize: 18, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Database size={18} /> Demo Data Generator
                </h3>
                <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
                  Instantly populate your workspace with realistic industrial assets (CAT Trucks, Komatsu Excavators), historical job cards,
                  and stock inventory. Perfect for demos and onboarding new team members.
                </p>

                {seedResult && (
                  <div style={{ padding: 12, borderRadius: 8, marginBottom: 16, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={16} /> {seedResult}
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  disabled={seeding}
                  onClick={async () => {
                    setSeeding(true);
                    setSeedResult(null);
                    try {
                      const res = await settingsApi.seedDemoData();
                      setSeedResult(res.message || 'Demo data generated successfully!');
                    } catch (err: any) {
                      setSeedResult('Error: ' + err.message);
                    } finally {
                      setSeeding(false);
                    }
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {seeding ? <><Loader2 size={14} className="spin" /> Generating...</> : <><Database size={14} /> Generate Sample Data</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
