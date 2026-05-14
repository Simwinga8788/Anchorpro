'use client';

import { Users, Plus, CheckCircle2, Clock, MoreHorizontal, Star, Hash, UserX, UserCheck, Trash2, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { usersApi, departmentsApi } from '@/lib/api';

const ROLES = ['Technician', 'Admin', 'Supervisor', 'Storekeeper', 'Accountant', 'Viewer'];

export default function TeamPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    email: '', firstName: '', lastName: '',
    employeeNumber: '', hourlyRate: '', role: 'Technician', password: '', departmentId: '',
  });

  const load = () => {
    setLoading(true);
    usersApi.getAll()
      .then(data => setTeam(data || []))
      .catch(() => setTeam([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    departmentsApi.getAll()
      .then(d => setDepartments(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(null);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email) return;
    setSaving(true); setErr('');
    try {
      await usersApi.create({
        email: form.email,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        employeeNumber: form.employeeNumber || undefined,
        hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : undefined,
        role: form.role,
        password: form.password || 'Anchor@1234!',
        departmentId: form.departmentId ? parseInt(form.departmentId) : undefined,
      });
      setShowInvite(false);
      setForm({ email: '', firstName: '', lastName: '', employeeNumber: '', hourlyRate: '', role: 'Technician', password: '', departmentId: '' });
      setSuccessMsg('Member added successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
      load();
    } catch (e: any) {
      setErr(e?.message || 'Failed to add member');
    } finally { setSaving(false); }
  }

  async function handleDeactivate(id: string) {
    if (!confirm('Deactivate this member?')) return;
    try { await usersApi.deactivate(id); load(); } catch (ex) { console.error(ex); }
    setMenuOpen(null);
  }

  async function handleReactivate(id: string) {
    try { await usersApi.activate(id); load(); } catch (ex) { console.error(ex); }
    setMenuOpen(null);
  }

  async function handleRemove(id: string) {
    if (!confirm('Permanently remove this member? This cannot be undone.')) return;
    try { await usersApi.delete(id); load(); } catch (ex) { console.error(ex); }
    setMenuOpen(null);
  }

  const [editMember, setEditMember] = useState<any>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', employeeNumber: '', hourlyRate: '', role: 'Technician', departmentId: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editErr, setEditErr] = useState('');

  function openEdit(member: any) {
    setEditMember(member);
    setEditForm({ firstName: member.firstName || '', lastName: member.lastName || '', employeeNumber: member.employeeNumber || '', hourlyRate: member.hourlyRate?.toString() || '', role: member.role || 'Technician', departmentId: member.departmentId?.toString() || '' });
    setMenuOpen(null);
    setEditErr('');
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault(); setSavingEdit(true); setEditErr('');
    try {
      await usersApi.update(editMember.id, { firstName: editForm.firstName || undefined, lastName: editForm.lastName || undefined, employeeNumber: editForm.employeeNumber || undefined, hourlyRate: editForm.hourlyRate ? parseFloat(editForm.hourlyRate) : undefined, role: editForm.role, departmentId: editForm.departmentId ? parseInt(editForm.departmentId) : undefined });
      setEditMember(null); load();
    } catch (ex: any) { setEditErr(ex?.message || 'Update failed'); }
    finally { setSavingEdit(false); }
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%', fontSize: 13, padding: '8px 12px',
    background: 'var(--bg-app)', border: '1px solid var(--border-default)',
    borderRadius: 6, color: 'var(--text-primary)', boxSizing: 'border-box',
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Team Registry</h1>
          <p className="page-subtitle">{loading ? 'Loading...' : `${team.length} members on the platform`}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
          <Plus size={14} /> Add Member
        </button>
      </div>

      {successMsg && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: '#10b981', fontSize: 13 }}>
          {successMsg}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>Loading team members...</div>
      ) : team.length === 0 ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Users size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div style={{ fontSize: 14 }}>No team members yet</div>
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setShowInvite(true)}>Add First Member</button>
        </div>
      ) : (
        <div ref={menuRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: 14 }}>
          {team.map(member => {
            const displayName = member.firstName ? `${member.firstName} ${member.lastName || ''}`.trim() : member.email;
            const initials = (member.firstName || member.email || '?')[0]?.toUpperCase();
            const manNumber = member.employeeNumber || 'UNASSIGNED';
            const isLocked = member.lockoutEnd && new Date(member.lockoutEnd) > new Date();
            const isOpen = menuOpen === member.id;

            return (
              <div key={member.id} className="card-elevated" style={{ padding: 0, overflow: 'visible', opacity: isLocked ? 0.65 : 1 }}>
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="avatar" style={{ width: 44, height: 44, fontSize: 15, background: isLocked ? 'rgba(239,68,68,0.15)' : 'var(--accent-blue-dim)', color: isLocked ? '#ef4444' : 'var(--accent-blue)' }}>
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{displayName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{member.role || 'Technician'}</div>
                      </div>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => setMenuOpen(isOpen ? null : member.id)}>
                        <MoreHorizontal size={14} />
                      </button>
                      {isOpen && (
                        <div style={{
                          position: 'absolute', right: 0, top: '100%', zIndex: 100,
                          background: 'var(--bg-card)', border: '1px solid var(--border-default)',
                          borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                          minWidth: 160, overflow: 'hidden',
                        }}>
                                              <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, padding: '10px 14px', gap: 8, fontSize: 13 }} onClick={() => openEdit(member)}>
                            <Star size={13} style={{ color: 'var(--accent-blue)' }} /> Edit / Change Role
                          </button>
                          <div style={{ height: 1, background: 'var(--border-subtle)' }} />
                          {isLocked ? (
                            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, padding: '10px 14px', gap: 8, fontSize: 13 }} onClick={() => handleReactivate(member.id)}>
                              <UserCheck size={13} style={{ color: '#10b981' }} /> Reactivate
                            </button>
                          ) : (
                            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, padding: '10px 14px', gap: 8, fontSize: 13 }} onClick={() => handleDeactivate(member.id)}>
                              <UserX size={13} style={{ color: '#f59e0b' }} /> Deactivate
                            </button>
                          )}
                          <div style={{ height: 1, background: 'var(--border-subtle)' }} />
                          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', borderRadius: 0, padding: '10px 14px', gap: 8, fontSize: 13, color: '#ef4444' }} onClick={() => handleRemove(member.id)}>
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 6, marginBottom: 16 }}>
                    <Hash size={13} style={{ color: 'var(--accent-blue)' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>MAN NO: {manNumber}</span>
                    {member.hourlyRate && (
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>K{member.hourlyRate}/hr</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                    <span className="badge badge-muted">{member.role || 'Technician'}</span>
                    {member.departmentId && departments.find((d: any) => d.id === member.departmentId) && (
                      <span className="badge badge-muted" style={{ color: 'var(--accent-blue)' }}>
                        {departments.find((d: any) => d.id === member.departmentId)?.name}
                      </span>
                    )}
                    <span className={`badge ${isLocked ? 'badge-rose' : 'badge-green'}`}>
                      <span className="status-dot" style={{ background: isLocked ? '#ef4444' : '#10b981' }} />
                      {isLocked ? 'Deactivated' : 'Active'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    {[
                      { label: 'Jobs Done', value: member.completedJobsCount ?? 0, icon: <CheckCircle2 size={11} /> },
                      { label: 'Hours',     value: member.totalHours != null ? `${member.totalHours}h` : '0h', icon: <Clock size={11} /> },
                      { label: 'Hourly',    value: member.hourlyRate ? `K${member.hourlyRate}` : '—', icon: <Star size={11} /> },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 8px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--text-muted)', marginBottom: 4 }}>
                          {s.icon}
                          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Member Modal */}
      {editMember && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setEditMember(null)}>
          <div className="card-elevated" style={{ width: 440, padding: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Edit Member</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditMember(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleEditSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>First Name</label>
                  <input style={fieldStyle} value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))} /></div>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Last Name</label>
                  <input style={fieldStyle} value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Employee No.</label>
                  <input style={fieldStyle} value={editForm.employeeNumber} onChange={e => setEditForm(f => ({ ...f, employeeNumber: e.target.value }))} /></div>
                <div><label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Hourly Rate (K)</label>
                  <input style={fieldStyle} type="number" value={editForm.hourlyRate} onChange={e => setEditForm(f => ({ ...f, hourlyRate: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Role</label>
                  <select style={fieldStyle} value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Department</label>
                  <select style={fieldStyle} value={editForm.departmentId} onChange={e => setEditForm(f => ({ ...f, departmentId: e.target.value }))}>
                    <option value="">— None —</option>
                    {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              {editErr && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>{editErr}</div>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setEditMember(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingEdit}>{savingEdit ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showInvite && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowInvite(false)}>
          <div className="card-elevated" style={{ width: 480, padding: 28, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Add Team Member</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowInvite(false); setErr(''); }}><X size={16} /></button>
            </div>

            <form onSubmit={handleInvite}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>First Name</label>
                  <input style={fieldStyle} value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="John" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Last Name</label>
                  <input style={fieldStyle} value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Banda" />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Email Address *</label>
                <input style={fieldStyle} type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@company.com" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Employee No.</label>
                  <input style={fieldStyle} value={form.employeeNumber} onChange={e => setForm(f => ({ ...f, employeeNumber: e.target.value }))} placeholder="EMP001" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Hourly Rate (K)</label>
                  <input style={fieldStyle} type="number" value={form.hourlyRate} onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))} placeholder="450" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Role</label>
                  <select style={fieldStyle} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>Department</label>
                  <select style={fieldStyle} value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}>
                    <option value="">— None —</option>
                    {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
                  Password <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(default: Anchor@1234!)</span>
                </label>
                <input style={fieldStyle} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Leave blank for default" />
              </div>

              {err && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>{err}</div>}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => { setShowInvite(false); setErr(''); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || !form.email}>
                  {saving ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
