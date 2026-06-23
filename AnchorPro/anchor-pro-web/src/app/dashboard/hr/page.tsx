'use client';

import { useState, useEffect } from 'react';
import { hrApi, departmentsApi } from '@/lib/api';
import {
  Users, FileText, DollarSign, Clock, Plus, Search,
  ChevronRight, AlertCircle, CheckCircle, X, Edit,
  Shield, Briefcase, Phone, Home, CreditCard, Upload,
  Calendar, TrendingUp, Eye, Download
} from 'lucide-react';
import ResponsiveTable from '@/components/ResponsiveTable';

// ─── Status Maps ───────────────────────────────────────────────────────────────
const contractStatusMap: Record<number, { label: string; badge: string }> = {
  0: { label: 'Draft',      badge: 'badge-muted'  },
  1: { label: 'Active',     badge: 'badge-green'  },
  2: { label: 'Expired',    badge: 'badge-rose'   },
  3: { label: 'Terminated', badge: 'badge-rose'   },
};

const contractTypeMap: Record<number, string> = {
  0: 'Permanent', 1: 'Fixed-Term', 2: 'Probation', 3: 'Casual',
};

const employmentTypeMap: Record<string, string> = {
  FullTime: 'Full-Time', PartTime: 'Part-Time', Contract: 'Contract', Casual: 'Casual',
};

const payrollStatusMap: Record<number, { label: string; badge: string }> = {
  0: { label: 'Draft',     badge: 'badge-muted'   },
  1: { label: 'Finalised', badge: 'badge-blue'    },
  2: { label: 'Paid',      badge: 'badge-green'   },
};

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();
}

function fmt(n: number) {
  return `ZMW ${n.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function daysUntilExpiry(endDate?: string | null) {
  if (!endDate) return null;
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  return diff;
}

// ─── Main Component ───────────────────────────────────────────────────────────
type Tab = 'employees' | 'contracts' | 'payroll';

export default function HRPage() {
  const [activeTab, setActiveTab] = useState<Tab>('employees');

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={22} className="text-accent-blue" /> Human Resources
          </h1>
          <p className="page-subtitle">Manage employees, employment contracts and payroll</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border-subtle)' }}>
        {([
          { key: 'employees', label: 'Employees',    icon: <Users size={13} /> },
          { key: 'contracts', label: 'Contracts',    icon: <FileText size={13} /> },
          { key: 'payroll',   label: 'Payroll',      icon: <DollarSign size={13} /> },
        ] as { key: Tab; label: string; icon: React.ReactNode }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 13,
              fontWeight: activeTab === tab.key ? 700 : 400,
              color: activeTab === tab.key ? 'var(--accent-blue)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.key ? '2px solid var(--accent-blue)' : '2px solid transparent',
              marginBottom: -1,
              transition: 'all 0.15s',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'employees' && <EmployeesTab />}
      {activeTab === 'contracts' && <ContractsTab />}
      {activeTab === 'payroll'   && <PayrollTab />}
    </div>
  );
}

// ─── Employees Tab ────────────────────────────────────────────────────────────
function EmployeesTab() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [profileTab, setProfileTab] = useState<'personal' | 'bank' | 'employment' | 'documents'>('personal');
  const [saving, setSaving] = useState(false);
  const [editProfile, setEditProfile] = useState<any>({});

  const load = async () => {
    try {
      setLoading(true);
      const data = await hrApi.getEmployees();
      setEmployees(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openEmployee = async (emp: any) => {
    setSelected(emp);
    setProfileTab('personal');
    try {
      const p = await hrApi.getProfile(emp.userId);
      setProfile(p || {});
      setEditProfile(p || {});
    } catch { setProfile({}); setEditProfile({}); }
  };

  const saveProfile = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await hrApi.upsertProfile(selected.userId, { ...editProfile, userId: selected.userId });
      const p = await hrApi.getProfile(selected.userId);
      setProfile(p || {});
      setEditProfile(p || {});
    } finally {
      setSaving(false);
    }
  };

  const filtered = employees.filter(e =>
    `${e.firstName} ${e.lastName} ${e.email} ${e.employeeNumber ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="search-input" style={{ width: '100%', paddingLeft: 30 }} placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Loading employees...</div>
        ) : (
          <ResponsiveTable>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Type</th>
                  <th>Start Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No employees found.</td></tr>
                ) : filtered.map(emp => (
                  <tr key={emp.userId}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar-sm" style={{ background: 'var(--accent-blue)', color: '#fff', fontWeight: 700 }}>
                          {initials(emp.firstName, emp.lastName)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{emp.firstName} {emp.lastName}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-blue">{emp.role || '—'}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{emp.department || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{emp.employmentType ? employmentTypeMap[emp.employmentType] ?? emp.employmentType : '—'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                      {emp.employmentStartDate ? new Date(emp.employmentStartDate).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <span className={`badge ${emp.isActive ? 'badge-green' : 'badge-rose'}`}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEmployee(emp)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Eye size={13} /> View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ResponsiveTable>
        )}
      </div>

      {/* Employee Profile Slide-Over */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex' }} onClick={() => setSelected(null)}>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} />
          <div
            className="card-elevated animate-in"
            style={{ width: 560, height: '100%', overflowY: 'auto', borderRadius: 0, padding: 0 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="avatar" style={{ background: 'var(--accent-blue)', color: '#fff', fontWeight: 700, fontSize: 18, width: 52, height: 52, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {initials(selected.firstName, selected.lastName)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-primary)' }}>{selected.firstName} {selected.lastName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selected.jobTitle || selected.role} · #{selected.employeeNumber || 'No employee #'}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>

            {/* Profile Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', padding: '0 24px' }}>
              {(['personal', 'bank', 'employment', 'documents'] as const).map(t => (
                <button key={t} onClick={() => setProfileTab(t)} style={{
                  padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: profileTab === t ? 700 : 400, textTransform: 'capitalize',
                  color: profileTab === t ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  borderBottom: profileTab === t ? '2px solid var(--accent-blue)' : '2px solid transparent',
                  marginBottom: -1,
                }}>{t === 'bank' ? '🏦 Bank Details' : t === 'personal' ? '👤 Personal' : t === 'employment' ? '💼 Employment' : '📄 Documents'}</button>
              ))}
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Personal Tab */}
              {profileTab === 'personal' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <ProfileField label="Date of Birth" value={editProfile.dateOfBirth?.split('T')[0] || ''} type="date" onChange={v => setEditProfile({ ...editProfile, dateOfBirth: v })} />
                    <ProfileField label="Gender" value={editProfile.gender || ''} type="select" options={['Male','Female','Other']} onChange={v => setEditProfile({ ...editProfile, gender: v })} />
                    <ProfileField label="Nationality" value={editProfile.nationality || ''} onChange={v => setEditProfile({ ...editProfile, nationality: v })} />
                    <ProfileField label="National ID / Passport" value={editProfile.nationalIdNumber || ''} onChange={v => setEditProfile({ ...editProfile, nationalIdNumber: v })} />
                    <ProfileField label="Marital Status" value={editProfile.maritalStatus || ''} type="select" options={['Single','Married','Divorced','Widowed']} onChange={v => setEditProfile({ ...editProfile, maritalStatus: v })} />
                    <ProfileField label="Personal Phone" value={editProfile.personalPhone || ''} onChange={v => setEditProfile({ ...editProfile, personalPhone: v })} />
                  </div>
                  <ProfileField label="Personal Email" value={editProfile.personalEmail || ''} onChange={v => setEditProfile({ ...editProfile, personalEmail: v })} />
                  <ProfileField label="Home Address" value={editProfile.homeAddress || ''} type="textarea" onChange={v => setEditProfile({ ...editProfile, homeAddress: v })} />

                  <div style={{ marginTop: 8, padding: 14, background: 'var(--surface-secondary)', borderRadius: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: 'var(--text-primary)' }}>🚨 Emergency Contact</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <ProfileField label="Name" value={editProfile.emergencyContactName || ''} onChange={v => setEditProfile({ ...editProfile, emergencyContactName: v })} />
                      <ProfileField label="Relationship" value={editProfile.emergencyContactRelation || ''} onChange={v => setEditProfile({ ...editProfile, emergencyContactRelation: v })} />
                      <ProfileField label="Phone Number" value={editProfile.emergencyContactPhone || ''} onChange={v => setEditProfile({ ...editProfile, emergencyContactPhone: v })} />
                    </div>
                  </div>
                </>
              )}

              {/* Bank Details Tab */}
              {profileTab === 'bank' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ padding: 12, background: 'rgba(var(--accent-amber-rgb), 0.1)', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <Shield size={14} style={{ color: 'var(--accent-amber)', marginTop: 1, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--accent-amber)' }}>Bank details are confidential. Only Admin and HR roles can view or edit this information.</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <ProfileField label="Bank Name" value={editProfile.bankName || ''} onChange={v => setEditProfile({ ...editProfile, bankName: v })} />
                    <ProfileField label="Branch" value={editProfile.bankBranch || ''} onChange={v => setEditProfile({ ...editProfile, bankBranch: v })} />
                    <ProfileField label="Account Number" value={editProfile.bankAccountNumber || ''} onChange={v => setEditProfile({ ...editProfile, bankAccountNumber: v })} />
                    <ProfileField label="Account Type" value={editProfile.bankAccountType || ''} type="select" options={['Savings','Cheque','Current']} onChange={v => setEditProfile({ ...editProfile, bankAccountType: v })} />
                  </div>
                </div>
              )}

              {/* Employment Tab */}
              {profileTab === 'employment' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <ProfileField label="Job Title" value={editProfile.jobTitle || ''} onChange={v => setEditProfile({ ...editProfile, jobTitle: v })} />
                  <ProfileField label="Employment Type" value={editProfile.employmentType ?? 0} type="select" options={['FullTime','PartTime','Contract','Casual']} onChange={v => setEditProfile({ ...editProfile, employmentType: v })} />
                  <ProfileField label="Start Date" value={editProfile.employmentStartDate?.split('T')[0] || ''} type="date" onChange={v => setEditProfile({ ...editProfile, employmentStartDate: v })} />
                </div>
              )}

              {/* Documents Tab */}
              {profileTab === 'documents' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ padding: 14, border: '1px dashed var(--border-subtle)', borderRadius: 8, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Upload size={20} style={{ marginBottom: 6 }} />
                    <div style={{ fontSize: 13 }}>Document upload coming soon</div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>ID documents, contracts, certificates</div>
                  </div>
                  {editProfile.profilePhotoUrl && (
                    <a href={editProfile.profilePhotoUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">View Profile Photo</a>
                  )}
                  {editProfile.idDocumentUrl && (
                    <a href={editProfile.idDocumentUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">View ID Document</a>
                  )}
                </div>
              )}

              {/* Save Button */}
              {profileTab !== 'documents' && (
                <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Contracts Tab ────────────────────────────────────────────────────────────
function ContractsTab() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({ contractType: 0, status: 1, noticePeriodDays: 30, hourlyRate: 0, agreedMonthlySalary: 0, jobTitle: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [c, e] = await Promise.all([hrApi.getAllContracts(), hrApi.getEmployees()]);
      setContracts(c || []);
      setEmployees(e || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const expiringSoon = contracts.filter(c => {
    const days = daysUntilExpiry(c.endDate);
    return days !== null && days >= 0 && days <= 30;
  });

  const filtered = contracts.filter(c => {
    const name = `${c.user?.firstName ?? ''} ${c.user?.lastName ?? ''} ${c.jobTitle ?? ''}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await hrApi.createContract(form);
      setShowForm(false);
      setForm({ contractType: 0, status: 1, noticePeriodDays: 30, hourlyRate: 0, agreedMonthlySalary: 0, jobTitle: '' });
      load();
    } finally { setSaving(false); }
  };

  return (
    <>
      {expiringSoon.length > 0 && (
        <div style={{ padding: '12px 16px', background: 'rgba(var(--accent-amber-rgb), 0.1)', border: '1px solid var(--accent-amber)', borderRadius: 10, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertCircle size={15} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'var(--accent-amber)', fontWeight: 500 }}>
            ⚠️ {expiringSoon.length} employment contract{expiringSoon.length > 1 ? 's' : ''} expiring within 30 days — review and renew as needed.
          </span>
        </div>
      )}

      <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="search-input" style={{ width: '100%', paddingLeft: 30 }} placeholder="Search by name, title..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => setShowForm(true)}>
            <Plus size={13} /> New Contract
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Loading contracts...</div>
        ) : (
          <ResponsiveTable>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Job Title</th>
                  <th>Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Monthly Salary</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No contracts found.</td></tr>
                ) : filtered.map(c => {
                  const days = daysUntilExpiry(c.endDate);
                  const isExpiringSoon = days !== null && days >= 0 && days <= 30;
                  return (
                    <tr key={c.id} style={{ background: isExpiringSoon ? 'rgba(var(--accent-amber-rgb), 0.04)' : undefined }}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.user?.firstName} {c.user?.lastName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.user?.email}</div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{c.jobTitle}</td>
                      <td><span className="badge badge-muted">{contractTypeMap[c.contractType] || '—'}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(c.startDate).toLocaleDateString()}</td>
                      <td style={{ fontSize: 12 }}>
                        {c.endDate ? (
                          <span style={{ color: isExpiringSoon ? 'var(--accent-amber)' : 'var(--text-secondary)', fontWeight: isExpiringSoon ? 600 : 400 }}>
                            {new Date(c.endDate).toLocaleDateString()}
                            {isExpiringSoon && ` (${days}d left)`}
                          </span>
                        ) : <span style={{ color: 'var(--text-muted)' }}>Permanent</span>}
                      </td>
                      <td style={{ fontWeight: 600 }}>{fmt(c.agreedMonthlySalary)}</td>
                      <td><span className={`badge ${contractStatusMap[c.status]?.badge || 'badge-muted'}`}>{contractStatusMap[c.status]?.label || '—'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ResponsiveTable>
        )}
      </div>

      {/* New Contract Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content animate-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h2 className="modal-title">New Employment Contract</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Employee *</label>
                  <select className="form-control" value={form.userId || ''} onChange={e => setForm({ ...form, userId: e.target.value })} required>
                    <option value="">Select employee...</option>
                    {employees.map(emp => (
                      <option key={emp.userId} value={emp.userId}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Job Title *</label>
                  <input className="form-control" value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Contract Type</label>
                    <select className="form-control" value={form.contractType} onChange={e => setForm({ ...form, contractType: Number(e.target.value) })}>
                      <option value={0}>Permanent</option>
                      <option value={1}>Fixed-Term</option>
                      <option value={2}>Probation</option>
                      <option value={3}>Casual</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: Number(e.target.value) })}>
                      <option value={0}>Draft</option>
                      <option value={1}>Active</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input type="date" className="form-control" value={form.startDate || ''} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date (leave blank if permanent)</label>
                    <input type="date" className="form-control" value={form.endDate || ''} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monthly Salary (ZMW)</label>
                    <input type="number" step="0.01" className="form-control" value={form.agreedMonthlySalary} onChange={e => setForm({ ...form, agreedMonthlySalary: parseFloat(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hourly Rate (ZMW)</label>
                    <input type="number" step="0.01" className="form-control" value={form.hourlyRate} onChange={e => setForm({ ...form, hourlyRate: parseFloat(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notice Period (days)</label>
                    <input type="number" className="form-control" value={form.noticePeriodDays} onChange={e => setForm({ ...form, noticePeriodDays: parseInt(e.target.value) })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-control" rows={2} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Create Contract'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Payroll Tab ──────────────────────────────────────────────────────────────
function PayrollTab() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState<any | null>(null);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loadingPayslips, setLoadingPayslips] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1);
  const [newYear, setNewYear] = useState(new Date().getFullYear());
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await hrApi.getPayrollRuns();
      setRuns(data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openRun = async (run: any) => {
    setSelectedRun(run);
    setLoadingPayslips(true);
    try {
      const data = await hrApi.getPayslips(run.id);
      setPayslips(data || []);
    } finally { setLoadingPayslips(false); }
  };

  const handleCreate = async () => {
    setCreating(true);
    setCreateError('');
    try {
      await hrApi.createPayrollRun(newMonth, newYear);
      setShowCreate(false);
      load();
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create payroll run');
    } finally { setCreating(false); }
  };

  const handleFinalise = async (id: number) => {
    if (!confirm('Finalise this payroll run? No further edits can be made.')) return;
    await hrApi.finalisePayrollRun(id);
    load();
    if (selectedRun?.id === id) setSelectedRun((r: any) => ({ ...r, status: 1 }));
  };

  const handleMarkPaid = async (id: number) => {
    if (!confirm('Mark this payroll run as Paid?')) return;
    await hrApi.markPayrollRunPaid(id);
    load();
    if (selectedRun?.id === id) setSelectedRun((r: any) => ({ ...r, status: 2 }));
  };

  if (selectedRun) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedRun(null)}>← Back</button>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>
            Payroll Run — {MONTHS[selectedRun.periodMonth - 1]} {selectedRun.periodYear}
          </h2>
          <span className={`badge ${payrollStatusMap[selectedRun.status]?.badge}`}>{payrollStatusMap[selectedRun.status]?.label}</span>
          <div style={{ flex: 1 }} />
          {selectedRun.status === 0 && (
            <button className="btn btn-primary btn-sm" onClick={() => handleFinalise(selectedRun.id)}>Finalise Run</button>
          )}
          {selectedRun.status === 1 && (
            <button className="btn btn-primary btn-sm" onClick={() => handleMarkPaid(selectedRun.id)}>Mark as Paid</button>
          )}
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total Gross', value: fmt(selectedRun.totalGross), color: 'var(--accent-blue)' },
            { label: 'Total Deductions', value: fmt(selectedRun.totalDeductions), color: 'var(--accent-rose)' },
            { label: 'Total Net Pay', value: fmt(selectedRun.totalNet), color: 'var(--accent-emerald)' },
            { label: 'Employer NAPSA', value: fmt(selectedRun.totalEmployerNapsa), color: 'var(--accent-amber)' },
          ].map(card => (
            <div key={card.label} className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{card.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* Payslips Table */}
        <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
          {loadingPayslips ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Loading payslips...</div>
          ) : (
            <ResponsiveTable>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Basic Salary</th>
                    <th>Overtime</th>
                    <th>Gross Pay</th>
                    <th>PAYE</th>
                    <th>NAPSA</th>
                    <th>NHIMA</th>
                    <th style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>Net Pay</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payslips.length === 0 ? (
                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No payslips generated.</td></tr>
                  ) : payslips.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.user?.firstName} {p.user?.lastName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.user?.employeeNumber}</div>
                      </td>
                      <td style={{ fontFamily: 'monospace' }}>{fmt(p.basicSalary)}</td>
                      <td style={{ fontFamily: 'monospace' }}>
                        {p.overtimeHours > 0 ? (
                          <span title={`${p.overtimeHours}h × ZMW ${p.overtimeRate}`}>{fmt(p.overtimePay)}</span>
                        ) : '—'}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{fmt(p.grossPay)}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--accent-rose)' }}>({fmt(p.payeTax)})</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--accent-rose)' }}>({fmt(p.napsaEmployee)})</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--accent-rose)' }}>({fmt(p.nhimaContribution)})</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-emerald)' }}>{fmt(p.netPay)}</td>
                      <td><span className="badge badge-muted">{p.status === 2 ? 'Paid' : p.status === 1 ? 'Approved' : 'Pending'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ResponsiveTable>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setShowCreate(true)}>
          <Plus size={14} /> New Payroll Run
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>Loading payroll runs...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {runs.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              No payroll runs yet. Create your first one!
            </div>
          ) : runs.map(run => (
            <div key={run.id} className="card-elevated" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }} onClick={() => openRun(run)}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--surface-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1 }}>{MONTHS[run.periodMonth - 1].slice(0, 3)}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{run.periodYear}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {MONTHS[run.periodMonth - 1]} {run.periodYear} Payroll
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Run date: {new Date(run.runDate).toLocaleDateString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>{fmt(run.totalNet)} net</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmt(run.totalGross)} gross</div>
              </div>
              <span className={`badge ${payrollStatusMap[run.status]?.badge}`}>{payrollStatusMap[run.status]?.label}</span>
              <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
          ))}
        </div>
      )}

      {/* Create Payroll Run Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content animate-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="modal-title">New Payroll Run</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {createError && <div className="alert alert-danger">{createError}</div>}
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                The system will auto-populate payslips for all active employees using their contract rates and job card hours for this period.
              </p>
              <div className="form-group">
                <label className="form-label">Month</label>
                <select className="form-control" value={newMonth} onChange={e => setNewMonth(Number(e.target.value))}>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <input type="number" className="form-control" value={newYear} onChange={e => setNewYear(Number(e.target.value))} min={2020} max={2099} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                {creating ? 'Generating...' : 'Generate Payroll Run'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Reusable ProfileField ────────────────────────────────────────────────────
function ProfileField({ label, value, onChange, type = 'text', options }: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: 'text' | 'date' | 'select' | 'textarea';
  options?: string[];
}) {
  const style = { width: '100%' };
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {type === 'select' ? (
        <select className="form-control" style={style} value={value} onChange={e => onChange(e.target.value)}>
          <option value="">— Select —</option>
          {options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea className="form-control" style={style} rows={2} value={value} onChange={e => onChange(e.target.value)} />
      ) : (
        <input type={type} className="form-control" style={style} value={value} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}
