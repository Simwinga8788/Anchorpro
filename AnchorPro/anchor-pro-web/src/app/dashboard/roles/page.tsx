'use client';

import { useState, useEffect } from 'react';
import {
  Shield, Users, CheckCircle2, XCircle, AlertTriangle,
  Lightbulb, Crown, Wrench, ClipboardList, Eye, Settings,
  ChevronDown, ChevronUp, ShoppingCart, Package
} from 'lucide-react';
import { teamApi } from '@/lib/api';

// ─── Role definitions ─────────────────────────────────────────────────────────

interface RoleDefinition {
  id: string;
  label: string;
  color: string;
  icon: React.ReactNode;
  tagline: string;
  description: string;
  bestFor: string;
  pages: { label: string; access: boolean }[];
  capabilities: string[];
  restrictions: string[];
  recommendation: string;
  idealCount: string;
}

const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    id: 'Admin',
    label: 'Admin',
    color: '#9065B0',
    icon: <Crown size={18} />,
    tagline: 'Full operational control',
    description: 'Admins have unrestricted access to every module. They configure the workspace, manage the team, oversee billing, and access intelligence reports.',
    bestFor: 'Operations Manager, Maintenance Manager, Business Owner',
    pages: [
      { label: 'Dashboard Overview', access: true },
      { label: 'Intelligence Center', access: true },
      { label: 'Job Cards', access: true },
      { label: 'Planning Board', access: true },
      { label: 'Asset Registry', access: true },
      { label: 'Inventory & Parts', access: true },
      { label: 'Procurement Hub', access: true },
      { label: 'Team Management', access: true },
      { label: 'Reports & Analytics', access: true },
      { label: 'Safety & Compliance', access: true },
      { label: 'Invoices & Billing', access: true },
      { label: 'Contracts', access: true },
      { label: 'Settings', access: true },
    ],
    capabilities: [
      'Create, edit and delete job cards',
      'Manage and reassign team members',
      'Access financial intelligence reports',
      'Configure workspace and nomenclature',
      'Manage billing and subscription',
      'View and export all reports',
      'Create and manage contracts',
      'Approve purchase orders',
    ],
    restrictions: [],
    recommendation: 'Assign sparingly — 1–2 people max. Each Admin is fully accountable for all data in the workspace.',
    idealCount: '1–2',
  },
  {
    id: 'Supervisor',
    label: 'Supervisor',
    color: '#2383E2',
    icon: <ClipboardList size={18} />,
    tagline: 'Oversees field operations',
    description: 'Supervisors manage day-to-day job execution. They can plan, track and close jobs, manage assets and inventory, and oversee safety compliance — but cannot change team roles or access financial data.',
    bestFor: 'Site Supervisor, Shift Lead, Foreman',
    pages: [
      { label: 'Dashboard Overview', access: true },
      { label: 'Intelligence Center', access: false },
      { label: 'Job Cards', access: true },
      { label: 'Planning Board', access: true },
      { label: 'Asset Registry', access: true },
      { label: 'Inventory & Parts', access: true },
      { label: 'Procurement Hub', access: false },
      { label: 'Team Management', access: false },
      { label: 'Reports & Analytics', access: true },
      { label: 'Safety & Compliance', access: true },
      { label: 'Invoices & Billing', access: false },
      { label: 'Contracts', access: false },
      { label: 'Settings', access: false },
    ],
    capabilities: [
      'Create and manage job cards',
      'Assign technicians from the planning board',
      'Track asset health and inventory levels',
      'File and close safety permits',
      'View operational reports',
      'Report and resolve breakdowns',
    ],
    restrictions: [
      'Cannot view financial intelligence or revenue data',
      'Cannot manage team membership or change roles',
      'Cannot access procurement orders',
      'Cannot access billing or subscription settings',
    ],
    recommendation: 'Ideal for shift leads and site supervisors who need daily operational control without financial exposure.',
    idealCount: '2–5',
  },
  {
    id: 'Planner',
    label: 'Planner',
    color: '#0F9D67',
    icon: <Settings size={18} />,
    tagline: 'Schedules and coordinates work',
    description: 'Planners focus on scheduling and resource coordination. They have the same access as Supervisors but are typically office-based staff who plan future work rather than oversee fieldwork directly.',
    bestFor: 'Maintenance Planner, Scheduler, Coordinator',
    pages: [
      { label: 'Dashboard Overview', access: true },
      { label: 'Intelligence Center', access: false },
      { label: 'Job Cards', access: true },
      { label: 'Planning Board', access: true },
      { label: 'Asset Registry', access: true },
      { label: 'Inventory & Parts', access: true },
      { label: 'Procurement Hub', access: false },
      { label: 'Team Management', access: false },
      { label: 'Reports & Analytics', access: true },
      { label: 'Safety & Compliance', access: true },
      { label: 'Invoices & Billing', access: false },
      { label: 'Contracts', access: false },
      { label: 'Settings', access: false },
    ],
    capabilities: [
      'Create and schedule job cards in advance',
      'Manage the planning board and kanban columns',
      'Track asset and inventory availability',
      'Coordinate safety permits',
      'Generate and export operational reports',
    ],
    restrictions: [
      'Cannot view financial or revenue intelligence',
      'Cannot manage the team roster',
      'Cannot place or approve purchase orders',
      'Cannot access billing settings',
    ],
    recommendation: 'Use this role for desk-based planners who schedule maintenance weeks or months ahead. Pair with a Supervisor for field coverage.',
    idealCount: '1–3',
  },
  {
    id: 'Technician',
    label: 'Technician',
    color: '#DFAB01',
    icon: <Wrench size={18} />,
    tagline: 'Executes assigned work orders',
    description: 'Technicians have the most focused access — they see only the jobs assigned to them, check off tasks, log time, and file safety permits. They cannot see financial data, procurement, or team management.',
    bestFor: 'Field Technician, Artisan, Mechanic, Engineer, Operator',
    pages: [
      { label: 'My Assignments', access: true },
      { label: 'Dashboard Overview', access: false },
      { label: 'Intelligence Center', access: false },
      { label: 'Job Cards (assigned only)', access: true },
      { label: 'Planning Board', access: false },
      { label: 'Asset Registry', access: false },
      { label: 'Inventory & Parts', access: false },
      { label: 'Procurement Hub', access: false },
      { label: 'Team Management', access: false },
      { label: 'Reports & Analytics', access: false },
      { label: 'Safety & Compliance', access: true },
      { label: 'Invoices & Billing', access: false },
      { label: 'Contracts', access: false },
      { label: 'Settings', access: false },
    ],
    capabilities: [
      'View and check off tasks on assigned job cards',
      'Log time against job cards',
      'File safety/work permits',
      'Report equipment breakdowns',
    ],
    restrictions: [
      'Can only see jobs assigned to them',
      'No access to financial data of any kind',
      'Cannot view asset registry or inventory',
      'Cannot view team, reports, or procurement',
      'Cannot see other technicians\' workloads',
    ],
    recommendation: 'Default role for all field staff. Most teams will have the majority of their headcount here.',
    idealCount: '5–50+',
  },
  {
    id: 'Purchasing',
    label: 'Purchasing Officer',
    color: '#7C3AED',
    icon: <ShoppingCart size={18} />,
    tagline: 'Manages suppliers and purchase orders',
    description: 'Purchasing Officers handle all external spending. They raise and receive purchase orders, manage the supplier registry, and ensure costs are correctly synced to job cards.',
    bestFor: 'Purchasing Officer, Procurement Officer, Buyer',
    pages: [
      { label: 'Dashboard Overview', access: true },
      { label: 'Procurement Hub', access: true },
      { label: 'Inventory & Parts', access: true },
      { label: 'Job Cards (view only)', access: true },
      { label: 'Intelligence Center', access: false },
      { label: 'Planning Board', access: false },
      { label: 'Asset Registry', access: false },
      { label: 'Team Management', access: false },
      { label: 'Reports & Analytics', access: false },
      { label: 'Safety & Compliance', access: false },
      { label: 'Invoices & Billing', access: false },
      { label: 'Contracts', access: false },
      { label: 'Settings', access: false },
    ],
    capabilities: [
      'Create and manage purchase orders (all PO types)',
      'Receive goods and sync costs to job cards',
      'Manage supplier registry',
      'Adjust inventory stock levels',
      'View job cards to link POs correctly',
    ],
    restrictions: [
      'Cannot create or modify job cards',
      'Cannot access financial intelligence or revenue data',
      'Cannot manage team roles or settings',
      'Cannot access safety permits',
    ],
    recommendation: 'Assign to your dedicated procurement staff. Pair with a Storeman if goods receipt is handled separately from purchasing.',
    idealCount: '1–3',
  },
  {
    id: 'Storeman',
    label: 'Storeman',
    color: '#D97706',
    icon: <Package size={18} />,
    tagline: 'Controls physical stock and goods receipt',
    description: 'Storemen are responsible for the physical warehouse — receiving goods against purchase orders, maintaining stock accuracy, and ensuring parts are available for technicians.',
    bestFor: 'Storeman, Warehouse Controller, Stock Clerk',
    pages: [
      { label: 'Inventory & Parts', access: true },
      { label: 'Procurement Hub (receive only)', access: true },
      { label: 'Dashboard Overview', access: true },
      { label: 'Intelligence Center', access: false },
      { label: 'Job Cards', access: false },
      { label: 'Planning Board', access: false },
      { label: 'Asset Registry', access: false },
      { label: 'Team Management', access: false },
      { label: 'Reports & Analytics', access: false },
      { label: 'Safety & Compliance', access: false },
      { label: 'Invoices & Billing', access: false },
      { label: 'Contracts', access: false },
      { label: 'Settings', access: false },
    ],
    capabilities: [
      'Receive goods against open purchase orders',
      'Adjust and update inventory stock levels',
      'View current stock levels and reorder points',
    ],
    restrictions: [
      'Cannot create purchase orders or manage suppliers',
      'Cannot view or edit job cards',
      'No access to financial data or reports',
      'Cannot manage team or settings',
    ],
    recommendation: 'Use when your warehouse staff are separate from the purchasing team. The Storeman physically receives goods while the Purchasing Officer raises the orders.',
    idealCount: '1–4',
  },
];

// ─── Recommendations engine ───────────────────────────────────────────────────

interface Recommendation {
  level: 'warning' | 'info' | 'success';
  title: string;
  message: string;
}

function generateRecommendations(team: any[]): Recommendation[] {
  const recs: Recommendation[] = [];
  const active = team.filter(m => m.isActive !== false);

  const adminCount = active.filter(m => (m.roles ?? [m.role]).some((r: string) => r === 'Admin')).length;
  const supervisorCount = active.filter(m => (m.roles ?? [m.role]).some((r: string) => r === 'Supervisor')).length;
  const plannerCount = active.filter(m => (m.roles ?? [m.role]).some((r: string) => r === 'Planner')).length;
  const techCount = active.filter(m => (m.roles ?? [m.role]).some((r: string) => r === 'Technician')).length;

  if (adminCount === 0) {
    recs.push({ level: 'warning', title: 'No Admin assigned', message: 'Your workspace has no Admin. Invite at least one person with Admin access to manage settings and billing.' });
  }
  if (adminCount > 3) {
    recs.push({ level: 'warning', title: 'Too many Admins', message: `You have ${adminCount} Admins. This increases risk — limit Admin access to 1–2 people who truly need full control.` });
  }
  if (supervisorCount === 0 && techCount > 0) {
    recs.push({ level: 'warning', title: 'No Supervisor for your technicians', message: `You have ${techCount} technician(s) but no Supervisor. Someone needs to assign jobs, close permits, and review completed work.` });
  }
  if (plannerCount === 0 && (techCount + supervisorCount) > 3) {
    recs.push({ level: 'info', title: 'Consider adding a Planner', message: 'With a growing team, a dedicated Planner role helps schedule preventive maintenance and coordinate workloads in advance.' });
  }
  if (techCount === 0) {
    recs.push({ level: 'info', title: 'No Technicians yet', message: 'Invite your field staff as Technicians so they can receive job assignments and check off tasks on the go.' });
  }
  if (active.length === 0) {
    recs.push({ level: 'warning', title: 'No team members', message: 'Your team roster is empty. Add members from the Team page to start assigning work.' });
  }
  if (adminCount >= 1 && supervisorCount >= 1 && techCount >= 1) {
    recs.push({ level: 'success', title: 'Good role coverage', message: 'Your team has Admin, Supervisor, and Technician roles covered. That\'s the minimum healthy structure for day-to-day operations.' });
  }

  return recs;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RolesPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>('Admin');

  useEffect(() => {
    teamApi.getAll()
      .then(data => setTeam(data || []))
      .catch(() => setTeam([]))
      .finally(() => setLoading(false));
  }, []);

  const recommendations = generateRecommendations(team);

  const roleCounts = ROLE_DEFINITIONS.map(r => ({
    id: r.id,
    count: team.filter(m => (m.roles ?? [m.role]).some((role: string) => role === r.id)).length,
  }));

  const recIcon = {
    warning: <AlertTriangle size={14} style={{ color: '#f59e0b' }} />,
    info:    <Lightbulb size={14} style={{ color: '#2383E2' }} />,
    success: <CheckCircle2 size={14} style={{ color: '#0F9D67' }} />,
  };
  const recBg = {
    warning: 'rgba(245,158,11,0.08)',
    info:    'rgba(35,131,226,0.08)',
    success: 'rgba(15,157,103,0.08)',
  };
  const recBorder = {
    warning: 'rgba(245,158,11,0.2)',
    info:    'rgba(35,131,226,0.2)',
    success: 'rgba(15,157,103,0.2)',
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(144,101,176,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9065B0' }}>
            <Shield size={20} />
          </div>
          <div>
            <h1 className="page-title">Roles & Permissions</h1>
            <p className="page-subtitle">Who can do what — and how your team should be structured</p>
          </div>
        </div>
      </div>

      {/* ── Role summary cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {ROLE_DEFINITIONS.map(role => {
          const count = roleCounts.find(r => r.id === role.id)?.count ?? 0;
          return (
            <div
              key={role.id}
              className="card"
              onClick={() => setExpanded(prev => prev === role.id ? null : role.id)}
              style={{
                padding: 16, cursor: 'pointer',
                borderLeft: `3px solid ${role.color}`,
                transition: 'box-shadow 0.15s',
                boxShadow: expanded === role.id ? `0 0 0 1px ${role.color}40` : undefined,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: role.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: role.color }}>
                  {role.icon}
                </div>
                {!loading && (
                  <span style={{ fontSize: 20, fontWeight: 800, color: role.color }}>{count}</span>
                )}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{role.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{role.tagline}</div>
              <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-tertiary)' }}>Ideal: {role.idealCount} members</div>
            </div>
          );
        })}
      </div>

      {/* ── Recommendations ── */}
      {recommendations.length > 0 && (
        <div className="card-elevated" style={{ padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Lightbulb size={15} style={{ color: '#DFAB01' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Role Recommendations</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>based on your current team</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recommendations.map((rec, i) => (
              <div key={i} style={{
                padding: '10px 14px', borderRadius: 8,
                background: recBg[rec.level],
                border: `1px solid ${recBorder[rec.level]}`,
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>{recIcon[rec.level]}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{rec.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{rec.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Detailed role breakdown ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ROLE_DEFINITIONS.map(role => {
          const isOpen = expanded === role.id;
          const count = roleCounts.find(r => r.id === role.id)?.count ?? 0;
          const members = team.filter(m => (m.roles ?? [m.role]).some((r: string) => r === role.id));

          return (
            <div key={role.id} className="card-elevated" style={{ overflow: 'hidden', borderLeft: `3px solid ${role.color}` }}>
              <button
                onClick={() => setExpanded(prev => prev === role.id ? null : role.id)}
                style={{
                  width: '100%', padding: '16px 20px', background: 'transparent', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, background: role.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: role.color, flexShrink: 0 }}>
                  {role.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{role.label}</span>
                    <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 10, background: role.color + '20', color: role.color, fontWeight: 600 }}>
                      {count} {count === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{role.tagline} · Best for: {role.bestFor}</div>
                </div>
                <span style={{ color: 'var(--text-muted)' }}>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>

              {isOpen && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
                    {role.description}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>

                    {/* Page access */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Page Access</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {role.pages.map(p => (
                          <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                            {p.access
                              ? <CheckCircle2 size={13} style={{ color: '#0F9D67', flexShrink: 0 }} />
                              : <XCircle size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            }
                            <span style={{ color: p.access ? 'var(--text-primary)' : 'var(--text-muted)' }}>{p.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Capabilities & restrictions */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>What they can do</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {role.capabilities.map((c, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                            <span style={{ color: role.color, marginTop: 1, flexShrink: 0 }}>✓</span>
                            {c}
                          </div>
                        ))}
                      </div>
                      {role.restrictions.length > 0 && (
                        <>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 }}>Restrictions</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {role.restrictions.map((r, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                                <span style={{ flexShrink: 0, marginTop: 1 }}>—</span>
                                {r}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Members + recommendation */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Team members with this role</div>
                      {loading ? (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading...</div>
                      ) : members.length === 0 ? (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No members assigned</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                          {members.map((m: any) => {
                            const name = m.firstName ? `${m.firstName} ${m.lastName || ''}`.trim() : m.email ?? m.userName;
                            const initial = (name[0] ?? '?').toUpperCase();
                            return (
                              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div className="avatar" style={{ width: 28, height: 28, fontSize: 10, flexShrink: 0, background: role.color }}>{initial}</div>
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{name}</div>
                                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.email ?? m.userName}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div style={{ padding: '10px 12px', borderRadius: 8, background: role.color + '10', border: `1px solid ${role.color}25`, marginTop: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: role.color, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Recommendation</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{role.recommendation}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ paddingTop: 16, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => window.location.href = '/dashboard/team'}
                    >
                      <Users size={13} /> Manage Team
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
