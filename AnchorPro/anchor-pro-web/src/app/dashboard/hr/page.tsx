'use client';

import React, { useState, useEffect, useRef } from 'react';
import { hrApi, departmentsApi, usersApi, equipmentApi, procurementApi, financeApi, uploadApi } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { hasPermission } from '@/lib/rbac';
import {
  Users, FileText, DollarSign, Clock, Plus, Search,
  ChevronRight, AlertCircle, CheckCircle, X, Edit, Trash2, ArrowLeft,
  Shield, Briefcase, Phone, Home, CreditCard, Upload,
  Calendar, TrendingUp, Eye, Download,
  ChevronDown, ChevronUp, Mail, User,
  Package, ShoppingCart, Receipt
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

function fmt(n: number | undefined | null) {
  if (n === null || n === undefined) return 'ZMW 0.00';
  return `ZMW ${n.toLocaleString('en-ZM', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function daysUntilExpiry(endDate?: string | null) {
  if (!endDate) return null;
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  return diff;
}

// ─── Main Component ───────────────────────────────────────────────────────────
type Tab = 'employees' | 'contracts' | 'payroll' | 'team' | 'departments';

export default function HRPage() {
  const [activeTab, setActiveTab] = useState<Tab>('employees');
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'team' || tab === 'employees' || tab === 'contracts' || tab === 'payroll') {
        setActiveTab(tab as Tab);
      }
    }
  }, []);

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
          { key: 'employees', label: 'Employees',       icon: <Users size={13} />,       perm: null },
          { key: 'contracts', label: 'Contracts',       icon: <FileText size={13} />,    perm: '/dashboard/hr:view_contracts' },
          { key: 'payroll',   label: 'Payroll',         icon: <DollarSign size={13} />,  perm: '/dashboard/hr:view_payroll' },
          { key: 'team',      label: 'User Management', icon: <Shield size={13} />,      perm: '/dashboard/hr:view_user_management' },
          { key: 'departments', label: 'Departments',   icon: <Briefcase size={13} />,   perm: null },
        ] as { key: Tab; label: string; icon: React.ReactNode; perm: string | null }[])
        .filter(tab => !tab.perm || hasPermission(tab.perm, user?.allowedRoutes || [], user?.isPlatformOwner ?? false))
        .map(tab => (
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
      {activeTab === 'team'      && <TeamTab />}
      {activeTab === 'departments' && <DepartmentsTab />}
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
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
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

  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>, field: string, setUploading: (val: boolean) => void) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    setUploading(true);
    try {
      const res = await uploadApi.upload(file);
      const url = res.url;
      await hrApi.upsertProfile(selected.userId, { ...editProfile, userId: selected.userId, [field]: url });
      setEditProfile((prev: any) => ({ ...prev, [field]: url }));
      setProfile((prev: any) => ({ ...prev, [field]: url }));
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const filtered = employees.filter(e =>
    `${e.firstName} ${e.lastName} ${e.email} ${e.employeeNumber ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      <div className="card-elevated" style={{ padding: 0, overflow: 'hidden', flex: 1 }}>
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

      {/* Employee Profile Detail Card */}
      {selected && (
        <div
          className="card-elevated animate-in"
          style={{ width: 480, flexShrink: 0, padding: 0 }}
        >
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="avatar-sm" style={{ background: 'var(--accent-blue)', color: '#fff', fontWeight: 700 }}>
              {initials(selected.firstName, selected.lastName)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{selected.firstName} {selected.lastName}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selected.jobTitle || selected.role} · #{selected.employeeNumber || 'No employee #'}</div>
            </div>
            <button className="icon-btn" onClick={() => setSelected(null)}><X size={16} /></button>
          </div>

          {/* Profile Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', padding: '0 20px' }}>
            {(['personal', 'bank', 'employment', 'documents'] as const).map(t => (
              <button key={t} onClick={() => setProfileTab(t)} style={{
                padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: profileTab === t ? 700 : 400, textTransform: 'capitalize',
                color: profileTab === t ? 'var(--accent-blue)' : 'var(--text-secondary)',
                borderBottom: profileTab === t ? '2px solid var(--accent-blue)' : '2px solid transparent',
                marginBottom: -1,
              }}>{t === 'bank' ? '🏦 Bank Details' : t === 'personal' ? '👤 Personal' : t === 'employment' ? '💼 Employment' : '📄 Documents'}</button>
            ))}
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ padding: 14, border: '1px solid var(--border-subtle)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Profile Photo</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Upload employee headshot</div>
                        {editProfile.profilePhotoUrl && (
                          <a href={editProfile.profilePhotoUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--accent-blue)', display: 'block', marginTop: 4 }}>View Current Photo</a>
                        )}
                      </div>
                      <div>
                        <input type="file" id="upload-profile-photo" style={{ display: 'none' }} accept="image/*" onChange={(e) => handleUploadDoc(e, 'profilePhotoUrl', setUploadingProfile)} />
                        <label htmlFor="upload-profile-photo" className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0, opacity: uploadingProfile ? 0.6 : 1, pointerEvents: uploadingProfile ? 'none' : 'auto' }}>
                          {uploadingProfile ? 'Uploading...' : <><Upload size={13} style={{ marginRight: 6 }} /> Upload</>}
                        </label>
                      </div>
                    </div>

                    <div style={{ padding: 14, border: '1px solid var(--border-subtle)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>ID Document</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Upload NRC, Passport, or Driver's License</div>
                        {editProfile.idDocumentUrl && (
                          <a href={editProfile.idDocumentUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--accent-blue)', display: 'block', marginTop: 4 }}>View Current ID</a>
                        )}
                      </div>
                      <div>
                        <input type="file" id="upload-id-document" style={{ display: 'none' }} onChange={(e) => handleUploadDoc(e, 'idDocumentUrl', setUploadingId)} />
                        <label htmlFor="upload-id-document" className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0, opacity: uploadingId ? 0.6 : 1, pointerEvents: uploadingId ? 'none' : 'auto' }}>
                          {uploadingId ? 'Uploading...' : <><Upload size={13} style={{ marginRight: 6 }} /> Upload</>}
                        </label>
                      </div>
                    </div>
                  </div>
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
      )}
    </div>
  );
}

// ─── Contracts Tab ────────────────────────────────────────────────────────────
function ContractsTab() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDraft, setShowDraft] = useState<any | null>(null);
  const [draftText, setDraftText] = useState('');
  const [form, setForm] = useState<any>({ 
    contractType: 0, 
    status: 1, 
    noticePeriodDays: 30, 
    hourlyRate: 0, 
    agreedMonthlySalary: 0, 
    jobTitle: '',
    standardHoursPerMonth: '',
    overtimeMultiplier: ''
  });
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
      setForm({ 
        contractType: 0, 
        status: 1, 
        noticePeriodDays: 30, 
        hourlyRate: 0, 
        agreedMonthlySalary: 0, 
        jobTitle: '',
        standardHoursPerMonth: '',
        overtimeMultiplier: ''
      });
      load();
      load();
    } finally { setSaving(false); }
  };

  const openDraftModal = (c: any) => {
    setShowDraft(c);
    if (c.contractBody) {
      setDraftText(c.contractBody);
    } else {
      const template = `EMPLOYMENT CONTRACT\n\nThis Employment Contract ("Contract") is made on ${new Date().toLocaleDateString()},\n\nEmployer: Anchor Pro (the "Company")\nEmployee: ${c.user?.firstName} ${c.user?.lastName} (the "Employee")\n\n1. POSITION AND DUTIES\nThe Employer agrees to employ the Employee as a ${c.jobTitle}. The Employee will perform duties as assigned by the Employer.\n\n2. COMPENSATION\nThe Employee will be paid a monthly salary of ZMW ${c.agreedMonthlySalary?.toLocaleString() ?? '0'}.\n\n3. WORKING HOURS\nStandard working hours are ${c.standardHoursPerMonth || 160} hours per month.\n\n4. TERM OF EMPLOYMENT\nThis contract commences on ${new Date(c.startDate).toLocaleDateString()} ${c.endDate ? `and terminates on ${new Date(c.endDate).toLocaleDateString()}` : 'and is on a permanent basis'}.\n\n5. TERMINATION\nEither party may terminate this contract by giving ${c.noticePeriodDays} days' written notice.\n\n6. CONFIDENTIALITY\nThe Employee agrees to keep confidential all proprietary information of the Employer.\n\nIN WITNESS WHEREOF, the parties have executed this Contract as of the date first above written.`;
      setDraftText(template);
    }
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showDraft) return;
    setSaving(true);
    try {
      await hrApi.updateContract(showDraft.id, { ...showDraft, contractBody: draftText });
      setShowDraft(null);
      load();
    } catch (err: any) {
      alert('Failed to save draft: ' + err.message);
    } finally {
      setSaving(false);
    }
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
                  <th>Std Hours</th>
                  <th>Multiplier</th>
                  <th>Monthly Salary</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No contracts found.</td></tr>
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
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.standardHoursPerMonth ? `${c.standardHoursPerMonth}h` : 'Default'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.overtimeMultiplier ? `${c.overtimeMultiplier}x` : 'Default'}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(c.agreedMonthlySalary)}</td>
                      <td><span className={`badge ${contractStatusMap[c.status]?.badge || 'badge-muted'}`}>{contractStatusMap[c.status]?.label || '—'}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openDraftModal(c)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FileText size={13} /> {c.contractBody ? 'Edit Contract' : 'Draft Contract'}
                          </button>
                          {c.contractBody && (
                            <a href={`/dashboard/contracts/${c.id}/print`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Download size={13} /> Print
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ResponsiveTable>
        )}
      </div>

      {/* Draft Contract Modal */}
      {showDraft && (
        <div className="modal-overlay" onClick={() => setShowDraft(null)}>
          <div className="modal-content animate-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 800, width: '90%' }}>
            <div className="modal-header">
              <h2 className="modal-title">Draft Employment Contract</h2>
              <button className="modal-close" onClick={() => setShowDraft(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveDraft}>
              <div className="modal-body">
                <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                  Review and edit the contract text below. This text will be used to generate the printable PDF contract.
                </div>
                <textarea 
                  className="form-input" 
                  style={{ width: '100%', minHeight: 400, fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.5 }} 
                  value={draftText} 
                  onChange={e => setDraftText(e.target.value)} 
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDraft(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Contract Text'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <select className="form-select" value={form.userId || ''} onChange={e => setForm({ ...form, userId: e.target.value })} required>
                    <option value="">Select employee...</option>
                    {employees.map(emp => (
                      <option key={emp.userId} value={emp.userId}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Job Title *</label>
                  <input className="form-input" value={form.jobTitle} onChange={e => setForm({ ...form, jobTitle: e.target.value })} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Contract Type</label>
                    <select className="form-select" value={form.contractType} onChange={e => setForm({ ...form, contractType: Number(e.target.value) })}>
                      <option value={0}>Permanent</option>
                      <option value={1}>Fixed-Term</option>
                      <option value={2}>Probation</option>
                      <option value={3}>Casual</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: Number(e.target.value) })}>
                      <option value={0}>Draft</option>
                      <option value={1}>Active</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input type="date" className="form-input" value={form.startDate || ''} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date (leave blank if permanent)</label>
                    <input type="date" className="form-input" value={form.endDate || ''} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monthly Salary (ZMW)</label>
                    <input type="number" step="0.01" className="form-input" value={form.agreedMonthlySalary} onChange={e => setForm({ ...form, agreedMonthlySalary: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hourly Rate (ZMW)</label>
                    <input type="number" step="0.01" className="form-input" value={form.hourlyRate} onChange={e => setForm({ ...form, hourlyRate: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notice Period (days)</label>
                    <input type="number" className="form-input" value={form.noticePeriodDays} onChange={e => setForm({ ...form, noticePeriodDays: parseInt(e.target.value) || 30 })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Standard Hours / Month (Optional)</label>
                    <input type="number" step="0.5" className="form-input" placeholder="e.g. 176" value={form.standardHoursPerMonth} onChange={e => setForm({ ...form, standardHoursPerMonth: e.target.value ? parseFloat(e.target.value) : '' })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Overtime Multiplier (Optional)</label>
                    <input type="number" step="0.1" className="form-input" placeholder="e.g. 1.5" value={form.overtimeMultiplier} onChange={e => setForm({ ...form, overtimeMultiplier: e.target.value ? parseFloat(e.target.value) : '' })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" rows={2} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
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
                <select className="form-select" value={newMonth} onChange={e => setNewMonth(Number(e.target.value))}>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <input type="number" className="form-input" value={newYear} onChange={e => setNewYear(Number(e.target.value))} min={2020} max={2099} />
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
        <select className="form-select" style={style} value={value} onChange={e => onChange(e.target.value)}>
          <option value="">— Select —</option>
          {options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea className="form-textarea" style={style} rows={2} value={value} onChange={e => onChange(e.target.value)} />
      ) : (
        <input type={type} className="form-input" style={style} value={value} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}

// ─── User Management Tab (Relocated from Settings) ──────────────────────────
function TeamTab() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('Admin') || user?.roles?.includes('PlatformOwner');
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    employeeNumber: '',
    role: 'Technician',
    password: '',
    departmentId: ''
  });
  
  // Edit states
  const [showEdit, setShowEdit] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    employeeNumber: '',
    role: 'Technician',
    password: '',
    departmentId: ''
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const AVAILABLE_ROLES = ['Admin', 'HR', 'Planner', 'Supervisor', 'Technician', 'Purchasing', 'Storeman'];

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await usersApi.getAll();
      setUsers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await departmentsApi.getAll();
      setDepartments(data || []);
    } catch (err) {
      console.error('Failed to load departments', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email || !inviteForm.firstName || !inviteForm.password) {
      setError('First name, email and password are required');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        ...inviteForm,
        departmentId: inviteForm.departmentId ? Number(inviteForm.departmentId) : null
      };
      await usersApi.create(payload);
      setSuccess(`User ${inviteForm.firstName} ${inviteForm.lastName} created successfully.`);
      setInviteForm({ firstName: '', lastName: '', email: '', employeeNumber: '', role: 'Technician', password: '', departmentId: '' });
      setShowInvite(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to create user account');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (u: any) => {
    setEditingUser(u);
    setEditForm({
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      employeeNumber: u.employeeNumber || '',
      role: u.role || 'Technician',
      password: '',
      departmentId: u.departmentId ? String(u.departmentId) : ''
    });
    setError('');
    setSuccess('');
    setShowEdit(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.firstName) {
      setError('First name is required');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await usersApi.update(editingUser.id, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        employeeNumber: editForm.employeeNumber,
        role: editForm.role,
        hourlyRate: editingUser.hourlyRate || 450,
        departmentId: editForm.departmentId ? Number(editForm.departmentId) : null
      });

      if (editForm.password) {
        await usersApi.changePassword(editingUser.id, {
          newPassword: editForm.password
        });
      }

      setSuccess(`User account for ${editForm.firstName} ${editForm.lastName} updated successfully.`);
      setShowEdit(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user account');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (u: any) => {
    const action = u.isActive !== false ? 'Deactivate' : 'Reactivate';
    if (!confirm(`${action} user ${u.firstName} ${u.lastName}?`)) return;
    try {
      if (u.isActive !== false) {
        await usersApi.deactivate(u.id);
      } else {
        await usersApi.activate(u.id);
      }
      fetchUsers();
    } catch (err: any) {
      alert(err.message || `Failed to ${action.toLowerCase()} user`);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>Workspace Users ({users.length})</h3>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
            <Plus size={16} /> Add User Account
          </button>
        )}
      </div>

      {success && (
        <div style={{ padding: '10px 14px', background: 'rgba(var(--accent-emerald-rgb), 0.1)', border: '1px solid var(--accent-emerald)', borderRadius: 8, marginBottom: 16, color: 'var(--accent-emerald)', fontSize: 13 }}>
          {success}
        </div>
      )}

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>Loading workspace users...</div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>No users found.</div>
        ) : (
          <div className="table-scroll">
            <ResponsiveTable>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Employee #</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => {
                    const active = u.isActive !== false;
                    const isCurrentUser = u.id === user?.id;
                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-blue-dim)', border: '1px solid var(--accent-blue-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent-blue)', flexShrink: 0 }}>
                              {(u.firstName?.[0] || '?').toUpperCase()}
                            </div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {u.firstName} {u.lastName}
                              {isCurrentUser && <span className="badge badge-blue" style={{ fontSize: 9, marginLeft: 6 }}>You</span>}
                            </div>
                          </div>
                        </td>
                        <td>{u.email}</td>
                        <td style={{ fontFamily: 'monospace' }}>{u.employeeNumber || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {(u.roles || [u.role]).filter(Boolean).map((r: string) => (
                              <span key={r} className="badge badge-blue" style={{ fontSize: 10 }}>{r}</span>
                            ))}
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {departments.find(d => d.id === u.departmentId)?.name || '—'}
                        </td>
                        <td>
                          <span className={`badge ${active ? 'badge-green' : 'badge-muted'}`} style={{ fontSize: 10 }}>
                            {active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {isAdmin && (
                              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Edit size={12} /> Edit
                              </button>
                            )}
                            {isAdmin && !isCurrentUser && (
                              <button className="btn btn-secondary btn-sm" onClick={() => handleDeactivate(u)}>
                                {active ? 'Deactivate' : 'Reactivate'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ResponsiveTable>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showInvite && (
        <div className="modal-overlay" onClick={() => setShowInvite(false)}>
          <div className="modal-content animate-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h2 className="modal-title">Create User Account</h2>
              <button className="modal-close" onClick={() => setShowInvite(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleInvite}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {error && (
                  <div style={{ padding: '10px 14px', background: 'rgba(var(--accent-rose-rgb), 0.1)', border: '1px solid var(--accent-rose)', borderRadius: 8, color: 'var(--accent-rose)', fontSize: 13 }}>
                    {error}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input className="form-input" value={inviteForm.firstName} onChange={e => setInviteForm({ ...inviteForm, firstName: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input className="form-input" value={inviteForm.lastName} onChange={e => setInviteForm({ ...inviteForm, lastName: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input className="form-input" type="email" value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Employee Number</label>
                    <input className="form-input" value={inviteForm.employeeNumber} onChange={e => setInviteForm({ ...inviteForm, employeeNumber: e.target.value })} placeholder="e.g. EMP-001" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-select" value={inviteForm.role} onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}>
                      {AVAILABLE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-select" value={inviteForm.departmentId} onChange={e => setInviteForm({ ...inviteForm, departmentId: e.target.value })}>
                    <option value="">No Department (Overhead)</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Temporary Password *</label>
                  <input className="form-input" type="password" value={inviteForm.password} onChange={e => setInviteForm({ ...inviteForm, password: e.target.value })} placeholder="Min 6 characters" required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowInvite(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEdit && editingUser && (
        <div className="modal-overlay" onClick={() => { setShowEdit(false); setEditingUser(null); }}>
          <div className="modal-content animate-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h2 className="modal-title">Edit User Account</h2>
              <button className="modal-close" onClick={() => { setShowEdit(false); setEditingUser(null); }}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {error && (
                  <div style={{ padding: '10px 14px', background: 'rgba(var(--accent-rose-rgb), 0.1)', border: '1px solid var(--accent-rose)', borderRadius: 8, color: 'var(--accent-rose)', fontSize: 13 }}>
                    {error}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input className="form-input" value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input className="form-input" value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-input" type="email" value={editingUser.email} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Email address cannot be changed.</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Employee Number</label>
                    <input className="form-input" value={editForm.employeeNumber} onChange={e => setEditForm({ ...editForm, employeeNumber: e.target.value })} placeholder="e.g. EMP-001" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-select" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                      {AVAILABLE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-select" value={editForm.departmentId} onChange={e => setEditForm({ ...editForm, departmentId: e.target.value })}>
                    <option value="">No Department (Overhead)</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Reset Password</label>
                  <input className="form-input" type="password" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} placeholder="Leave blank to keep unchanged" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowEdit(false); setEditingUser(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Department Detail Maps ───────────────────────────────────────────────────
const poStatusConfig: Record<number, { label: string; badge: string }> = {
  0: { label: 'Draft',              badge: 'badge-muted' },
  1: { label: 'Submitted',          badge: 'badge-blue' },
  2: { label: 'Pending Approval',   badge: 'badge-amber' },
  3: { label: 'Approved',           badge: 'badge-green' },
  4: { label: 'Partly Received',    badge: 'badge-violet' },
  5: { label: 'Received',           badge: 'badge-green' },
  6: { label: 'Rejected',           badge: 'badge-rose' },
  7: { label: 'Cancelled',          badge: 'badge-muted' },
};

const prStatusConfig: Record<number, { label: string; badge: string }> = {
  0: { label: 'Draft',              badge: 'badge-muted' },
  1: { label: 'Pending Approval',   badge: 'badge-amber' },
  2: { label: 'Approved',           badge: 'badge-green' },
  3: { label: 'Rejected',           badge: 'badge-rose' },
  4: { label: 'Converted to PO',    badge: 'badge-blue' },
  5: { label: 'Cancelled',          badge: 'badge-muted' },
};

const vendorBillStatusMap: Record<number, { label: string; badge: string }> = {
  0: { label: 'Unpaid',    badge: 'badge-muted'  },
  1: { label: 'Partial',   badge: 'badge-amber'  },
  2: { label: 'Paid',      badge: 'badge-green'  },
  3: { label: 'Cancelled', badge: 'badge-rose'   },
};

// ─── Departments Tab ──────────────────────────────────────────────────────────
function DepartmentsTab() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDept, setEditingDept] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', costCode: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [activeSubTabs, setActiveSubTabs] = useState<Record<number, 'members' | 'assets' | 'procurement' | 'financials'>>({});
  const { user } = useAuth();

  const load = async () => {
    try {
      setLoading(true);
      const [deptsData, usersData, assetsData, requisitionsData, ordersData, billsData] = await Promise.all([
        departmentsApi.getAll(),
        usersApi.getAll(),
        equipmentApi.getAll(),
        procurementApi.getRequisitions(),
        procurementApi.getOrders(),
        financeApi.getVendorBills()
      ]);
      setDepartments(deptsData || []);
      setUsers(usersData || []);
      setAssets(assetsData || []);
      setRequisitions(requisitionsData || []);
      setOrders(ordersData || []);
      setBills(billsData || []);
    } catch (err) {
      console.error('Failed to load departments or associated data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (dept: any) => {
    setEditingDept(dept);
    setForm({
      name: dept.name || '',
      costCode: dept.costCode || '',
      description: dept.description || ''
    });
    setShowForm(true);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingDept) {
        await departmentsApi.update(editingDept.id, { ...editingDept, ...form });
      } else {
        await departmentsApi.create(form);
      }
      setShowForm(false);
      setEditingDept(null);
      setForm({ name: '', costCode: '', description: '' });
      load();
    } catch (err: any) {
      alert('Failed to save department: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this department? This may affect linked assets and users.')) return;
    try {
      await departmentsApi.delete(id);
      load();
    } catch (err: any) {
      alert('Failed to delete department: ' + (err.message || 'Unknown error'));
    }
  };

  if (selectedDeptId) {
    const d = departments.find(dept => dept.id === selectedDeptId);
    if (d) {
      const deptMembers = users.filter(u => u.departmentId === d.id);
      const deptAssets = assets.filter(a => a.departmentId === d.id);
      const deptRequisitions = requisitions.filter(r => r.departmentId === d.id);
      const deptOrders = orders.filter(o => o.departmentId === d.id);
      const deptBills = bills.filter(b => b.purchaseOrder?.departmentId === d.id);
      const activeSubTab = activeSubTabs[d.id] || 'members';

      return (
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Back Button */}
          <div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSelectedDeptId(null)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, paddingLeft: 0, color: 'var(--accent-blue)', fontWeight: 600 }}
            >
              <ArrowLeft size={14} /> Back to Departments
            </button>
          </div>

          {/* Department Header Card */}
          <div className="card-elevated" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderLeft: '4px solid var(--accent-blue)', borderRadius: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{d.name}</h2>
                <span className="badge badge-blue" style={{ fontFamily: 'monospace', fontSize: 11, padding: '2px 8px' }}>
                  Cost Center: {d.costCode || '—'}
                </span>
                <span className="badge badge-muted" style={{ fontSize: 11, padding: '2px 8px' }}>
                  {deptMembers.length} {deptMembers.length === 1 ? 'member' : 'members'}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, margin: '8px 0 0', lineHeight: 1.5 }}>
                {d.description || 'No description provided.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => openEdit(d)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Edit size={12} /> Edit
              </button>
              <button className="btn btn-sm" style={{ background: 'var(--accent-rose)', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={async () => { if (confirm('Are you sure you want to delete this department? This may affect linked assets and users.')) { await handleDelete(d.id); setSelectedDeptId(null); } }}>
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>

          {/* Tab Switcher */}
          <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 0 }}>
            {([
              { key: 'members', label: 'Members', count: deptMembers.length, icon: <Users size={13} />, perm: null },
              { key: 'assets', label: 'Assets (Equipment)', count: deptAssets.length, icon: <Package size={13} />, perm: '/dashboard/hr:view_department_assets' },
              { key: 'procurement', label: 'Procurement (PR/PO)', count: deptRequisitions.length + deptOrders.length, icon: <ShoppingCart size={13} />, perm: '/dashboard/hr:view_department_procurement' },
              { key: 'financials', label: 'Financials (Bills)', count: deptBills.length, icon: <Receipt size={13} />, perm: '/dashboard/hr:view_department_financials' },
            ] as const)
            .filter(tab => !tab.perm || hasPermission(tab.perm, user?.allowedRoutes || [], user?.isPlatformOwner ?? false))
            .map(tab => {
              const isActive = activeSubTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveSubTabs(prev => ({ ...prev, [d.id]: tab.key }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 18px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    borderBottom: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
                    marginBottom: -1,
                    transition: 'all 0.15s'
                  }}
                >
                  {tab.icon} {tab.label}
                  <span
                    style={{
                      fontSize: 10,
                      padding: '1px 6px',
                      borderRadius: 10,
                      background: isActive ? 'var(--accent-blue)' : 'var(--surface-secondary)',
                      color: isActive ? '#fff' : 'var(--text-muted)',
                      fontWeight: 700,
                      marginLeft: 4
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="card" style={{ padding: 20 }}>
            {activeSubTab === 'members' && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                  Department Members ({deptMembers.length})
                </div>
                {deptMembers.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                    {deptMembers.map(u => {
                      const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.userName || u.email || 'Unknown';
                      return (
                        <div key={u.id} className="card-elevated" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-elevated)' }}>
                          <div style={{ padding: 8, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <User size={16} />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullName}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                              <Briefcase size={10} /> {u.role || 'Staff'}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Mail size={10} /> {u.email}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: '20px 0', border: '1px dashed var(--border-subtle)', borderRadius: 8, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                    No members currently assigned to this department.
                  </div>
                )}
              </div>
            )}

            {activeSubTab === 'assets' && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                  Registered Assets &amp; Equipment ({deptAssets.length})
                </div>
                {deptAssets.length > 0 ? (
                  <ResponsiveTable>
                    <table className="data-table" style={{ fontSize: 12 }}>
                      <thead>
                        <tr>
                          <th>Asset Name</th>
                          <th>Serial Number</th>
                          <th>Model / Manufacturer</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deptAssets.map(asset => (
                          <tr key={asset.id}>
                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{asset.name}</td>
                            <td style={{ fontFamily: 'monospace' }}>{asset.serialNumber || '—'}</td>
                            <td style={{ color: 'var(--text-secondary)' }}>
                              {asset.modelNumber || '—'} {asset.manufacturer ? `(${asset.manufacturer})` : ''}
                            </td>
                            <td>
                              <span className="badge badge-green" style={{ fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                                Operational
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ResponsiveTable>
                ) : (
                  <div style={{ padding: '20px 0', border: '1px dashed var(--border-subtle)', borderRadius: 8, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                    No assets currently registered to this department.
                  </div>
                )}
              </div>
            )}

            {activeSubTab === 'procurement' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Purchase Requisitions */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Purchase Requisitions ({deptRequisitions.length})</div>
                  {deptRequisitions.length > 0 ? (
                    <ResponsiveTable>
                      <table className="data-table" style={{ fontSize: 12 }}>
                        <thead>
                          <tr>
                            <th>PR Number</th>
                            <th>Date Raised</th>
                            <th>Requested By</th>
                            <th>Total Value</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deptRequisitions.map(pr => {
                            const stat = prStatusConfig[pr.status] || { label: 'Unknown', badge: 'badge-muted' };
                            return (
                              <tr key={pr.id}>
                                <td style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{pr.requisitionNumber || pr.prNumber}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{new Date(pr.createdAt || pr.requiredDate).toLocaleDateString()}</td>
                                <td>{pr.requestedBy?.firstName ? `${pr.requestedBy.firstName} ${pr.requestedBy.lastName || ''}` : pr.requestedBy?.userName || '—'}</td>
                                <td style={{ fontWeight: 600 }}>{fmt(pr.totalEstimatedAmount || pr.totalAmount)}</td>
                                <td>
                                  <span className={`badge ${stat.badge}`}>{stat.label}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </ResponsiveTable>
                  ) : (
                    <div style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                      No purchase requisitions raised for this department.
                    </div>
                  )}
                </div>

                {/* Purchase Orders */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Purchase Orders ({deptOrders.length})</div>
                  {deptOrders.length > 0 ? (
                    <ResponsiveTable>
                      <table className="data-table" style={{ fontSize: 12 }}>
                        <thead>
                          <tr>
                            <th>PO Number</th>
                            <th>Supplier</th>
                            <th>Order Date</th>
                            <th>Total Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deptOrders.map(order => {
                            const stat = poStatusConfig[order.status] || { label: 'Unknown', badge: 'badge-muted' };
                            return (
                              <tr key={order.id}>
                                <td style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{order.poNumber}</td>
                                <td style={{ color: 'var(--text-primary)' }}>{order.supplier?.name || '—'}</td>
                                <td style={{ color: 'var(--text-secondary)' }}>{new Date(order.orderDate).toLocaleDateString()}</td>
                                <td style={{ fontWeight: 600 }}>{fmt(order.totalAmount)}</td>
                                <td>
                                  <span className={`badge ${stat.badge}`}>{stat.label}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </ResponsiveTable>
                  ) : (
                    <div style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px dashed var(--border-subtle)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                      No purchase orders linked to this department.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSubTab === 'financials' && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
                  Linked Vendor Bills ({deptBills.length})
                </div>
                {deptBills.length > 0 ? (
                  <ResponsiveTable>
                    <table className="data-table" style={{ fontSize: 12 }}>
                      <thead>
                        <tr>
                          <th>Bill Number</th>
                          <th>Supplier</th>
                          <th>Bill Date</th>
                          <th>Due Date</th>
                          <th>Total Amount</th>
                          <th>Balance</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deptBills.map(bill => {
                          const stat = vendorBillStatusMap[bill.status] || { label: 'Unknown', badge: 'badge-muted' };
                          return (
                            <tr key={bill.id}>
                              <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{bill.billNumber}</td>
                              <td>{bill.supplier?.name || '—'}</td>
                              <td style={{ color: 'var(--text-secondary)' }}>{new Date(bill.billDate).toLocaleDateString()}</td>
                              <td style={{ color: 'var(--text-secondary)' }}>{new Date(bill.dueDate).toLocaleDateString()}</td>
                              <td style={{ fontWeight: 600 }}>{fmt(bill.totalAmount)}</td>
                              <td style={{ fontWeight: 600, color: bill.balance > 0 ? 'var(--accent-rose)' : 'var(--text-secondary)' }}>
                                {fmt(bill.balance)}
                              </td>
                              <td>
                                <span className={`badge ${stat.badge}`}>{stat.label}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </ResponsiveTable>
                ) : (
                  <div style={{ padding: '20px 0', border: '1px dashed var(--border-subtle)', borderRadius: 8, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                    No vendor bills linked to this department's purchases.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>Company Departments ({departments.length})</h3>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Manage corporate departments, modules, and cost centers.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingDept(null); setForm({ name: '', costCode: '', description: '' }); setShowForm(true); }}>
          <Plus size={16} /> Add Department
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>Loading departments...</div>
        ) : departments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            No departments found. Click "Add Department" to create one.
          </div>
        ) : (
          <ResponsiveTable>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>Cost Code / Center</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map(d => {
                  const deptMembers = users.filter(u => u.departmentId === d.id);
                  return (
                    <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedDeptId(d.id)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{d.name}</div>
                          <span className="badge badge-muted" style={{ fontSize: 10, padding: '2px 6px' }}>
                            {deptMembers.length} {deptMembers.length === 1 ? 'member' : 'members'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-blue" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                          {d.costCode || '—'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.description || '—'}
                      </td>
                      <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(d)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Edit size={12} /> Edit
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(d.id)} style={{ color: 'var(--accent-rose)' }}>
                            <Trash2 size={12} /> Delete
                          </button>
                          <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => setSelectedDeptId(d.id)}>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ResponsiveTable>
        )}
      </div>

      {/* Department Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditingDept(null); }}>
          <div className="modal-content animate-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingDept ? 'Edit Department' : 'Create Department'}</h2>
              <button className="modal-close" onClick={() => { setShowForm(false); setEditingDept(null); }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateOrUpdate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Department Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Procurement, Safety, or IT" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Cost Code / Reference</label>
                  <input className="form-input" value={form.costCode} onChange={e => setForm({ ...form, costCode: e.target.value })} placeholder="e.g. DEPT-PROC or 4001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description of department scope or access role mapping..." />
                </div>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditingDept(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Department'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
