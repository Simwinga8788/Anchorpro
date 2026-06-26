'use client';

import { useState, useEffect } from 'react';
import {
  Shield, CheckSquare, Square, Save, Trash2, Plus, Users, ShieldAlert,
  ChevronDown, ChevronUp, Lock
} from 'lucide-react';
import { rolesApi, teamApi } from '@/lib/api';

const MODULE_ROUTES = [
  { id: '/dashboard', label: 'Dashboard Overview', category: 'Operations & Planning' },
  { id: '/dashboard/performance', label: 'Performance Metrics', category: 'Operations & Planning' },
  { id: '/dashboard/jobs', label: 'Job Cards', category: 'Operations & Planning' },
  { id: '/dashboard/my-jobs', label: 'My Assignments', category: 'Operations & Planning' },
  { id: '/dashboard/planning', label: 'Planning Board', category: 'Operations & Planning' },
  { id: '/dashboard/time-tracking', label: 'Time Tracking', category: 'Operations & Planning' },
  { id: '/dashboard/downtime', label: 'Down Time Log', category: 'Operations & Planning' },
  { id: '/dashboard/safety', label: 'Safety & Compliance', category: 'Operations & Planning' },
  
  { id: '/dashboard/hr', label: 'HR & Team', category: 'Human Resources' },
  { id: '/dashboard/roles', label: 'Roles & Permissions', category: 'Human Resources' },
  
  { id: '/dashboard/finance', label: 'Cashbook & Payables', category: 'Finance' },
  { id: '/dashboard/invoices', label: 'Invoices & Billing', category: 'Finance' },
  { id: '/dashboard/intelligence', label: 'Intelligence', category: 'Finance' },
  
  { id: '/dashboard/customers', label: 'CRM & Customers', category: 'Sales & Customer' },
  { id: '/dashboard/contracts', label: 'Client Contracts', category: 'Sales & Customer' },
  
  { id: '/dashboard/assets', label: 'Asset Registry', category: 'Enterprise Asset Mgt' },
  { id: '/dashboard/inventory', label: 'Inventory & Parts', category: 'Enterprise Asset Mgt' },
  { id: '/dashboard/tools', label: 'Tools Registry', category: 'Enterprise Asset Mgt' },
  { id: '/dashboard/my-tools', label: 'My Tools', category: 'Enterprise Asset Mgt' },
  { id: '/dashboard/procurement', label: 'Procurement', category: 'Enterprise Asset Mgt' },
  
  { id: '/dashboard/settings', label: 'System Settings', category: 'Settings' }
];

interface Role {
  id: string;
  name: string;
  isSystemRole: boolean;
  allowedRoutes: string[];
}

const GRANULAR_PERMISSIONS: Record<string, { label: string; token: string }[]> = {
  '/dashboard/hr': [
    { label: 'View Employment Contracts', token: '/dashboard/hr:view_contracts' },
    { label: 'View & Run Payroll', token: '/dashboard/hr:view_payroll' },
    { label: 'User & Role Management', token: '/dashboard/hr:view_user_management' },
    { label: 'View Department Assets', token: '/dashboard/hr:view_department_assets' },
    { label: 'View Department Procurement', token: '/dashboard/hr:view_department_procurement' },
    { label: 'View Department Financials', token: '/dashboard/hr:view_department_financials' },
  ],
  '/dashboard/jobs': [
    { label: 'Create Job Cards', token: '/dashboard/jobs:create' },
    { label: 'Edit Job Card Details', token: '/dashboard/jobs:edit' },
    { label: 'Assign Technicians', token: '/dashboard/jobs:assign_technicians' },
    { label: 'Log Hours & Overtime', token: '/dashboard/jobs:log_hours' },
    { label: 'Allocate Stock Parts', token: '/dashboard/jobs:log_parts' },
    { label: 'Log Equipment Photos', token: '/dashboard/jobs:upload_photos' },
    { label: 'Complete & Close Jobs', token: '/dashboard/jobs:close_job' },
    { label: 'Delete Work Orders', token: '/dashboard/jobs:delete' },
  ],
  '/dashboard/procurement': [
    { label: 'Raise Purchase Requisitions', token: '/dashboard/procurement:create_requisitions' },
    { label: 'Approve / Reject Requisitions & POs', token: '/dashboard/procurement:approve_reject' },
    { label: 'Raise Purchase Orders', token: '/dashboard/procurement:create_orders' },
    { label: 'Receive Goods (Warehouse / Inventory)', token: '/dashboard/procurement:receive_goods' },
  ],
  '/dashboard/finance': [
    { label: 'Record Ad-Hoc Expenses', token: '/dashboard/finance:record_expense' },
    { label: 'Pay Vendor Bills', token: '/dashboard/finance:record_payment' },
  ],
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [expandedRoutePermissions, setExpandedRoutePermissions] = useState<Record<string, boolean>>({});
  
  const [newRoleName, setNewRoleName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // Local edits pending save
  const [edits, setEdits] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [rData, tData] = await Promise.all([
        rolesApi.getAll(),
        teamApi.getAll()
      ]);
      setRoles(rData || []);
      setTeam(tData || []);
      
      // Initialize edits
      const initEdits: Record<string, string[]> = {};
      rData.forEach((r: Role) => {
        initEdits[r.name] = r.allowedRoutes || [];
      });
      setEdits(initEdits);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleRoute = (roleName: string, route: string) => {
    setEdits(prev => {
      const current = prev[roleName] || [];
      const newRoutes = current.includes(route) 
        ? current.filter(r => r !== route)
        : [...current, route];
      return { ...prev, [roleName]: newRoutes };
    });
  };

  const handleSavePermissions = async (roleName: string) => {
    setSaving(roleName);
    try {
      await rolesApi.update(roleName, { allowedRoutes: edits[roleName] });
      // Update local state to reflect it's saved
      setRoles(prev => prev.map(r => r.name === roleName ? { ...r, allowedRoutes: edits[roleName] } : r));
      alert('Permissions saved successfully.');
    } catch (err: any) {
      alert('Error saving permissions: ' + err.message);
    } finally {
      setSaving(null);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    try {
      await rolesApi.create({ name: newRoleName, allowedRoutes: [] });
      setNewRoleName('');
      setIsAdding(false);
      await loadData();
    } catch (err: any) {
      alert('Error creating role: ' + err.message);
    }
  };

  const handleDeleteRole = async (roleName: string) => {
    if (!confirm(`Are you sure you want to delete the ${roleName} role?`)) return;
    try {
      await rolesApi.delete(roleName);
      await loadData();
    } catch (err: any) {
      alert('Error deleting role: ' + err.message);
    }
  };

  // Group routes by category for display
  const groupedRoutes = MODULE_ROUTES.reduce((acc, route) => {
    if (!acc[route.category]) acc[route.category] = [];
    acc[route.category].push(route);
    return acc;
  }, {} as Record<string, typeof MODULE_ROUTES>);

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(144,101,176,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9065B0' }}>
            <Shield size={20} />
          </div>
          <div>
            <h1 className="page-title">Roles & Permissions</h1>
            <p className="page-subtitle">Dynamically define what modules your team can access</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
          <Plus size={16} /> New Custom Role
        </button>
      </div>

      {isAdding && (
        <div className="card" style={{ padding: 20, marginBottom: 24, background: 'var(--bg-elevated)', border: '1px solid var(--accent-blue)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Create Custom Role</h3>
          <div style={{ display: 'flex', gap: 12 }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Logistics Officer, Safety Inspector..." 
              value={newRoleName}
              onChange={e => setNewRoleName(e.target.value)}
              style={{ flex: 1, maxWidth: 300 }}
              autoFocus
            />
            <button className="btn btn-primary" onClick={handleCreateRole}>Create Role</button>
            <button className="btn btn-secondary" onClick={() => { setIsAdding(false); setNewRoleName(''); }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div>Loading roles...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {roles.map(role => {
            const isOpen = expandedRole === role.name;
            const currentEdits = edits[role.name] || [];
            const hasChanges = JSON.stringify(currentEdits.sort()) !== JSON.stringify([...(role.allowedRoutes || [])].sort());
            const membersCount = team.filter(m => (m.roles ?? [m.role]).includes(role.name)).length;

            return (
              <div key={role.name} className="card-elevated" style={{ overflow: 'hidden', borderLeft: `3px solid ${role.isSystemRole ? '#9065B0' : '#2383E2'}` }}>
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div 
                    style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
                    onClick={() => setExpandedRole(prev => prev === role.name ? null : role.name)}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: role.isSystemRole ? 'rgba(144,101,176,0.15)' : 'rgba(35,131,226,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: role.isSystemRole ? '#9065B0' : '#2383E2' }}>
                      {role.isSystemRole ? <ShieldAlert size={18} /> : <Shield size={18} />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{role.name}</span>
                        {role.isSystemRole && (
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'var(--bg-hover)', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Lock size={10} /> System Default
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Users size={12} /> {membersCount} assigned
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {hasChanges && (
                      <span style={{ fontSize: 11, color: 'var(--accent-amber)', fontWeight: 600 }}>Unsaved changes</span>
                    )}
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => setExpandedRole(prev => prev === role.name ? null : role.name)}
                    >
                      {isOpen ? <ChevronUp size={16} /> : 'Edit Permissions'}
                    </button>
                    {!role.isSystemRole && (
                      <button className="btn btn-sm" style={{ color: 'var(--accent-rose)', padding: '6px 8px' }} onClick={() => handleDeleteRole(role.name)}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
                    <div style={{ marginBottom: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
                      Tick the modules that users with the <strong>{role.name}</strong> role should be able to access. 
                      Any unchecked module will be completely hidden from their sidebar.
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px 32px' }}>
                      {Object.entries(groupedRoutes).map(([category, routes]) => (
                        <div key={category}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                            {category}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {routes.map(route => {
                              const isChecked = currentEdits.includes(route.id);
                              // Admins always have access to roles & settings implicitly in UI logic, but let's allow ticking anyway
                              const disabled = role.name === 'Admin' && (route.id === '/dashboard/roles' || route.id === '/dashboard/settings');
                              const hasGranular = !!GRANULAR_PERMISSIONS[route.id];
                              const isGranularExpanded = !!expandedRoutePermissions[`${role.name}-${route.id}`];

                              return (
                                <div key={route.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 12px', background: 'var(--bg-app)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, flex: 1 }}>
                                      <div onClick={(e) => {
                                        if (disabled) return;
                                        e.preventDefault();
                                        handleToggleRoute(role.name, route.id);
                                      }} style={{ color: isChecked ? 'var(--accent-blue)' : 'var(--text-tertiary)', display: 'flex', marginTop: 1 }}>
                                        {isChecked ? <CheckSquare size={16} /> : <Square size={16} />}
                                      </div>
                                      <span style={{ fontSize: 13, color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isChecked ? 500 : 400 }}>
                                        {route.label}
                                      </span>
                                    </label>
                                    {hasGranular && isChecked && (
                                      <button
                                        onClick={() => setExpandedRoutePermissions(prev => ({ ...prev, [`${role.name}-${route.id}`]: !isGranularExpanded }))}
                                        className="btn btn-ghost btn-sm"
                                        style={{ padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                      >
                                        {isGranularExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                      </button>
                                    )}
                                  </div>

                                  {hasGranular && isChecked && isGranularExpanded && (
                                    <div className="animate-in" style={{ paddingLeft: 26, paddingTop: 8, paddingBottom: 6, display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--border-subtle)', marginTop: 4 }}>
                                      {GRANULAR_PERMISSIONS[route.id].map(gp => {
                                        const isGpChecked = currentEdits.includes(gp.token);
                                        return (
                                          <label key={gp.token} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                            <div onClick={(e) => {
                                              e.preventDefault();
                                              handleToggleRoute(role.name, gp.token);
                                            }} style={{ color: isGpChecked ? 'var(--accent-blue)' : 'var(--text-tertiary)', display: 'flex', marginTop: 1 }}>
                                              {isGpChecked ? <CheckSquare size={14} /> : <Square size={14} />}
                                            </div>
                                            <span style={{ fontSize: 12, color: isGpChecked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                              {gp.label}
                                            </span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 28, paddingTop: 16, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => {
                          // Revert local edits
                          setEdits(prev => ({ ...prev, [role.name]: role.allowedRoutes || [] }));
                        }}
                        disabled={!hasChanges}
                      >
                        Discard Changes
                      </button>
                      <button 
                        className="btn btn-primary" 
                        onClick={() => handleSavePermissions(role.name)}
                        disabled={!hasChanges || saving === role.name}
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                      >
                        {saving === role.name ? 'Saving...' : <><Save size={16} /> Save Permissions</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
