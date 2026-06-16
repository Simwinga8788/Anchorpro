'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  User, Building2, Bell, Key, Database, Loader2, BookA, ExternalLink,
  Sliders, Plus, Trash2, Smartphone, CreditCard, Shield, CheckCircle2,
  AlertTriangle, Users, ChevronRight, Copy, Eye, EyeOff, X,
  Save, RefreshCw, Lock, Globe, Clock, Settings, Zap, Link2,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useDictionary } from '@/lib/DictionaryContext';
import { settingsApi, subscriptionsApi, departmentsApi, usersApi, referenceDataApi } from '@/lib/api';
import SlideOver from '@/components/SlideOver';

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; msg: string; type: ToastType; }

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((msg: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800);
  }, []);
  return { toasts, show };
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 18px', borderRadius: 10, minWidth: 280, maxWidth: 400,
          background: t.type === 'success' ? 'rgba(46,204,138,0.15)' : t.type === 'error' ? 'rgba(232,72,85,0.15)' : 'rgba(77,158,255,0.15)',
          border: `1px solid ${t.type === 'success' ? 'rgba(46,204,138,0.35)' : t.type === 'error' ? 'rgba(232,72,85,0.35)' : 'rgba(77,158,255,0.35)'}`,
          color: t.type === 'success' ? 'var(--accent-emerald)' : t.type === 'error' ? 'var(--accent-rose)' : 'var(--accent-blue)',
          fontSize: 13, fontWeight: 500, backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          animation: 'slideInRight 0.25s ease',
        }}>
          {t.type === 'success' ? <CheckCircle2 size={15} /> : t.type === 'error' ? <AlertTriangle size={15} /> : <Zap size={15} />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      style={{
        width: 44, height: 25, borderRadius: 13, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        background: value ? 'var(--accent-emerald)' : 'var(--border-default)',
        position: 'relative', transition: 'background 0.25s', flexShrink: 0, opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{
        width: 19, height: 19, borderRadius: '50%', background: 'white',
        position: 'absolute', top: 3, left: value ? 22 : 3,
        transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
      }} />
    </button>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, subtitle, icon, children, footer }: {
  title: string; subtitle?: string; icon?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode;
}) {
  return (
    <div className="card-elevated" style={{ overflow: 'hidden' }}>
      {(title || subtitle) && (
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {icon && <span style={{ color: 'var(--accent-blue)' }}>{icon}</span>}
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Barlow Semi Condensed, sans-serif' }}>{title}</div>
              {subtitle && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{subtitle}</div>}
            </div>
          </div>
        </div>
      )}
      <div style={{ padding: '20px 24px' }}>{children}</div>
      {footer && (
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
          {footer}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar nav groups ───────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: 'Account',
    items: [
      { id: 'profile',      icon: <User size={15} />,    label: 'My Profile' },
      { id: 'security',     icon: <Lock size={15} />,    label: 'Security' },
    ],
  },
  {
    label: 'Workspace',
    items: [
      { id: 'workspace',    icon: <Building2 size={15} />, label: 'General' },
      { id: 'departments',  icon: <Users size={15} />,     label: 'Departments' },
      { id: 'dictionary',   icon: <BookA size={15} />,     label: 'Nomenclature' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'operations',   icon: <Sliders size={15} />,   label: 'Config & SLA' },
      { id: 'jobtypes',     icon: <Settings size={15} />,  label: 'Job Types' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { id: 'notifications', icon: <Bell size={15} />,   label: 'Notifications' },
      { id: 'integrations',  icon: <Link2 size={15} />,  label: 'Integrations' },
    ],
  },
  {
    label: 'Team',
    items: [
      { id: 'users',        icon: <Users size={15} />,     label: 'User Management' },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'billing',      icon: <CreditCard size={15} />, label: 'Plans & Billing' },
      { id: 'tools',        icon: <Database size={15} />,   label: 'Data & Tools' },
    ],
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user, logout } = useAuth();
  const isAdmin = user?.roles?.includes('Admin') || user?.roles?.includes('PlatformOwner');
  const { refreshDictionary, dict } = useDictionary();
  const { toasts, show } = useToast();

  const [activeTab, setActiveTab] = useState('profile');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showInviteSlide, setShowInviteSlide] = useState(false);

  // ── Billing ─────────────────────────────────────────────────────────────────
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [allPlans, setAllPlans] = useState<any[]>([]);
  const [upgrading, setUpgrading] = useState(false);

  // ── Profile ──────────────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Security ─────────────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  // ── Workspace ────────────────────────────────────────────────────────────────
  const [orgForm, setOrgForm] = useState({ name: '', currency: 'ZMW' });
  const [savingOrg, setSavingOrg] = useState(false);

  // ── Departments ──────────────────────────────────────────────────────────────
  const [departments, setDepartments] = useState<any[]>([]);
  const [newDeptName, setNewDeptName] = useState('');
  const [savingDept, setSavingDept] = useState(false);

  // ── Nomenclature ─────────────────────────────────────────────────────────────
  const [dictState, setDictState] = useState<Record<string, string>>({});
  const [savingDict, setSavingDict] = useState(false);

  // ── Operations ───────────────────────────────────────────────────────────────
  const [opSettings, setOpSettings] = useState({
    defaultSlaHours: '24', criticalSlaHours: '4', overdueWarningHours: '8',
    lowStockThreshold: '10', autoAssignEnabled: false, requireSafetyPermit: true,
    allowTechnicianCloseJob: false, maxJobsPerTechnician: '5',
    timezone: 'Africa/Lusaka', dateFormat: 'DD/MM/YYYY',
    workingDaysStart: '07:00', workingDaysEnd: '17:00',
  });
  const [savingOp, setSavingOp] = useState(false);

  // ── Job Types & Downtime ──────────────────────────────────────────────────────
  const [jobTypes, setJobTypes] = useState<any[]>([]);
  const [downtimeCategories, setDowntimeCategories] = useState<any[]>([]);
  const [newJobType, setNewJobType] = useState('');
  const [newDtCat, setNewDtCat] = useState('');
  const [savingJobType, setSavingJobType] = useState(false);
  const [savingDtCat, setSavingDtCat] = useState(false);

  // ── Notifications ─────────────────────────────────────────────────────────────
  const [notifSettings, setNotifSettings] = useState({
    emailRecipients: '',
    notifyJobCreated: true,
    notifyJobCompleted: true,
    notifyJobOverdue: true,
    notifyLowStock: false,
    notifyTechnicianAssigned: true,
    notifyWeeklySummary: true,
    notifyCriticalAsset: true,
  });
  const [savingNotif, setSavingNotif] = useState(false);

  // ── Users ─────────────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [inviteForm, setInviteForm] = useState({ firstName: '', lastName: '', email: '', employeeNumber: '', role: 'Technician', password: '' });
  const [savingInvite, setSavingInvite] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);

  // ── Seed ─────────────────────────────────────────────────────────────────────
  const [seeding, setSeeding] = useState(false);

  // ─── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setProfileForm({ firstName: user?.firstName || '', lastName: user?.lastName || '' });

    subscriptionsApi.getCurrent()
      .then(r => setCurrentPlan(r?.plan ?? { name: 'Anchor Pro', description: 'Full access', priceMonthly: 0 }))
      .catch(() => setCurrentPlan({ name: 'Anchor Pro', description: 'Full access', priceMonthly: 0 }));
    subscriptionsApi.getPlans().then(setAllPlans).catch(() => {});

    departmentsApi.getAll().then(setDepartments).catch(() => setDepartments([]));
    referenceDataApi.getJobTypes().then(setJobTypes).catch(() => setJobTypes([]));
    referenceDataApi.getDowntimeCategories().then(setDowntimeCategories).catch(() => setDowntimeCategories([]));

    settingsApi.getAll().then((all: any[]) => {
      if (!Array.isArray(all)) return;
      const g = (k: string, fb: string) => all.find((s: any) => s.key === k)?.value ?? fb;
      setOrgForm({ name: g('Org.Name', ''), currency: g('Org.Currency', 'ZMW') });
      setOpSettings(p => ({
        ...p,
        defaultSlaHours:        g('Op.DefaultSlaHours',        p.defaultSlaHours),
        criticalSlaHours:       g('Op.CriticalSlaHours',       p.criticalSlaHours),
        overdueWarningHours:    g('Op.OverdueWarningHours',    p.overdueWarningHours),
        lowStockThreshold:      g('Op.LowStockThreshold',      p.lowStockThreshold),
        autoAssignEnabled:      g('Op.AutoAssignEnabled',      'false') === 'true',
        requireSafetyPermit:    g('Op.RequireSafetyPermit',    'true')  === 'true',
        allowTechnicianCloseJob:g('Op.AllowTechnicianCloseJob','false') === 'true',
        maxJobsPerTechnician:   g('Op.MaxJobsPerTechnician',   p.maxJobsPerTechnician),
        timezone:               g('Op.Timezone',               p.timezone),
        dateFormat:             g('Op.DateFormat',             p.dateFormat),
        workingDaysStart:       g('Op.WorkingDaysStart',       p.workingDaysStart),
        workingDaysEnd:         g('Op.WorkingDaysEnd',         p.workingDaysEnd),
      }));
      setNotifSettings(p => ({
        ...p,
        emailRecipients:          g('Notify.EmailRecipients',       ''),
        notifyJobCreated:         g('Notify.JobCreated',            'true') === 'true',
        notifyJobCompleted:       g('Notify.JobCompleted',          'true') === 'true',
        notifyJobOverdue:         g('Notify.JobOverdue',            'true') === 'true',
        notifyLowStock:           g('Notify.LowStock',              'false') === 'true',
        notifyTechnicianAssigned: g('Notify.TechnicianAssigned',    'true') === 'true',
        notifyWeeklySummary:      g('Notify.WeeklySummary',         'true') === 'true',
        notifyCriticalAsset:      g('Notify.CriticalAsset',         'true') === 'true',
      }));
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (activeTab === 'dictionary') {
      setDictState({
        'Equipment':       dict['Equipment']       || 'Equipment',
        'Job Cards':       dict['Job Cards']       || 'Job Cards',
        'Technicians':     dict['Technicians']     || 'Technicians',
        'Inventory & Parts': dict['Inventory & Parts'] || 'Inventory & Parts',
      });
    }
    if (activeTab === 'users' && users.length === 0) {
      setLoadingUsers(true);
      usersApi.getAll().then(setUsers).catch(() => setUsers([])).finally(() => setLoadingUsers(false));
    }
  }, [activeTab]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      if (user?.id) await usersApi.update(user.id, profileForm);
      show('Profile updated successfully');
    } catch (e: any) { show(e.message || 'Failed to update profile', 'error'); }
    finally { setSavingProfile(false); }
  };

  const handleChangePassword = async () => {
    if (pwForm.next !== pwForm.confirm) { show('Passwords do not match', 'error'); return; }
    if (pwForm.next.length < 6) { show('Password must be at least 6 characters', 'error'); return; }
    setSavingPw(true);
    try {
      if (user?.id) await usersApi.changePassword(user.id, { currentPassword: pwForm.current, newPassword: pwForm.next });
      show('Password changed successfully');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (e: any) { show(e.message || 'Failed to change password', 'error'); }
    finally { setSavingPw(false); }
  };

  const handleSaveOrg = async () => {
    setSavingOrg(true);
    try {
      await settingsApi.upsert('Org.Name', orgForm.name, 'Organisation name', 'Org');
      await settingsApi.upsert('Org.Currency', orgForm.currency, 'Default currency', 'Org');
      show('Workspace settings saved');
    } catch (e: any) { show(e.message || 'Failed to save', 'error'); }
    finally { setSavingOrg(false); }
  };

  const handleAddDepartment = async () => {
    if (!newDeptName.trim()) return;
    setSavingDept(true);
    try {
      await departmentsApi.create({ name: newDeptName.trim() });
      setNewDeptName('');
      departmentsApi.getAll().then(setDepartments).catch(() => {});
      show('Department added');
    } catch (e: any) { show(e.message || 'Failed', 'error'); }
    finally { setSavingDept(false); }
  };

  const handleDeleteDepartment = async (id: number) => {
    if (!confirm('Delete this department?')) return;
    await departmentsApi.delete(id);
    setDepartments(d => d.filter((x: any) => x.id !== id));
    show('Department removed');
  };

  const handleSaveDictionary = async () => {
    setSavingDict(true);
    try {
      for (const [key, value] of Object.entries(dictState)) {
        await settingsApi.upsert(`Dict.${key}`, value);
      }
      await refreshDictionary();
      show('Nomenclature updated across the application');
    } catch (e: any) { show(e.message || 'Failed', 'error'); }
    finally { setSavingDict(false); }
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
      for (const [k, v] of entries) await settingsApi.upsert(k, v, '', 'Operational');
      show('Operational settings saved');
    } catch (e: any) { show(e.message || 'Failed', 'error'); }
    finally { setSavingOp(false); }
  };

  const handleAddJobType = async () => {
    if (!newJobType.trim()) return;
    setSavingJobType(true);
    try {
      await referenceDataApi.createJobType({ name: newJobType.trim() });
      setNewJobType('');
      referenceDataApi.getJobTypes().then(setJobTypes).catch(() => {});
      show('Job type added');
    } catch (e: any) { show(e.message || 'Failed', 'error'); }
    finally { setSavingJobType(false); }
  };

  const handleAddDtCat = async () => {
    if (!newDtCat.trim()) return;
    setSavingDtCat(true);
    try {
      await referenceDataApi.createDowntimeCategory({ name: newDtCat.trim() });
      setNewDtCat('');
      referenceDataApi.getDowntimeCategories().then(setDowntimeCategories).catch(() => {});
      show('Downtime category added');
    } catch (e: any) { show(e.message || 'Failed', 'error'); }
    finally { setSavingDtCat(false); }
  };

  const handleDeleteJobType = async (id: number) => {
    if (!confirm('Are you sure you want to delete this job type?')) return;
    try {
      await referenceDataApi.deleteJobType(id);
      setJobTypes(jobTypes.filter((jt: any) => jt.id !== id));
      show('Job type deleted');
    } catch (e: any) { show(e.message || 'Failed', 'error'); }
  };

  const handleDeleteDtCat = async (id: number) => {
    if (!confirm('Are you sure you want to delete this downtime category?')) return;
    try {
      await referenceDataApi.deleteDowntimeCategory(id);
      setDowntimeCategories(downtimeCategories.filter((cat: any) => cat.id !== id));
      show('Downtime category deleted');
    } catch (e: any) { show(e.message || 'Failed', 'error'); }
  };

  const handleSaveNotifications = async () => {
    setSavingNotif(true);
    try {
      const entries: [string, string][] = [
        ['Notify.EmailRecipients',    notifSettings.emailRecipients],
        ['Notify.JobCreated',         String(notifSettings.notifyJobCreated)],
        ['Notify.JobCompleted',       String(notifSettings.notifyJobCompleted)],
        ['Notify.JobOverdue',         String(notifSettings.notifyJobOverdue)],
        ['Notify.LowStock',           String(notifSettings.notifyLowStock)],
        ['Notify.TechnicianAssigned', String(notifSettings.notifyTechnicianAssigned)],
        ['Notify.WeeklySummary',      String(notifSettings.notifyWeeklySummary)],
        ['Notify.CriticalAsset',      String(notifSettings.notifyCriticalAsset)],
      ];
      for (const [k, v] of entries) await settingsApi.upsert(k, v, '', 'Notifications');
      show('Notification settings saved');
    } catch (e: any) { show(e.message || 'Failed', 'error'); }
    finally { setSavingNotif(false); }
  };

  const handleInviteUser = async () => {
    if (!inviteForm.email || !inviteForm.firstName || !inviteForm.password) {
      show('First name, email and password are required', 'error'); return;
    }
    setSavingInvite(true);
    try {
      await usersApi.create(inviteForm);
      show(`User ${inviteForm.firstName} ${inviteForm.lastName} created`);
      setInviteForm({ firstName: '', lastName: '', email: '', employeeNumber: '', role: 'Technician', password: '' });
      setShowInviteSlide(false);
      usersApi.getAll().then(setUsers).catch(() => {});
    } catch (e: any) { show(e.message || 'Failed to create user', 'error'); }
    finally { setSavingInvite(false); }
  };

  const handleDeactivateUser = async (u: any) => {
    if (!confirm(`${u.isActive !== false ? 'Deactivate' : 'Reactivate'} ${u.firstName} ${u.lastName}?`)) return;
    try {
      if (u.isActive !== false) await usersApi.deactivate(u.id);
      else await usersApi.activate(u.id);
      show(`User ${u.isActive !== false ? 'deactivated' : 'reactivated'}`);
      usersApi.getAll().then(setUsers).catch(() => {});
    } catch (e: any) { show(e.message || 'Failed', 'error'); }
  };

  const handleUpgrade = async (planId: number) => {
    setUpgrading(true);
    try {
      const res = await subscriptionsApi.upgrade({ planId });
      show((res as any)?.message || 'Plan upgrade requested');
      setShowUpgradeModal(false);
      subscriptionsApi.getCurrent().then(r => setCurrentPlan(r?.plan ?? currentPlan)).catch(() => {});
    } catch (e: any) { show(e.message || 'Upgrade failed', 'error'); }
    finally { setUpgrading(false); }
  };

  // ─── Render helpers ────────────────────────────────────────────────────────
  const FormRow = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
    <div className="form-field">
      <label className="form-label">{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{hint}</div>}
    </div>
  );

  const SaveBtn = ({ loading, onClick, label = 'Save Changes' }: { loading: boolean; onClick: () => void; label?: string }) => (
    <button className="btn btn-primary btn-sm" onClick={onClick} disabled={loading}
      style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      {loading ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Saving...</> : <><Save size={13} />{label}</>}
    </button>
  );

  const RuleRow = ({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{desc}</div>
      </div>
      <Toggle value={checked} onChange={onChange} />
    </div>
  );

  // ─── Tab content ──────────────────────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {

      // ── My Profile ─────────────────────────────────────────────────────────
      case 'profile': return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SectionCard title="Personal Information" subtitle="Update your display name shown across the platform" icon={<User size={16} />}
            footer={<SaveBtn loading={savingProfile} onClick={handleSaveProfile} />}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%', background: 'var(--accent-blue-dim)',
                border: '2px solid var(--accent-blue-border)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'var(--accent-blue)',
                fontFamily: 'Barlow Condensed, sans-serif',
              }}>
                {(user?.firstName?.[0] || '?').toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{user?.firstName} {user?.lastName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 6 }}>{user?.email}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {user?.roles?.map((r: string) => (
                    <span key={r} className="badge badge-blue" style={{ fontSize: 10 }}>{r}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="settings-grid-2">
              <FormRow label="First Name">
                <input className="form-input" value={profileForm.firstName} onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))} />
              </FormRow>
              <FormRow label="Last Name">
                <input className="form-input" value={profileForm.lastName} onChange={e => setProfileForm(f => ({ ...f, lastName: e.target.value }))} />
              </FormRow>
            </div>
            <div style={{ marginTop: 16 }}>
              <FormRow label="Email Address" hint="Contact your administrator to change your email">
                <input className="form-input" readOnly value={user?.email || ''} style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </FormRow>
            </div>
          </SectionCard>
        </div>
      );

      // ── Security ───────────────────────────────────────────────────────────
      case 'security': return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SectionCard title="Change Password" subtitle="Choose a strong password of at least 6 characters" icon={<Key size={16} />}
            footer={<SaveBtn loading={savingPw} onClick={handleChangePassword} label="Update Password" />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <FormRow label="Current Password">
                <div style={{ position: 'relative' }}>
                  <input className="form-input" type={showPw ? 'text' : 'password'} value={pwForm.current}
                    onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} style={{ paddingRight: 40 }} />
                  <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </FormRow>
              <div className="settings-grid-2">
                <FormRow label="New Password">
                  <input className="form-input" type={showPw ? 'text' : 'password'} value={pwForm.next}
                    onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} />
                </FormRow>
                <FormRow label="Confirm New Password">
                  <input className="form-input" type={showPw ? 'text' : 'password'} value={pwForm.confirm}
                    onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
                </FormRow>
              </div>
              {pwForm.next && pwForm.confirm && pwForm.next !== pwForm.confirm && (
                <div style={{ fontSize: 12, color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={13} /> Passwords do not match
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Active Sessions" subtitle="Devices currently signed in to your account" icon={<Shield size={16} />}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 8, background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent-blue-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Globe size={16} style={{ color: 'var(--accent-blue)' }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Browser Session</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Current device · Active now</div>
                </div>
              </div>
              <span className="badge badge-green">Current</span>
            </div>
          </SectionCard>
        </div>
      );

      // ── Workspace ──────────────────────────────────────────────────────────
      case 'workspace': return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SectionCard title="Organisation Settings" subtitle="Your company name and base currency" icon={<Building2 size={16} />}
            footer={<SaveBtn loading={savingOrg} onClick={handleSaveOrg} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <FormRow label="Organisation Name">
                <input className="form-input" value={orgForm.name} onChange={e => setOrgForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Acme Mining Corp" />
              </FormRow>
              <FormRow label="Base Currency" hint="Used on invoices, cost estimates, and reports">
                <select className="form-select" value={orgForm.currency} onChange={e => setOrgForm(f => ({ ...f, currency: e.target.value }))}>
                  <option value="ZMW">Zambian Kwacha (ZMW)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="ZAR">South African Rand (ZAR)</option>
                  <option value="KES">Kenyan Shilling (KES)</option>
                  <option value="GBP">British Pound (GBP)</option>
                </select>
              </FormRow>
            </div>
          </SectionCard>

          {isAdmin && (
            <SectionCard title="Danger Zone" subtitle="Irreversible destructive actions" icon={<AlertTriangle size={16} />}>
              <div style={{ padding: 16, borderRadius: 8, background: 'var(--accent-rose-dim)', border: '1px solid rgba(232,72,85,0.25)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-rose)', marginBottom: 6 }}>Delete Workspace</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 14 }}>
                  Permanently deletes all job cards, assets, inventory, and team data. This cannot be undone.
                </div>
                <button className="btn btn-sm" style={{ background: 'var(--accent-rose)', color: '#fff', border: 'none' }}
                  onClick={() => setShowDeleteConfirm(true)}>
                  Delete Workspace
                </button>
              </div>
            </SectionCard>
          )}
        </div>
      );

      // ── Departments ────────────────────────────────────────────────────────
      case 'departments': return (
        <SectionCard title="Departments" subtitle="Organise your team members and job cards by department" icon={<Users size={16} />}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <input className="form-input" style={{ flex: 1 }} placeholder="e.g. Electrical, Mechanical, HVAC..."
              value={newDeptName} onChange={e => setNewDeptName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddDepartment(); }} />
            <button className="btn btn-primary btn-sm" onClick={handleAddDepartment} disabled={savingDept || !newDeptName.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {savingDept ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={13} />} Add
            </button>
          </div>
          {departments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              No departments yet. Add one above to get started.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {departments.map((d: any) => (
                <div key={d.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 16px', background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)',
                  borderRadius: 8, transition: 'border-color 0.15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-blue)' }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{d.name}</span>
                  </div>
                  <button onClick={() => handleDeleteDepartment(d.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 4, transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-rose)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      );

      // ── Nomenclature ───────────────────────────────────────────────────────
      case 'dictionary': return (
        <SectionCard title="Dynamic Nomenclature" subtitle="Rename core terms to match your industry — changes apply everywhere in the platform"
          icon={<BookA size={16} />}
          footer={<SaveBtn loading={savingDict} onClick={handleSaveDictionary} label="Apply Changes" />}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { key: 'Equipment',        default: 'Equipment',        hint: 'e.g. Vehicles, Medical Devices, Machines' },
              { key: 'Job Cards',        default: 'Job Cards',        hint: 'e.g. Work Orders, Procedures, Tickets' },
              { key: 'Technicians',      default: 'Technicians',      hint: 'e.g. Drivers, Engineers, Nurses' },
              { key: 'Inventory & Parts',default: 'Inventory & Parts',hint: 'e.g. Supplies, Fuel, Ad Spend' },
            ].map(term => (
              <div key={term.key} className="settings-grid-2" style={{
                padding: '14px 16px', borderRadius: 8, background: 'var(--bg-hover)',
                border: '1px solid var(--border-subtle)', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>"{term.default}"</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{term.hint}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ChevronRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <input className="form-input" style={{ flex: 1 }}
                    value={dictState[term.key] || ''}
                    onChange={e => setDictState({ ...dictState, [term.key]: e.target.value })}
                    placeholder={term.default} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      );

      // ── Operations ─────────────────────────────────────────────────────────
      case 'operations': return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SectionCard title="SLA & Escalation Thresholds" subtitle="Define response time windows that trigger overdue alerts" icon={<Clock size={16} />}>
            <div className="settings-grid-2">
              {[
                { label: 'Default SLA (hours)', key: 'defaultSlaHours', hint: 'Standard jobs' },
                { label: 'Critical SLA (hours)', key: 'criticalSlaHours', hint: 'High-priority jobs' },
                { label: 'Overdue Warning (hours)', key: 'overdueWarningHours', hint: 'Warn before breach' },
                { label: 'Max Jobs per Technician', key: 'maxJobsPerTechnician', hint: 'Soft cap on concurrent jobs' },
              ].map(f => (
                <FormRow key={f.key} label={f.label} hint={f.hint}>
                  <input className="form-input" type="number" min="1"
                    value={(opSettings as any)[f.key]}
                    onChange={e => setOpSettings(s => ({ ...s, [f.key]: e.target.value }))} />
                </FormRow>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Workflow Rules" subtitle="Control how jobs flow through the system" icon={<Sliders size={16} />}>
            <div style={{ marginTop: -4 }}>
              {[
                { label: 'Auto-assign jobs to available technicians', key: 'autoAssignEnabled', desc: 'System picks the least-loaded technician on job creation' },
                { label: 'Require safety permit before starting jobs', key: 'requireSafetyPermit', desc: 'Jobs cannot move to In Progress without an active permit' },
                { label: 'Allow technicians to close their own jobs', key: 'allowTechnicianCloseJob', desc: 'If off, only Supervisors and Admins can mark jobs Completed' },
              ].map(r => (
                <RuleRow key={r.key} label={r.label} desc={r.desc}
                  checked={(opSettings as any)[r.key]}
                  onChange={v => setOpSettings(s => ({ ...s, [r.key]: v }))} />
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Locale & Working Hours" subtitle="Used for due date calculations and timestamps" icon={<Globe size={16} />}
            footer={<SaveBtn loading={savingOp} onClick={handleSaveOpSettings} />}>
            <div className="settings-grid-2">
              <FormRow label="Timezone">
                <select className="form-select" value={opSettings.timezone} onChange={e => setOpSettings(s => ({ ...s, timezone: e.target.value }))}>
                  {['Africa/Lusaka','Africa/Johannesburg','Africa/Nairobi','Africa/Lagos','UTC','Europe/London','America/New_York'].map(tz =>
                    <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </FormRow>
              <FormRow label="Date Format">
                <select className="form-select" value={opSettings.dateFormat} onChange={e => setOpSettings(s => ({ ...s, dateFormat: e.target.value }))}>
                  {['DD/MM/YYYY','MM/DD/YYYY','YYYY-MM-DD'].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </FormRow>
              <FormRow label="Work Day Start">
                <input className="form-input" type="time" value={opSettings.workingDaysStart}
                  onChange={e => setOpSettings(s => ({ ...s, workingDaysStart: e.target.value }))} />
              </FormRow>
              <FormRow label="Work Day End">
                <input className="form-input" type="time" value={opSettings.workingDaysEnd}
                  onChange={e => setOpSettings(s => ({ ...s, workingDaysEnd: e.target.value }))} />
              </FormRow>
              <FormRow label="Low Stock Alert Threshold" hint="Warn when quantity drops below this number">
                <input className="form-input" type="number" min="1" value={opSettings.lowStockThreshold}
                  onChange={e => setOpSettings(s => ({ ...s, lowStockThreshold: e.target.value }))} />
              </FormRow>
            </div>
          </SectionCard>
        </div>
      );

      // ── Job Types ──────────────────────────────────────────────────────────
      case 'jobtypes': return (
        <div className="settings-grid-2" style={{ gap: 20 }}>
          <SectionCard title="Job Types" subtitle="Categories available when creating job cards" icon={<Settings size={16} />}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input className="form-input" style={{ flex: 1 }} placeholder="New job type..." value={newJobType}
                onChange={e => setNewJobType(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddJobType()} />
              <button className="btn btn-primary btn-sm" disabled={savingJobType || !newJobType.trim()} onClick={handleAddJobType}>
                {savingJobType ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={13} />}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {jobTypes.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>No job types yet</div>
              ) : jobTypes.map((jt: any) => (
                <div key={jt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 7, background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{jt.name}</span>
                  <button onClick={() => handleDeleteJobType(jt.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 4, transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-rose)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Downtime Categories" subtitle="Used when logging equipment downtime events" icon={<AlertTriangle size={16} />}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input className="form-input" style={{ flex: 1 }} placeholder="New category..." value={newDtCat}
                onChange={e => setNewDtCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddDtCat()} />
              <button className="btn btn-primary btn-sm" disabled={savingDtCat || !newDtCat.trim()} onClick={handleAddDtCat}>
                {savingDtCat ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={13} />}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {downtimeCategories.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>No categories yet</div>
              ) : downtimeCategories.map((cat: any) => (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 7, background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{cat.name}</span>
                  <button onClick={() => handleDeleteDtCat(cat.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 4, transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-rose)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      );

      // ── Notifications ──────────────────────────────────────────────────────
      case 'notifications': return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SectionCard title="Email Recipients" subtitle="Who receives automated platform reports and digests" icon={<Bell size={16} />}>
            <FormRow label="Report Recipients (comma separated)" hint="These addresses receive the End-of-Day KPI digest">
              <input className="form-input" value={notifSettings.emailRecipients}
                onChange={e => setNotifSettings(n => ({ ...n, emailRecipients: e.target.value }))}
                placeholder="manager@company.com, ceo@company.com" />
            </FormRow>
          </SectionCard>

          <SectionCard title="Notification Events" subtitle="Choose which events trigger notifications" icon={<Zap size={16} />}
            footer={<SaveBtn loading={savingNotif} onClick={handleSaveNotifications} />}>
            <div style={{ marginTop: -4 }}>
              {[
                { label: 'New Job Created',         key: 'notifyJobCreated',         desc: 'Notify when a new service order is created' },
                { label: 'Job Completed',           key: 'notifyJobCompleted',       desc: 'Notify when a technician marks a job as completed' },
                { label: 'Overdue Job Alert',       key: 'notifyJobOverdue',         desc: 'Alert when a job exceeds its SLA deadline' },
                { label: 'Low Inventory Warning',   key: 'notifyLowStock',           desc: 'When stock drops below the defined reorder threshold' },
                { label: 'Technician Assigned',     key: 'notifyTechnicianAssigned', desc: 'Notify technician when a job is assigned to them' },
                { label: 'Weekly Summary Email',    key: 'notifyWeeklySummary',      desc: 'Receive a weekly digest of jobs, downtime, and KPIs' },
                { label: 'Critical Asset Alert',    key: 'notifyCriticalAsset',      desc: 'Immediate alert when a high-priority asset fails' },
              ].map(n => (
                <RuleRow key={n.key} label={n.label} desc={n.desc}
                  checked={(notifSettings as any)[n.key]}
                  onChange={v => setNotifSettings(s => ({ ...s, [n.key]: v }))} />
              ))}
            </div>
          </SectionCard>
        </div>
      );

      // ── Integrations ───────────────────────────────────────────────────────
      case 'integrations': return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SectionCard title="Connected Services" subtitle="Connect Anchor Pro to external tools" icon={<Link2 size={16} />}>
            <div>
              {[
                { id: 'api',     icon: '⚙️', name: 'REST API Access',   status: 'configured',     desc: 'Public API for custom integrations & BI tools' },
                { id: 'webhook', icon: '🔗', name: 'Webhooks',          status: 'not-configured', desc: 'Push real-time events to external systems on job changes' },
                { id: 'email',   icon: '📧', name: 'Email (SMTP)',      status: 'not-configured', desc: 'Send job notifications and reports by email' },
                { id: 'sms',     icon: '📱', name: 'SMS Gateway',       status: 'not-configured', desc: 'Alert technicians via SMS on urgent jobs' },
                { id: 'retrix',  icon: '🚗', name: 'Retrix Car Rental', status: 'not-configured', desc: 'Sync damage reports to Anchor Pro service orders automatically' },
                { id: 'google',  icon: '🔵', name: 'Google Workspace',  status: 'not-configured', desc: 'Calendar sync and Drive report exports' },
              ].map((intg, i, arr) => {
                const ok = intg.status === 'configured';
                return (
                  <div key={intg.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                        {intg.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          {intg.name}
                          <span className={`badge ${ok ? 'badge-green' : 'badge-muted'}`} style={{ fontSize: 9 }}>
                            {ok ? 'Connected' : 'Not Connected'}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{intg.desc}</div>
                      </div>
                    </div>
                    <button className={`btn btn-sm ${ok ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => show(`${intg.name} configuration coming soon`, 'info')}>
                      {ok ? 'Manage' : 'Configure'}
                    </button>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="API Access" subtitle="Build custom integrations against the Anchor Pro REST API" icon={<ExternalLink size={16} />}>
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', fontFamily: 'monospace', fontSize: 12, color: 'var(--accent-blue)', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>https://anchorpro-production.up.railway.app/api</span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => { navigator.clipboard.writeText('https://anchorpro-production.up.railway.app/api'); show('URL copied'); }}>
                <Copy size={13} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => window.open('https://anchorpro-production.up.railway.app/swagger', '_blank')}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ExternalLink size={12} /> View API Docs
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => show('API key generation coming soon — contact support@anchorpro.co.zm', 'info')}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Key size={12} /> Generate API Key
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Mobile App (PWA)" subtitle="Anchor Pro installs from the browser — no app store required" icon={<Smartphone size={16} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              {[
                { icon: '📱', label: 'iOS (Safari)',          steps: 'Open in Safari → tap Share → "Add to Home Screen"' },
                { icon: '🤖', label: 'Android (Chrome)',      steps: 'Open in Chrome → tap ⋮ → "Add to Home Screen" or "Install App"' },
                { icon: '🖥️', label: 'Desktop (Chrome/Edge)', steps: 'Click install icon (⊕) in the address bar' },
              ].map(p => (
                <div key={p.label} style={{ padding: '11px 14px', borderRadius: 8, background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{p.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{p.steps}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--accent-blue-dim)', border: '1px solid var(--accent-blue-border)', fontSize: 12, color: 'var(--accent-blue)' }}>
              ✓ Works offline · ✓ Push-ready · ✓ Full-screen · ✓ No app store
            </div>
          </SectionCard>
        </div>
      );

      // ── User Management ────────────────────────────────────────────────────
      case 'users': return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SectionCard title="Team Members" subtitle={`${users.length} user${users.length !== 1 ? 's' : ''} in this workspace`} icon={<Users size={16} />}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              {isAdmin && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowInviteSlide(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={13} /> Add User
                </button>
              )}
            </div>

            {loadingUsers ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 13 }}>Loading users...</div>
              </div>
            ) : users.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>No users found.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      {['Name', 'Email', 'Employee #', 'Role', 'Status', ''].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: any) => {
                      const active = u.isActive !== false;
                      const isCurrentUser = u.id === user?.id;
                      return (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.1s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ padding: '12px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-blue-dim)', border: '1px solid var(--accent-blue-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent-blue)', flexShrink: 0 }}>
                                {(u.firstName?.[0] || '?').toUpperCase()}
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                {u.firstName} {u.lastName}
                                {isCurrentUser && <span className="badge badge-blue" style={{ fontSize: 9, marginLeft: 6 }}>You</span>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 12px', fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{u.email}</td>
                          <td style={{ padding: '12px 12px', fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>{u.employeeNumber || '—'}</td>
                          <td style={{ padding: '12px 12px' }}>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {(u.roles || []).map((r: string) => (
                                <span key={r} className="badge badge-blue" style={{ fontSize: 10 }}>{r}</span>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '12px 12px' }}>
                            <span className={`badge ${active ? 'badge-green' : 'badge-muted'}`} style={{ fontSize: 10 }}>
                              {active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 12px' }}>
                            {isAdmin && !isCurrentUser && (
                              <button className="btn btn-secondary btn-sm" onClick={() => handleDeactivateUser(u)}
                                style={{ fontSize: 11 }}>
                                {active ? 'Deactivate' : 'Reactivate'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      );

      // ── Billing ────────────────────────────────────────────────────────────
      case 'billing': return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SectionCard title={`Current Plan: ${currentPlan?.name || '...'}`} subtitle={currentPlan?.description || ''} icon={<CreditCard size={16} />}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, fontFamily: 'Barlow Condensed, sans-serif' }}>
                  K {(currentPlan?.priceMonthly || 0).toLocaleString()}
                  <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>/mo</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--accent-blue)', marginTop: 6, fontWeight: 600 }}>Billed monthly · Cancel anytime</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary btn-sm">Billing Portal</button>
                <button className="btn btn-primary btn-sm" onClick={() => setShowUpgradeModal(true)}>Upgrade Plan</button>
              </div>
            </div>
            <div className="settings-grid-3">
              {[
                { label: 'Team Members', used: users.length || 0, max: 'Unlimited', unit: 'users' },
                { label: 'Assets',       used: '—',              max: 'Unlimited', unit: '' },
                { label: 'Storage',      used: '—',              max: '5',         unit: 'TB' },
              ].map(s => (
                <div key={s.label} style={{ padding: 16, background: 'var(--bg-hover)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    {s.used} <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>/ {s.max} {s.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      );

      // ── Data & Tools ───────────────────────────────────────────────────────
      case 'tools': return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SectionCard title="Demo Data Generator" subtitle="Instantly populate your workspace with sample industrial data for demos" icon={<Database size={16} />}
            footer={
              <button className="btn btn-primary btn-sm" disabled={seeding} onClick={async () => {
                setSeeding(true);
                await new Promise(r => setTimeout(r, 1200));
                show('Demo seeding not available in this build', 'info');
                setSeeding(false);
              }} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                {seeding ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Generating...</> : <><Database size={13} />Generate Sample Data</>}
              </button>
            }>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
              Populates your workspace with realistic industrial assets (CAT Trucks, Komatsu Excavators), historical job cards, and stocked inventory.
              Perfect for demos and onboarding new team members.
            </p>
          </SectionCard>

          <SectionCard title="Data Export" subtitle="Export your workspace data for backup or migration" icon={<RefreshCw size={16} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Export All Assets',    desc: 'Download equipment registry as Excel' },
                { label: 'Export Job Cards',     desc: 'Full service order history as Excel' },
                { label: 'Export Inventory',     desc: 'Current parts catalogue and stock levels' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 8, background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{item.desc}</div>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => show('Export coming soon', 'info')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ExternalLink size={12} /> Export
                  </button>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      );

      default: return null;
    }
  };

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(60px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        
        .settings-container {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 28px;
          align-items: start;
        }
        .settings-sidebar {
          position: sticky;
          top: 0;
        }
        .settings-sidebar-card {
          padding: 10px 8px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        
        .settings-nav-item {
          display: flex; align-items: center; gap: 9px;
          padding: 8px 12px; border-radius: 6px; border: none;
          font-size: 13.5px; font-weight: 500; color: var(--text-secondary);
          background: transparent; cursor: pointer; transition: all 0.15s;
          text-align: left; width: 100%; position: relative;
        }
        .settings-nav-item:hover { background: var(--bg-hover); color: var(--text-primary); }
        .settings-nav-item.active {
          background: var(--accent-blue-dim); color: var(--accent-blue); font-weight: 600;
        }
        .settings-nav-item.active::before {
          content: ''; position: absolute; left: 0; top: 20%; bottom: 20%;
          width: 2.5px; background: var(--accent-blue); border-radius: 2px;
        }
        .settings-group-label {
          font-size: 10.5px; font-weight: 700; letter-spacing: 0.09em;
          text-transform: uppercase; color: var(--text-muted);
          padding: 14px 12px 5px; font-family: 'Barlow Condensed', sans-serif;
        }

        .settings-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .settings-grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 14px;
        }

        @media (max-width: 768px) {
          .settings-container {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .settings-sidebar {
            position: relative;
            top: auto;
            margin-bottom: 8px;
          }
          .settings-sidebar-card {
            flex-direction: row;
            overflow-x: auto;
            padding: 8px;
            gap: 16px;
            scrollbar-width: none;
          }
          .settings-sidebar-card::-webkit-scrollbar {
            display: none;
          }
          .settings-sidebar-card > div {
            display: flex;
            flex-direction: row;
            gap: 8px;
            align-items: center;
          }
          .settings-group-label {
            display: none;
          }
          .settings-nav-item {
            width: auto;
            white-space: nowrap;
            flex-shrink: 0;
            padding: 6px 12px;
          }
          .settings-nav-item.active::before {
            left: 12px; right: 12px; bottom: 0; top: auto;
            width: auto; height: 2.5px;
          }
          .settings-grid-2 {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .settings-grid-3 {
            grid-template-columns: 1fr;
            gap: 10px;
          }
        }
      `}</style>

      <ToastContainer toasts={toasts} />

      {/* Upgrade Modal */}
      <SlideOver open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} title="Change Plan" subtitle="Select a tier that matches your scale.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {allPlans.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Loading plans...</div>
          ) : allPlans.map(plan => {
            const active = currentPlan?.id === plan.id;
            return (
              <div key={plan.id} style={{ padding: 18, border: `1px solid ${active ? 'var(--accent-blue)' : 'var(--border-subtle)'}`, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: active ? 'var(--accent-blue-dim)' : 'transparent' }}>
                <div style={{ flex: 1, paddingRight: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{plan.name}</div>
                    {active && <span className="badge badge-blue" style={{ fontSize: 9 }}>Current</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{plan.description}</div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                    K {(plan.monthlyPrice ?? 0).toLocaleString()} <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>/ mo</span>
                  </div>
                  <button className={`btn btn-sm ${active ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => handleUpgrade(plan.id)} disabled={active || upgrading} style={{ minWidth: 90 }}>
                    {active ? 'Active' : upgrading ? 'Wait...' : 'Select'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </SlideOver>

      {/* Delete Confirm */}
      <SlideOver open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Workspace" subtitle="This action is irreversible.">
        <div style={{ padding: 20, borderRadius: 10, background: 'var(--accent-rose-dim)', border: '1px solid rgba(232,72,85,0.3)' }}>
          <AlertTriangle size={28} style={{ color: 'var(--accent-rose)', marginBottom: 12 }} />
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-rose)', marginBottom: 10 }}>Are you absolutely sure?</h3>
          <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.55, marginBottom: 20 }}>
            This will permanently delete the <strong>Anchor Pro</strong> workspace, all job cards, inventory, and team associations.
          </p>
          <div className="form-field" style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ color: 'var(--accent-rose)' }}>Type "PERMANENTLY DELETE" to confirm</label>
            <input className="form-input" placeholder="" />
          </div>
          <button className="btn btn-primary" style={{ background: 'var(--accent-rose)', border: 'none', width: '100%' }}>
            Delete Everything
          </button>
        </div>
      </SlideOver>

      {/* Invite User Slide */}
      <SlideOver open={showInviteSlide} onClose={() => setShowInviteSlide(false)} title="Add Team Member" subtitle="Create a new user account for your workspace.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="settings-grid-2" style={{ gap: 14 }}>
            <div className="form-field">
              <label className="form-label">First Name *</label>
              <input className="form-input" value={inviteForm.firstName} onChange={e => setInviteForm(f => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div className="form-field">
              <label className="form-label">Last Name</label>
              <input className="form-input" value={inviteForm.lastName} onChange={e => setInviteForm(f => ({ ...f, lastName: e.target.value }))} />
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Email Address *</label>
            <input className="form-input" type="email" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="form-field">
            <label className="form-label">Employee / Man Number</label>
            <input className="form-input" value={inviteForm.employeeNumber} onChange={e => setInviteForm(f => ({ ...f, employeeNumber: e.target.value }))} placeholder="e.g. EMP-001" />
          </div>
          <div className="form-field">
            <label className="form-label">Role</label>
            <select className="form-select" value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}>
              {['Technician','Supervisor','Admin','PurchasingOfficer','Storekeeper'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Temporary Password *</label>
            <input className="form-input" type="password" value={inviteForm.password} onChange={e => setInviteForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" />
          </div>
          <button className="btn btn-primary" onClick={handleInviteUser} disabled={savingInvite}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}>
            {savingInvite ? <><Loader2 size={14} className="spin" />Creating...</> : <><Plus size={14} />Create User Account</>}
          </button>
        </div>
      </SlideOver>

      {/* Page */}
      <div>
        <div className="page-header" style={{ marginBottom: 28 }}>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account, workspace, team, and system preferences.</p>
        </div>

        <div className="settings-container">

          {/* ── Sidebar ── */}
          <div className="settings-sidebar">
            <div className="card settings-sidebar-card">
              {NAV_GROUPS.map(group => (
                <div key={group.label}>
                  <div className="settings-group-label">{group.label}</div>
                  {group.items.map(item => (
                    <button key={item.id} className={`settings-nav-item${activeTab === item.id ? ' active' : ''}`}
                      onClick={() => setActiveTab(item.id)}>
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* ── Content ── */}
          <div style={{ minWidth: 0 }}>
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  );
}
