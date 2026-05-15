'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Edit2, RefreshCw } from 'lucide-react';
import { subscriptionsApi } from '@/lib/api';

const PLAN_COLORS = ['var(--accent-blue)', 'var(--accent-violet)', 'var(--accent-emerald)', 'var(--accent-amber)'];
const PLAN_GRADIENTS = [
  'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))',
  'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.05))',
  'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
  'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))',
];

function Skeleton({ h = 16, w = '100%' }: { h?: number; w?: string }) {
  return <div style={{ height: h, width: w, borderRadius: 6, background: 'rgba(255,255,255,0.07)', animation: 'pulse 1.5s ease-in-out infinite' }} />;
}

export default function PlansPage() {
  const [plans, setPlans]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    subscriptionsApi.getPlans()
      .then(data => { setPlans(Array.isArray(data) ? data : []); setError(null); })
      .catch(() => setError('Could not load plans from /api/subscriptions/plans'))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.5, marginBottom: 4 }}>Subscription Plans</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Configure tiers, features and pricing · GET /api/subscriptions/plans</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={13}/> Refresh</button>
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
          <div style={{ fontSize: 14, marginBottom: 8 }}>No plans returned from the API</div>
          <div style={{ fontSize: 12 }}>Seed subscription plans in the database via the backend</div>
        </div>
      ) : (
        <div className="stats-grid-3" style={{ marginBottom: 28, alignItems: 'start' }}>
          {plans.map((plan: any, idx: number) => {
            const color    = PLAN_COLORS[idx % PLAN_COLORS.length];
            const gradient = PLAN_GRADIENTS[idx % PLAN_GRADIENTS.length];
            const price    = plan.monthlyPrice ?? plan.price ?? plan.amount ?? 0;
            const features: string[] = plan.features ?? plan.featureList ?? [];
            const tenantCount = plan.tenantCount ?? plan.subscriberCount ?? 0;
            return (
              <div key={plan.id ?? plan.name} style={{ background: gradient, border: `1px solid ${color}30`, borderRadius: 'var(--radius-xl)', padding: 24 }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                    {plan.name ?? plan.planName ?? `Plan ${idx + 1}`}
                  </div>
                  <div style={{ fontSize: price === 0 ? 18 : 32, fontWeight: 800, color, letterSpacing: -1, lineHeight: 1 }}>
                    {price === 0 ? 'Custom' : `K ${price.toLocaleString()}`}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>per month</div>
                </div>
                {features.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    {features.map((f: string) => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <CheckCircle2 size={13} style={{ color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ paddingTop: 16, borderTop: `1px solid ${color}20`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    <strong style={{ color }}>{tenantCount}</strong> tenants
                  </span>
                  <button className="btn btn-secondary btn-sm"><Edit2 size={11}/> Edit</button>
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
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}
