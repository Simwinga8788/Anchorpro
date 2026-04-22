'use client';

import { CheckCircle2, Edit2 } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: 1500,
    billing: 'per month',
    color: 'var(--accent-blue)',
    gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))',
    tenants: 0,
    features: [
      '5 Users', '50 Job Cards/month', 'Asset Registry', 'Inventory Tracking',
      'Email Support', 'Basic Reporting', '1 Department',
    ],
    popular: false,
  },
  {
    name: 'Professional',
    price: 2500,
    billing: 'per month',
    color: 'var(--accent-violet)',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.05))',
    tenants: 3,
    features: [
      'Unlimited Users', 'Unlimited Job Cards', 'Full Asset Registry', 'Inventory + Procurement',
      'Planning Board (Kanban)', 'Safety & Compliance', 'Full Reports & Analytics',
      'Intelligence Center', 'Priority Support', 'Multi-Department',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 0,
    billing: 'custom pricing',
    color: 'var(--accent-emerald)',
    gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
    tenants: 0,
    features: [
      'Everything in Professional', 'Dedicated Instance', 'SLA Guarantee', 'Custom Integrations',
      'Dedicated Account Manager', 'On-site Training', 'Custom Reporting',
    ],
    popular: false,
  },
];

export default function PlansPage() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.5, marginBottom: 4 }}>Subscription Plans</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Configure tiers, features and pricing for the Anchor Pro platform</p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="stats-grid-3" style={{ marginBottom: 28, alignItems: 'start' }}>
        {plans.map(plan => (
          <div key={plan.name} style={{
            background: plan.gradient, border: `1px solid ${plan.color}30`,
            borderRadius: 'var(--radius-xl)', padding: 24, position: 'relative',
          }}>
            {plan.popular && (
              <div style={{
                position: 'absolute', top: -1, right: 20,
                background: 'var(--accent-violet)', color: 'white',
                fontSize: 10, fontWeight: 800, padding: '3px 12px',
                borderRadius: '0 0 8px 8px', letterSpacing: 0.5, textTransform: 'uppercase',
              }}>CURRENT TIER</div>
            )}

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                {plan.name}
              </div>
              <div style={{ fontSize: plan.price === 0 ? 18 : 32, fontWeight: 800, color: plan.color, letterSpacing: -1, lineHeight: 1 }}>
                {plan.price === 0 ? 'Custom' : `K ${plan.price.toLocaleString()}`}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{plan.billing}</div>
            </div>

            <div style={{ marginBottom: 20 }}>
              {plan.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <CheckCircle2 size={13} style={{ color: plan.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{f}</span>
                </div>
              ))}
            </div>

            <div style={{ paddingTop: 16, borderTop: `1px solid ${plan.color}20`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                <strong style={{ color: plan.color }}>{plan.tenants}</strong> tenants on this plan
              </span>
              <button className="btn btn-secondary btn-sm"><Edit2 size={11}/> Edit</button>
            </div>
          </div>
        ))}
      </div>

      {/* Note */}
      <div className="card" style={{ padding: 20 }}>
        <div className="section-title" style={{ marginBottom: 8 }}>💡 Platform Billing Model</div>
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
          Anchor Pro operates a <strong style={{ color: 'var(--text-primary)' }}>manual invoice / proof-of-payment</strong> model. 
          Tenants submit bank transfer or mobile money proof via the portal, which you review and approve here in the Platform Console. 
          Automatic Stripe/PayPal integration can be added in the next phase.
        </p>
      </div>
    </div>
  );
}
