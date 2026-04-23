'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Shield, User, Building2, Bell, CheckCircle2, AlertTriangle, Key, LogOut, Database, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { settingsApi, subscriptionApi } from '@/lib/api';
import SlideOver from '@/components/SlideOver';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const isOwner = user?.roles?.includes('PlatformOwner') || user?.roles?.includes('Admin');
  
  const [activeTab, setActiveTab] = useState('billing');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [allPlans, setAllPlans] = useState<any[]>([]);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    subscriptionApi.getCurrentPlan().then(setCurrentPlan).catch(console.error);
    subscriptionApi.getPlans().then(setAllPlans).catch(console.error);
  }, []);
  
  const tabs = [
    { id: 'profile', icon: <User size={15}/>, label: 'My Account' },
    { id: 'workspace', icon: <Building2 size={15}/>, label: 'Workspace' },
    { id: 'billing', icon: <CreditCard size={15}/>, label: 'Plans & Billing' },
    { id: 'security', icon: <Shield size={15}/>, label: 'Security' },
    { id: 'notifications', icon: <Bell size={15}/>, label: 'Notifications' },
    { id: 'tools', icon: <Database size={15}/>, label: 'Data & Tools' },
  ];

  const handleAction = (action: string) => {
    if (action === 'upgrade') setShowUpgradeModal(true);
    if (action === 'delete') setShowDeleteConfirm(true);
    if (action === 'payment') alert("Redirecting to secure Stripe billing portal...");
    if (action === 'pwd') alert("Password reset link sent to your email.");
  };

  const handleUpgrade = async (planId: number) => {
    setUpgrading(true);
    try {
      const res = await subscriptionApi.upgrade(planId);
      alert(res.message || "Upgrade requested.");
      subscriptionApi.getCurrentPlan().then(setCurrentPlan);
      setShowUpgradeModal(false);
    } catch(err: any) {
      alert("Error upgrading: " + err.message);
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div>
      <SlideOver open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} title="Change Plan" subtitle="Select a subscription tier that matches your operational scale.">
         <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
           {allPlans.length === 0 ? (
             <div style={{ color: 'var(--text-muted)' }}>Loading plans...</div>
           ) : allPlans.map(plan => {
             const active = currentPlan?.id === plan.id;
             return (
             <div key={plan.id} style={{ padding: 20, border: '1px solid var(--border-subtle)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: active ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = active ? 'var(--accent-blue)' : 'var(--border-subtle)'}>
                <div style={{ flex: 1, paddingRight: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{plan.name}</div>
                    {active && <span className="badge badge-blue">Current</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{plan.description}</div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                    K {plan.priceMonthly.toLocaleString()} <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>/ mo</span>
                  </div>
                  <button className={`btn btn-sm ${active ? 'btn-secondary' : 'btn-primary'}`} 
                          onClick={(e) => { e.stopPropagation(); handleUpgrade(plan.id); }} 
                          disabled={active || upgrading} style={{ minWidth: 90 }}>
                    {active ? 'Active' : (upgrading ? 'Wait...' : 'Upgrade')}
                  </button>
                </div>
             </div>
             )
           })}
           <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>
             All prices are billed monthly in Zambian Kwacha (ZMW). Annual billing saves 15%.
           </div>
         </div>
      </SlideOver>

      <SlideOver open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Workspace" subtitle="Irreversible destructive action.">
         <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: 20, borderRadius: 8, border: '1px outset rgba(244, 63, 94, 0.3)' }}>
           <AlertTriangle size={32} style={{ color: 'var(--accent-rose)', marginBottom: 12 }} />
           <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-rose)', margin: '0 0 10px 0' }}>Are you absolutely sure?</h3>
           <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 20 }}>
             This action cannot be undone. This will permanently delete the <strong>Anchor Pro</strong> workspace, all job cards, inventory databases, and remove all team member associations.
           </p>
           <div className="form-field">
             <label className="form-label" style={{ color: 'var(--accent-rose)' }}>Type "PERMANENTLY DELETE" to confirm</label>
             <input className="form-input" placeholder="" />
           </div>
           <button className="btn btn-primary" style={{ background: 'var(--accent-rose)', border: 'none', width: '100%', marginTop: 20 }}>Delete Everything</button>
         </div>
      </SlideOver>

      <div className="page-header" style={{ marginBottom: 30 }}>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account, workspace preferences, and subscription.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 300px) 1fr', gap: 30, alignItems: 'start' }}>
        
        {/* Sidebar Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tabs.map(nav => (
            <button key={nav.id} 
              onClick={() => setActiveTab(nav.id)}
              style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              border: 'none', background: activeTab === nav.id ? 'rgba(255,255,255,0.06)' : 'transparent',
              color: activeTab === nav.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderRadius: 6, fontSize: 13, fontWeight: activeTab === nav.id ? 600 : 500,
              cursor: 'pointer', transition: 'background 0.1s', textAlign: 'left'
            }}>
              <span style={{ color: activeTab === nav.id ? 'var(--text-primary)' : 'var(--text-muted)' }}>{nav.icon}</span>
              {nav.label}
            </button>
          ))}
        </div>

        {/* Settings Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
          
          {activeTab === 'billing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
              <section>
                <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>Current Plan: {currentPlan?.name || 'Loading...'}</h3>
                      <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>You are on the {currentPlan?.name || 'Anchor Pro'} tier. {currentPlan?.description}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>K {currentPlan?.priceMonthly?.toLocaleString() || '0'}<span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>/mo</span></div>
                      <div style={{ fontSize: 11, color: 'var(--accent-blue)', marginTop: 8, fontWeight: 600 }}>Billing unmetered</div>
                    </div>
                  </div>
                  <div style={{ padding: '16px 24px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CreditCard size={18} style={{ color: 'var(--text-muted)' }}/>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Visa ending in 4242</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Expires 12/2028</div>
                      </div>
                    </div>
                    {isOwner && (
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleAction('payment')}>Update payment method</button>
                        <button className="btn btn-primary btn-sm" onClick={() => handleAction('upgrade')}>Upgrade Plan</button>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 16px 0' }}>Workspace Usage</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  {[
                    { label: 'Registered Team', used: 12, max: 20, unit: 'Seats' },
                    { label: 'Asset Library', used: 45, max: 'Unlimited', unit: 'Assets' },
                    { label: 'Storage Space', used: 3.2, max: 5, unit: 'TB' },
                  ].map(stat => (
                    <div key={stat.label} className="card" style={{ padding: 20 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>{stat.label}</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                        {stat.used} <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>/ {stat.max} {stat.unit}</span>
                      </div>
                      <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--accent-blue)', width: typeof stat.max === 'number' ? `${(stat.used / stat.max) * 100}%` : '5%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="card-elevated" style={{ padding: 30 }}>
               <h3 style={{ fontSize: 18, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 24 }}>Personal Information</h3>
               
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                 <div className="form-field">
                   <label className="form-label">First Name</label>
                   <input className="form-input" defaultValue={user?.firstName || ''} />
                 </div>
                 <div className="form-field">
                   <label className="form-label">Last Name</label>
                   <input className="form-input" defaultValue={user?.lastName || ''} />
                 </div>
               </div>
               
               <div className="form-field" style={{ marginBottom: 24 }}>
                 <label className="form-label">Email Address</label>
                 <input className="form-input" readOnly defaultValue={user?.email || ''} style={{ background: 'var(--bg-app)' }} />
               </div>

               <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 24, display: 'flex', gap: 10 }}>
                 <button className="btn btn-primary" onClick={() => alert("Profile updated.")}>Save Changes</button>
               </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card-elevated" style={{ padding: 30 }}>
               <h3 style={{ fontSize: 18, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                 <Key size={18} /> Password & Access
               </h3>
               
               <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 20 }}>
                 Your account is secured via standard username/password authentication. You can choose to reset your credentials.
               </p>

               <button className="btn btn-secondary" onClick={() => handleAction('pwd')}>Send Password Reset Email</button>
               
               <div style={{ marginTop: 40 }}>
                 <h4 style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 10 }}>Active Sessions</h4>
                 <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 16 }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div>
                       <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>Windows PC — Chrome</div>
                       <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Lusaka, ZM · Active now</div>
                     </div>
                     <span className="badge badge-green">Current Session</span>
                   </div>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'workspace' && (
             <div className="card-elevated" style={{ padding: 30 }}>
              <h3 style={{ fontSize: 18, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 24 }}>Workspace Settings</h3>
              
              <div className="form-field" style={{ marginBottom: 24 }}>
                <label className="form-label">Organization Name</label>
                <input className="form-input" defaultValue="Anchor Pro" />
              </div>

              <div className="form-field" style={{ marginBottom: 24 }}>
                <label className="form-label">Base Currency</label>
                <select className="form-select">
                  <option>Zambian Kwacha (ZMW)</option>
                  <option>US Dollar (USD)</option>
                </select>
              </div>

              <button className="btn btn-primary">Save Configuration</button>

              {isOwner && (
                <section style={{ marginTop: 40 }}>
                  <div style={{ border: '1px solid rgba(244, 63, 94, 0.3)', background: 'rgba(244, 63, 94, 0.05)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent-rose)', margin: '0 0 6px 0' }}>Danger Zone</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: '0 0 16px 0' }}>Permanently delete this workspace and all associated data. This action cannot be undone.</p>
                    <button className="btn btn-sm" style={{ background: 'var(--accent-rose)', color: '#fff', border: 'none' }} onClick={() => handleAction('delete')}>Delete Workspace</button>
                  </div>
                </section>
              )}
             </div>
          )}
          
          {activeTab === 'notifications' && (
             <div className="card-elevated" style={{ padding: 30 }}>
               <h3 style={{ fontSize: 18, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 24 }}>Notification Routing</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                 {[
                   { label: 'Weekly Summary Emails', desc: 'Receive a digest of all jobs and downtime.', active: true },
                   { label: 'Critical Asset Alerts', desc: 'Immediate notification if High Priority assets fail.', active: true },
                   { label: 'Inventory Reorder Alerts', desc: 'When stock drops below defined threshold.', active: false },
                   { label: 'Technician Assignment', desc: 'When a new job is routed to your queue.', active: true }
                 ].map(n => (
                   <label key={n.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, border: '1px solid var(--border-subtle)', borderRadius: 8, cursor: 'pointer' }}>
                     <div>
                       <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{n.label}</div>
                       <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{n.desc}</div>
                     </div>
                     <input type="checkbox" defaultChecked={n.active} style={{ transform: 'scale(1.2)' }} />
                   </label>
                 ))}
               </div>
             </div>
          )}

          {activeTab === 'tools' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
              <div className="card-elevated" style={{ padding: 30 }}>
                <h3 style={{ fontSize: 18, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Database size={18} /> Demo Data Generator
                </h3>
                <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
                  Instantly populate your workspace with realistic industrial assets (CAT Trucks, Komatsu Excavators), historical job cards,
                  and stock inventory. Perfect for demos and onboarding new team members.
                </p>

                {seedResult && (
                  <div style={{ padding: 12, borderRadius: 8, marginBottom: 16, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={16} /> {seedResult}
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  disabled={seeding}
                  onClick={async () => {
                    setSeeding(true);
                    setSeedResult(null);
                    try {
                      const res = await settingsApi.seedDemoData();
                      setSeedResult(res.message || 'Demo data generated successfully!');
                    } catch (err: any) {
                      setSeedResult('Error: ' + err.message);
                    } finally {
                      setSeeding(false);
                    }
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {seeding ? <><Loader2 size={14} className="spin" /> Generating...</> : <><Database size={14} /> Generate Sample Data</>}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
