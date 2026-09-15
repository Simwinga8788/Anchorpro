'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Edit2, Plus, RefreshCw, Loader2, EyeOff, Eye } from 'lucide-react';
import { subscriptionsApi } from '@/lib/api';
import Modal from '@/components/Modal';
import { formatCurrency } from '@/lib/currency';

const PLAN_COLORS = ['var(--accent-blue)', 'var(--accent-violet)', 'var(--accent-emerald)', 'var(--accent-amber)'];
const PLAN_GRADIENTS = [
  'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))',
  'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.05))',
  'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
  'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))',
];

const BLANK_FORM = {
  name: '', description: '', monthlyPrice: '0', annualPrice: '0', currency: 'ZMW',
  maxTechnicians: '5', maxEquipment: '10', maxActiveJobs: '20', storageLimitMB: '500',
  allowExports: true, allowPredictiveEngine: false, allowMobileAccess: true,
};

function Skeleton({ h = 16, w = '100%' }: { h?: number; w?: string }) {
  return <div style={{ height: h, width: w, borderRadius: 6, background: 'rgba(255,255,255,0.07)', animation: 'pulse 1.5s ease-in-out infinite' }} />;
}

export default function PlansPage() {
  const [plans, setPlans]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [editingPlan, setEditingPlan] = useState<any>(null); // null = closed, {} = creating new
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    subscriptionsApi.getPlansForAdmin()
      .then(data => { setPlans(Array.isArray(data) ? data : []); setError(null); })
      .catch(() => setError('Could not load plans from /api/subscriptions/plans/admin'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleNewClick = () => {
    setEditingPlan({});
    setForm(BLANK_FORM);
  };

  const handleEditClick = (plan: any) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name ?? '',
      description: plan.description ?? '',
      monthlyPrice: String(plan.monthlyPrice ?? 0),
      annualPrice: String(plan.annualPrice ?? 0),
      currency: plan.currency ?? 'ZMW',
      maxTechnicians: String(plan.maxTechnicians ?? 0),
      maxEquipment: String(plan.maxEquipment ?? 0),
      maxActiveJobs: String(plan.maxActiveJobs ?? 0),
      storageLimitMB: String(plan.storageLimitMB ?? 0),
      allowExports: !!plan.allowExports,
      allowPredictiveEngine: !!plan.allowPredictiveEngine,
      allowMobileAccess: !!plan.allowMobileAccess,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { alert('Plan name is required'); return; }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      monthlyPrice: parseFloat(form.monthlyPrice) || 0,
      annualPrice: parseFloat(form.annualPrice) || 0,
      currency: form.currency,
      maxTechnicians: parseInt(form.maxTechnicians) || 0,
      maxEquipment: parseInt(form.maxEquipment) || 0,
      maxActiveJobs: parseInt(form.maxActiveJobs) || 0,
      storageLimitMB: parseInt(form.storageLimitMB) || 0,
      allowExports: form.allowExports,
      allowPredictiveEngine: form.allowPredictiveEngine,
      allowMobileAccess: form.allowMobileAccess,
    };

    setSaving(true);
    try {
      if (editingPlan?.id) {
        await subscriptionsApi.updatePlan(editingPlan.id, payload);
      } else {
        await subscriptionsApi.createPlan(payload);
      }
      setEditingPlan(null);
      load();
    } catch (err: any) {
      alert(err.message || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (plan: any) => {
    setTogglingId(plan.id);
    try {
      await subscriptionsApi.setPlanActive(plan.id, !plan.isActive);
      load();
    } catch (err: any) {
      alert(err.message || 'Failed to update plan');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.5, marginBottom: 4 }}>Subscription Plans</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Create, edit, and retire tiers — everything here is live, nothing is hardcoded.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={13}/> Refresh</button>
          <button className="btn btn-primary btn-sm" onClick={handleNewClick}><Plus size={13}/> New Plan</button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--accent-rose-dim)', border: '1px solid var(--accent-rose)', borderRadius: 8, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: 'var(--accent-rose)' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="stats-grid-3" style={{ alignItems: 'start' }}>
          {[1,2,3].map(i => (
            <div key={i} className="card" style={{ padding: 24 }}>
              <Skeleton h={24} w="60%" />
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Skeleton h={14} /><Skeleton h={14} w="80%" /><Skeleton h={14} w="70%" />
              </div>
            </div>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 14, marginBottom: 8 }}>No plans yet</div>
          <button className="btn btn-primary btn-sm" onClick={handleNewClick} style={{ marginTop: 12 }}><Plus size={13}/> Create your first plan</button>
        </div>
      ) : (
        <div className="stats-grid-3" style={{ marginBottom: 28, alignItems: 'start' }}>
          {plans.map((plan: any, idx: number) => {
            const color    = PLAN_COLORS[idx % PLAN_COLORS.length];
            const gradient = PLAN_GRADIENTS[idx % PLAN_GRADIENTS.length];
            const price    = plan.monthlyPrice ?? 0;
            const limits = [
              `${plan.maxTechnicians} technicians`,
              `${plan.maxEquipment} equipment`,
              `${plan.maxActiveJobs} active jobs`,
              `${plan.storageLimitMB} MB storage`,
            ];
            const features = [
              plan.allowExports && 'Exports',
              plan.allowPredictiveEngine && 'Predictive engine',
              plan.allowMobileAccess && 'Mobile access',
            ].filter(Boolean) as string[];
            return (
              <div key={plan.id} style={{ background: plan.isActive ? gradient : 'var(--bg-hover)', border: `1px solid ${plan.isActive ? color + '30' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-xl)', padding: 24, opacity: plan.isActive ? 1 : 0.6 }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                      {plan.name}
                    </div>
                    {!plan.isActive && <span className="badge badge-gray" style={{ fontSize: 9 }}>Inactive</span>}
                  </div>
                  <div style={{ fontSize: price === 0 ? 18 : 32, fontWeight: 800, color: plan.isActive ? color : 'var(--text-muted)', letterSpacing: -1, lineHeight: 1 }}>
                    {price === 0 ? 'Free' : formatCurrency(price, plan.currency, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>per month</div>
                  {plan.description && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>{plan.description}</div>}
                </div>
                <div style={{ marginBottom: 16 }}>
                  {limits.map(l => (
                    <div key={l} style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 4 }}>{l}</div>
                  ))}
                  {features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <CheckCircle2 size={13} style={{ color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <div style={{ paddingTop: 16, borderTop: `1px solid ${color}20`, display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                  <button className="btn btn-secondary btn-sm" disabled={togglingId === plan.id} onClick={() => handleToggleActive(plan)}>
                    {plan.isActive ? <EyeOff size={11}/> : <Eye size={11}/>} {plan.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleEditClick(plan)}><Edit2 size={11}/> Edit</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card" style={{ padding: 20 }}>
        <div className="section-title" style={{ marginBottom: 8 }}>Platform Billing Model</div>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
          Anchor Pro operates a <strong style={{ color: 'var(--text-primary)' }}>manual invoice / proof-of-payment</strong> model.
          Tenants submit bank transfer or mobile money proof, which you review and approve here in the Platform Console.
        </p>
      </div>

      <Modal
        open={editingPlan !== null}
        onClose={() => setEditingPlan(null)}
        title={editingPlan?.id ? 'Edit Plan' : 'New Plan'}
        subtitle={editingPlan?.id ? `Update every field on the "${editingPlan?.name}" tier.` : 'Create a new subscription tier.'}
        width={480}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Plan Name</label>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Starter" required disabled={saving} autoFocus />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Description</label>
            <textarea className="form-input" style={{ minHeight: 50 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What this tier is for and who it suits" disabled={saving} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Monthly Price</label>
              <input type="number" step="0.01" min="0" className="form-input" value={form.monthlyPrice} onChange={e => setForm(f => ({ ...f, monthlyPrice: e.target.value }))} disabled={saving} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Annual Price</label>
              <input type="number" step="0.01" min="0" className="form-input" value={form.annualPrice} onChange={e => setForm(f => ({ ...f, annualPrice: e.target.value }))} disabled={saving} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Currency</label>
              <select className="form-select" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} disabled={saving}>
                <option value="ZMW">ZMW</option>
                <option value="USD">USD</option>
                <option value="ZAR">ZAR</option>
                <option value="KES">KES</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 }}>Limits</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Max Technicians</label>
              <input type="number" min="0" className="form-input" value={form.maxTechnicians} onChange={e => setForm(f => ({ ...f, maxTechnicians: e.target.value }))} disabled={saving} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Max Equipment</label>
              <input type="number" min="0" className="form-input" value={form.maxEquipment} onChange={e => setForm(f => ({ ...f, maxEquipment: e.target.value }))} disabled={saving} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Max Active Jobs</label>
              <input type="number" min="0" className="form-input" value={form.maxActiveJobs} onChange={e => setForm(f => ({ ...f, maxActiveJobs: e.target.value }))} disabled={saving} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Storage (MB)</label>
              <input type="number" min="0" className="form-input" value={form.storageLimitMB} onChange={e => setForm(f => ({ ...f, storageLimitMB: e.target.value }))} disabled={saving} />
            </div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 }}>Features</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { key: 'allowExports' as const, label: 'Exports' },
              { key: 'allowPredictiveEngine' as const, label: 'Predictive engine' },
              { key: 'allowMobileAccess' as const, label: 'Mobile access' },
            ].map(({ key, label }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} disabled={saving} />
                {label}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingPlan(null)} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {saving && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
              {editingPlan?.id ? 'Save Changes' : 'Create Plan'}
            </button>
          </div>
        </form>
      </Modal>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}
