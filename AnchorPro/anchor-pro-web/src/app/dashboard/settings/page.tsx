'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  User, Building2, Bell, Key, Database, Loader2, BookA, ExternalLink,
  Sliders, Plus, Trash2, Smartphone, CreditCard, Shield, CheckCircle2,
  AlertTriangle, Users, ChevronRight, Copy, Eye, EyeOff, X,
  Save, RefreshCw, Lock, Globe, Clock, Settings, Zap, Link2, FileText, Info
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useDictionary } from '@/lib/DictionaryContext';
import { settingsApi, subscriptionsApi, departmentsApi, usersApi, referenceDataApi, tenantsApi, uploadApi } from '@/lib/api';
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
      { id: 'templates',    icon: <FileText size={15} />,  label: 'Contract Template' },
      { id: 'dictionary',   icon: <BookA size={15} />,     label: 'Terminology' },
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
    label: 'System',
    items: [
      { id: 'billing',      icon: <CreditCard size={15} />, label: 'Plans & Billing' },

    ],
  },
];

// ─── Render helpers ────────────────────────────────────────────────────────
function FormRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function SaveBtn({ loading, onClick, label = 'Save Changes' }: { loading: boolean; onClick: () => void; label?: string }) {
  return (
    <button className="btn btn-primary btn-sm" onClick={onClick} disabled={loading}
      style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      {loading ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />Saving...</> : <><Save size={13} />{label}</>}
    </button>
  );
}

function RuleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{desc}</div>
      </div>
      <Toggle value={checked} onChange={onChange} />
    </div>
  );
}

const DEFAULT_CONTRACT_TEMPLATE = `EMPLOYMENT CONTRACT

This Employment Contract ("Contract") is made on {{CurrentDate}},

Employer: {{Company}} (the "Company")
Employee: {{EmployeeName}} (the "Employee")

1. POSITION AND DUTIES
The Employer agrees to employ the Employee as a {{JobTitle}}. The Employee will perform duties as assigned by the Employer.

2. COMPENSATION
The Employee will be paid a monthly salary of ZMW {{Salary}}.

3. WORKING HOURS
Standard working hours are {{WorkingHours}} hours per month.

4. TERM OF EMPLOYMENT
This contract commences on {{StartDate}} {{EndDateClause}}.

5. TERMINATION
Either party may terminate this contract by giving {{NoticePeriod}} days' written notice.

6. CONFIDENTIALITY
The Employee agrees to keep confidential all proprietary information of the Employer.

IN WITNESS WHEREOF, the parties have executed this Contract as of the date first above written.`;

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user, logout } = useAuth();
  const isAdmin = user?.roles?.includes('Admin') || user?.roles?.includes('PlatformOwner');
  const { refreshDictionary, dict } = useDictionary();
  const { toasts, show } = useToast();

  const [activeTab, setActiveTab] = useState('profile');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);


  // ── Billing ─────────────────────────────────────────────────────────────────
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
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
  const [orgForm, setOrgForm] = useState({ name: '', currency: 'ZMW', logoUrl: '', address: '', contactEmail: '', contactPhone: '' });
  const [savingOrg, setSavingOrg] = useState(false);
  const [tenantMode, setTenantMode] = useState<number>(0);

  // ── Contract Template ────────────────────────────────────────────────────────
  const [contractTemplate, setContractTemplate] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // ── Financial & Markups ──────────────────────────────────────────────────────
  const [finForm, setFinForm] = useState({ partsMarkup: '20.0', laborBillingRate: '400.0', laborMarkup: '10.0' });
  const [savingFin, setSavingFin] = useState(false);

  const handleSaveFin = async () => {
    setSavingFin(true);
    try {
      await settingsApi.upsert('Fin.DefaultPartsMarkupPercent', finForm.partsMarkup, 'Default parts markup percentage', 'Financial & Markups');
      await settingsApi.upsert('Fin.DefaultLaborBillingRate', finForm.laborBillingRate, 'Default labor billing rate per hour', 'Financial & Markups');
      await settingsApi.upsert('Fin.DefaultLaborMarkupPercent', finForm.laborMarkup, 'Default labor markup percentage', 'Financial & Markups');
      show('Financial & markup settings saved');
    } catch (e: any) {
      show(e.message || 'Failed to save financial settings', 'error');
    } finally {
      setSavingFin(false);
    }
  };

  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    try {
      await settingsApi.upsert('Hr.ContractTemplate', contractTemplate, 'Default employment contract template', 'Hr');
      show('Contract template saved');
    } catch (e: any) {
      show(e.message || 'Failed to save', 'error');
    } finally {
      setSavingTemplate(false);
    }
  };

  // ── Departments ──────────────────────────────────────────────────────────────
  
  
  

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
  const [usersCount, setUsersCount] = useState(0);
  const [editUser, setEditUser] = useState<any>(null);

  // ── Seed ─────────────────────────────────────────────────────────────────────
  const [seeding, setSeeding] = useState(false);

  // ── Integrations (SMTP) ──────────────────────────────────────────────────────
  const [smtpForm, setSmtpForm] = useState({
    Smtp_Host: '', Smtp_Port: '587', Smtp_User: '', Smtp_Pass: '',
    Email_From_Name: '', Email_From_Address: ''
  });
  const [showSmtpModal, setShowSmtpModal] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [isSmtpConfigured, setIsSmtpConfigured] = useState(false);

  // ─── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setProfileForm({ firstName: user?.firstName || '', lastName: user?.lastName || '' });

    subscriptionsApi.getCurrent()
      .then(r => setSubscriptionData(r))
      .catch(() => setSubscriptionData(null));
    subscriptionsApi.getPlans().then(setAllPlans).catch(() => {});

    
    referenceDataApi.getJobTypes().then(setJobTypes).catch(() => setJobTypes([]));
    referenceDataApi.getDowntimeCategories().then(setDowntimeCategories).catch(() => setDowntimeCategories([]));

    settingsApi.getAll().then((all: any[]) => {
      if (!Array.isArray(all)) return;
      const g = (k: string, fb: string) => all.find((s: any) => s.key === k)?.value ?? fb;
      setOrgForm(prev => ({
        ...prev,
        name: g('Org.Name', prev.name || ''),
        currency: g('Org.Currency', prev.currency || 'ZMW'),
      }));
      setFinForm({
        partsMarkup: g('Fin.DefaultPartsMarkupPercent', '20.0'),
        laborBillingRate: g('Fin.DefaultLaborBillingRate', '400.0'),
        laborMarkup: g('Fin.DefaultLaborMarkupPercent', '10.0'),
      });
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
      setSmtpForm({
        Smtp_Host: g('Smtp_Host', ''),
        Smtp_Port: g('Smtp_Port', '587'),
        Smtp_User: g('Smtp_User', ''),
        Smtp_Pass: g('Smtp_Pass', ''),
        Email_From_Name: g('Email_From_Name', ''),
        Email_From_Address: g('Email_From_Address', ''),
      });
      setContractTemplate(g('Hr.ContractTemplate', DEFAULT_CONTRACT_TEMPLATE));
      setIsSmtpConfigured(!!g('Smtp_Host', ''));
    }).catch(() => {});

    if (user?.tenantId) {
      tenantsApi.getById(user.tenantId).then((t: any) => {
        if (t) {
          setOrgForm(prev => ({
            ...prev,
            name: t.name || prev.name,
            logoUrl: t.logoUrl || '',
            address: t.address || '',
            contactEmail: t.contactEmail || '',
            contactPhone: t.contactPhone || '',
          }));
          setTenantMode(t.operationMode || 0);
        }
      }).catch(e => console.error("Failed to fetch tenant details", e));
    }
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
    if (activeTab === 'billing') {
      usersApi.getAll().then(list => setUsersCount(list?.length ?? 0)).catch(() => {});
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
      await settingsApi.updateMyTenant({
        name: orgForm.name,
        logoUrl: orgForm.logoUrl,
        address: orgForm.address,
        contactEmail: orgForm.contactEmail,
        contactPhone: orgForm.contactPhone,
      });
      await settingsApi.upsert('Org.Name', orgForm.name, 'Organisation name', 'Org');
      await settingsApi.upsert('Org.Currency', orgForm.currency, 'Default currency', 'Org');
      show('Workspace settings saved');
    } catch (e: any) { show(e.message || 'Failed to save', 'error'); }
    finally { setSavingOrg(false); }
  };

  

  

  const handleSaveDictionary = async () => {
    setSavingDict(true);
    try {
      for (const [key, value] of Object.entries(dictState)) {
        await settingsApi.upsert(`Dict.${key}`, value);
      }
      await refreshDictionary();
      show('Terminology updated across the application');
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
      setJobTypes(d => d.filter((x: any) => x.id !== id));
      show('Job type removed');
    } catch (e: any) { show(e.message || 'Failed to delete', 'error'); }
  };

  const handleSaveSmtp = async () => {
    setSavingSmtp(true);
    try {
      await settingsApi.upsert('Smtp_Host', smtpForm.Smtp_Host, 'SMTP Host Address', 'Integrations');
      await settingsApi.upsert('Smtp_Port', smtpForm.Smtp_Port, 'SMTP Port', 'Integrations');
      await settingsApi.upsert('Smtp_User', smtpForm.Smtp_User, 'SMTP Username', 'Integrations');
      await settingsApi.upsert('Smtp_Pass', smtpForm.Smtp_Pass, 'SMTP Password', 'Integrations');
      await settingsApi.upsert('Email_From_Name', smtpForm.Email_From_Name, 'Email From Name', 'Integrations');
      await settingsApi.upsert('Email_From_Address', smtpForm.Email_From_Address, 'Email From Address', 'Integrations');
      setIsSmtpConfigured(!!smtpForm.Smtp_Host);
      setShowSmtpModal(false);
      show('SMTP configuration saved successfully');
    } catch (e: any) {
      show(e.message || 'Failed to save SMTP configuration', 'error');
    } finally {
      setSavingSmtp(false);
    }
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



  const handleUpgrade = async (planId: number) => {
    setUpgrading(true);
    try {
      const res = await subscriptionsApi.upgrade({ planId });
      show((res as any)?.message || 'Plan upgrade requested');
      setShowUpgradeModal(false);
      subscriptionsApi.getCurrent().then(setSubscriptionData).catch(() => {});
    } catch (e: any) { show(e.message || 'Upgrade failed', 'error'); }
    finally { setUpgrading(false); }
  };

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
          <SectionCard title="Organisation Settings" subtitle="Your company logo, name, and address details" icon={<Building2 size={16} />}
            footer={<SaveBtn loading={savingOrg} onClick={handleSaveOrg} />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <FormRow label="Organisation Name">
                <input className="form-input" value={orgForm.name} onChange={e => setOrgForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Acme Mining Corp" />
              </FormRow>

              <FormRow label="Company Logo" hint="Recommended: Square or horizontal layout with transparent background. Max 10MB.">
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '5px' }}>
                  <div style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '12px',
                    background: 'var(--bg-hover)',
                    border: '2px dashed var(--border-default)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    {orgForm.logoUrl ? (
                      <img src={orgForm.logoUrl} alt="Logo preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <Building2 size={28} style={{ color: 'var(--text-muted)' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className="btn btn-sm" style={{ cursor: 'pointer', background: 'var(--accent-blue)', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Save size={14} /> Upload Logo
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            show('Logo must be smaller than 2MB', 'error');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const base64Url = event.target?.result as string;
                            setOrgForm(f => ({ ...f, logoUrl: base64Url }));
                            show('Logo uploaded. Click Save Changes to apply.');
                          };
                          reader.onerror = () => {
                            show('Failed to read logo file', 'error');
                          };
                          reader.readAsDataURL(file);
                        }
                      }} />
                    </label>
                    {orgForm.logoUrl && (
                      <button className="btn btn-sm" style={{ background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }} onClick={() => setOrgForm(f => ({ ...f, logoUrl: '' }))}>
                        Remove Logo
                      </button>
                    )}
                  </div>
                </div>
              </FormRow>

              <FormRow label="Company Address">
                <textarea className="form-input" style={{ minHeight: '60px' }} value={orgForm.address || ''} onChange={e => setOrgForm(f => ({ ...f, address: e.target.value }))} placeholder="e.g. Plot 102, Great North Road, Lusaka, Zambia" />
              </FormRow>

              <div className="settings-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormRow label="Contact Email" hint="For client communications and invoices">
                  <input className="form-input" value={orgForm.contactEmail || ''} onChange={e => setOrgForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="e.g. contact@company.com" />
                </FormRow>
                <FormRow label="Contact Phone" hint="For general enquiries">
                  <input className="form-input" value={orgForm.contactPhone || ''} onChange={e => setOrgForm(f => ({ ...f, contactPhone: e.target.value }))} placeholder="e.g. +260 970000000" />
                </FormRow>
              </div>

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
            <SectionCard title="Financial & Markup Defaults" subtitle="Set your default profit margins and hourly billing rates applied directly to new quotations" icon={<CreditCard size={16} />}
              footer={<SaveBtn loading={savingFin} onClick={handleSaveFin} />}>
              <div className="settings-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <FormRow label="Default Parts Markup (%)" hint="Markup added to the inventory/parts cost (e.g. 20%)">
                  <input className="form-input" type="number" step="0.1" min="0" value={finForm.partsMarkup} onChange={e => setFinForm({ ...finForm, partsMarkup: e.target.value })} />
                </FormRow>
                <FormRow label="Default Labor Billing Rate (per hour)" hint={`Hourly billing rate charged to clients (in ${orgForm.currency || 'ZMW'})`}>
                  <input className="form-input" type="number" step="0.01" min="0" value={finForm.laborBillingRate} onChange={e => setFinForm({ ...finForm, laborBillingRate: e.target.value })} />
                </FormRow>
                <FormRow label="Default Labor Markup (%)" hint="Extra profit markup applied to labor billing (e.g. 10%)">
                  <input className="form-input" type="number" step="0.1" min="0" value={finForm.laborMarkup} onChange={e => setFinForm({ ...finForm, laborMarkup: e.target.value })} />
                </FormRow>
              </div>
            </SectionCard>
          )}

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
      

      // ── Contract Template ──────────────────────────────────────────────────
      case 'templates': return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SectionCard title="Default Contract Template" subtitle="Customize the template text used when drafting contracts for employees" icon={<FileText size={16} />}
            footer={<SaveBtn loading={savingTemplate} onClick={handleSaveTemplate} />}>
            <div style={{ display: 'flex', gap: 24, flexDirection: 'column' }}>
              <div style={{ padding: '12px 16px', background: 'var(--accent-blue-dim)', border: '1px solid var(--accent-blue-border)', borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-blue)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Info size={14} /> Merge Tags Cheat-Sheet
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  You can use the following tags inside the template. The system will dynamically replace them with actual values when generating a draft:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px 16px', marginTop: 12 }}>
                  <div style={{ fontSize: 11.5 }}><code style={{ background: 'var(--bg-hover)', padding: '2px 4px', borderRadius: 4 }}>{"{{EmployeeName}}"}</code> — Full Name of employee</div>
                  <div style={{ fontSize: 11.5 }}><code style={{ background: 'var(--bg-hover)', padding: '2px 4px', borderRadius: 4 }}>{"{{Company}}"}</code> — Tenant organization name</div>
                  <div style={{ fontSize: 11.5 }}><code style={{ background: 'var(--bg-hover)', padding: '2px 4px', borderRadius: 4 }}>{"{{JobTitle}}"}</code> — Employee's role/job title</div>
                  <div style={{ fontSize: 11.5 }}><code style={{ background: 'var(--bg-hover)', padding: '2px 4px', borderRadius: 4 }}>{"{{Salary}}"}</code> — Agreed monthly salary</div>
                  <div style={{ fontSize: 11.5 }}><code style={{ background: 'var(--bg-hover)', padding: '2px 4px', borderRadius: 4 }}>{"{{WorkingHours}}"}</code> — Standard hours per month</div>
                  <div style={{ fontSize: 11.5 }}><code style={{ background: 'var(--bg-hover)', padding: '2px 4px', borderRadius: 4 }}>{"{{StartDate}}"}</code> — Employment start date</div>
                  <div style={{ fontSize: 11.5 }}><code style={{ background: 'var(--bg-hover)', padding: '2px 4px', borderRadius: 4 }}>{"{{EndDateClause}}"}</code> — Fixed term end date clause</div>
                  <div style={{ fontSize: 11.5 }}><code style={{ background: 'var(--bg-hover)', padding: '2px 4px', borderRadius: 4 }}>{"{{NoticePeriod}}"}</code> — Required days notice</div>
                  <div style={{ fontSize: 11.5 }}><code style={{ background: 'var(--bg-hover)', padding: '2px 4px', borderRadius: 4 }}>{"{{CurrentDate}}"}</code> — Today's current date</div>
                </div>
              </div>
              <FormRow label="Template Body">
                <textarea className="form-input" style={{ minHeight: '350px', fontFamily: 'monospace', fontSize: 13, lineHeight: '1.6' }}
                  value={contractTemplate} onChange={e => setContractTemplate(e.target.value)}
                  placeholder="Type your contract template here..." />
              </FormRow>
            </div>
          </SectionCard>
        </div>
      );

      // ── Terminology ───────────────────────────────────────────────────────
      case 'dictionary': return (
        <SectionCard title="Custom Terminology" subtitle="Rename core terms to match your industry — changes apply everywhere in the platform"
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
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>&quot;{term.default}&quot;</div>
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
                { id: 'email',   icon: '📧', name: 'Email (SMTP)',      status: isSmtpConfigured ? 'configured' : 'not-configured', desc: 'Send job notifications and reports by email' },
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
                      onClick={() => intg.id === 'email' ? setShowSmtpModal(true) : show(`${intg.name} configuration coming soon`, 'info')}>
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



      // ── Billing ────────────────────────────────────────────────────────────
      case 'billing': return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SectionCard title={`Current Plan: ${subscriptionData?.plan?.name || 'Anchor Pro'}`} subtitle={subscriptionData?.plan?.description || 'Full Access'} icon={<CreditCard size={16} />}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, fontFamily: 'Barlow Condensed, sans-serif' }}>
                  K {(subscriptionData?.plan?.priceMonthly || 0).toLocaleString()}
                  <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>/mo</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--accent-blue)', marginTop: 6, fontWeight: 600 }}>
                  {subscriptionData?.subscription?.status === 'Trial' ? `Trial active · ${subscriptionData.daysRemaining} days remaining` : 'Billed monthly · Cancel anytime'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-primary btn-sm" onClick={() => setShowUpgradeModal(true)}>Change Plan</button>
              </div>
            </div>
            <div className="settings-grid-3">
              {[
                { label: 'Team Members', used: usersCount, max: 'Unlimited', unit: 'users' },
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
            const active = subscriptionData?.plan?.id === plan.id;
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
            <label className="form-label" style={{ color: 'var(--accent-rose)' }}>Type &quot;PERMANENTLY DELETE&quot; to confirm</label>
            <input className="form-input" placeholder="" />
          </div>
          <button className="btn btn-primary" style={{ background: 'var(--accent-rose)', border: 'none', width: '100%' }}>
            Delete Everything
          </button>
        </div>
      </SlideOver>

      {/* Invite User Slide */}


      {/* SMTP Configuration Slide */}
      <SlideOver open={showSmtpModal} onClose={() => setShowSmtpModal(false)} title="Email (SMTP) Configuration" subtitle="Configure your email provider to send notifications and reports.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="settings-grid-2" style={{ gap: 14 }}>
            <div className="form-field">
              <label className="form-label">SMTP Host *</label>
              <input className="form-input" value={smtpForm.Smtp_Host} onChange={e => setSmtpForm(f => ({ ...f, Smtp_Host: e.target.value }))} placeholder="smtp.example.com" />
            </div>
            <div className="form-field">
              <label className="form-label">SMTP Port *</label>
              <input className="form-input" value={smtpForm.Smtp_Port} onChange={e => setSmtpForm(f => ({ ...f, Smtp_Port: e.target.value }))} placeholder="587" />
            </div>
          </div>
          <div className="settings-grid-2" style={{ gap: 14 }}>
            <div className="form-field">
              <label className="form-label">Username</label>
              <input className="form-input" value={smtpForm.Smtp_User} onChange={e => setSmtpForm(f => ({ ...f, Smtp_User: e.target.value }))} placeholder="user@example.com" />
            </div>
            <div className="form-field">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={smtpForm.Smtp_Pass} onChange={e => setSmtpForm(f => ({ ...f, Smtp_Pass: e.target.value }))} placeholder="••••••••" />
            </div>
          </div>
          <div className="settings-grid-2" style={{ gap: 14 }}>
            <div className="form-field">
              <label className="form-label">From Name</label>
              <input className="form-input" value={smtpForm.Email_From_Name} onChange={e => setSmtpForm(f => ({ ...f, Email_From_Name: e.target.value }))} placeholder="Anchor Pro Notifications" />
            </div>
            <div className="form-field">
              <label className="form-label">From Address *</label>
              <input className="form-input" type="email" value={smtpForm.Email_From_Address} onChange={e => setSmtpForm(f => ({ ...f, Email_From_Address: e.target.value }))} placeholder="no-reply@example.com" />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleSaveSmtp} disabled={savingSmtp || !smtpForm.Smtp_Host}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}>
            {savingSmtp ? <><Loader2 size={14} className="spin" />Saving...</> : <><Save size={14} />Save Configuration</>}
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
          <div className="settings-sidebar" style={{ minWidth: 0 }}>
            <div className="card settings-sidebar-card">
              {NAV_GROUPS.map(group => {
                const showGroup = group.label === 'Account' || (user?.tenantId && isAdmin);
                if (!showGroup) return null;
                if (group.label === 'Operations' && tenantMode === 1) return null;
                return (
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
                );
              })}
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
