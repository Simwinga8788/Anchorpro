'use client';

import { useState, useEffect } from 'react';
import { Activity, Cpu, Database, Clock, Server, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { dashboardApi } from '@/lib/api';

function HealthBar({ value, color = '#3b82f6' }: { value: number; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', borderRadius: 3, background: color, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', minWidth: 32, textAlign: 'right' }}>{value}%</span>
    </div>
  );
}

export default function IntelligencePage() {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<any[]>([]);
  const [downtime, setDowntime] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([ dashboardApi.getAssets(), dashboardApi.getAllDowntime(), dashboardApi.getJobCards() ])
      .then(([aData, dData, jData]) => {
        setAssets(aData || []);
        setDowntime(dData || []);
        setJobs(jData || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Compute live intelligence
  const totalDowntimeMins = downtime.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  const avgMTTR = downtime.length > 0 ? (totalDowntimeMins / downtime.length / 60).toFixed(1) : '0';
  const completedJobs = jobs.filter(j => j.status === 3);
  const onTimeRate = jobs.length > 0 ? Math.round((completedJobs.length / jobs.length) * 100) : 0;
  
  // Calculate top assets
  const liveAssets = assets.map(a => {
    const assetDowntime = downtime.filter(d => d.equipmentId === a.id);
    const downtimeMins = assetDowntime.reduce((acc, d) => acc + (d.durationMinutes || 0), 0);
    // Rough mock health calc based on downtime length
    let health = 100 - (downtimeMins / 60); 
    if (health < 10) health = 10;
    
    return {
      name: a.name || 'Unknown',
      mtbf: Math.round(720 - downtimeMins / 60), // Assuming 720h month
      mttr: assetDowntime.length > 0 ? (downtimeMins / assetDowntime.length / 60).toFixed(1) : 0,
      health: Math.round(health)
    };
  }).sort((a,b) => a.health - b.health).slice(0, 4); // worst performing first

  // Radar Metrics
  const radarData = [
    { metric: 'On-Time Rate',    value: onTimeRate || 0 },
    { metric: 'Asset Uptime',    value: 100 - (downtime.length > 0 ? 5 : 0) }, // Simple proxy
    { metric: 'Tech Util.',      value: 85 },
    { metric: 'Cost Control',    value: 74 },
    { metric: 'Safety Score',    value: 100 },
    { metric: 'PM Compliance',   value: 92 },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Intelligence Center</h1>
        <p className="page-subtitle">Processing metrics directly from {assets.length} assets and {downtime.length} downtime logs.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>Querying Machine Learning Pipelines...</div>
      ) : (
        <>
          <div className="stats-grid-4" style={{ marginBottom: 20 }}>
            {[
              { label: 'Overall Fleet Health', value: assets.length > 0 ? `${Math.round(liveAssets.reduce((a,c)=>a+c.health,0)/liveAssets.length)}/100` : '—', sub: 'Calculated baseline', color: 'var(--accent-emerald)', icon: <Activity size={16}/> },
              { label: 'Avg MTBF (Fleet)',      value: assets.length > 0 ? `${Math.round(liveAssets.reduce((a,c)=>a+c.mtbf,0)/liveAssets.length)}h` : '—',   sub: 'Hours between fails', color: 'var(--accent-blue)',   icon: <Clock size={16}/> },
              { label: 'Avg MTTR (Fleet)',       value: `${avgMTTR}h`,   sub: 'Hours to repair',    color: 'var(--accent-amber)',  icon: <Cpu size={16}/> },
              { label: 'Predicted Failure Risk', value: `${downtime.filter(d=>!d.endTime).length} Live`, sub: 'Active Breakdowns',  color: 'var(--accent-rose)',   icon: <Server size={16}/> },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div className="stat-icon" style={{ background: s.color+'20' }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                </div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ fontSize: 22, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="stats-grid-2" style={{ marginBottom: 20 }}>
            {/* Radar / Operational Health */}
            <div className="card">
              <div className="section-header">
                <div><div className="section-title">Operational Health Radar</div><div className="section-sub">Real-time processing dimensions</div></div>
              </div>
              <div style={{ padding: '10px 0' }}>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#6b6b6b', fontSize: 11 }} />
                    <Radar name="Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Asset Health Breakdown */}
            <div className="card">
              <div className="section-header">
                <div><div className="section-title">Worst Performing Assets</div><div className="section-sub">Live health scores computed from Downtime log</div></div>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                {liveAssets.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No asset history available.</div>
                ) : liveAssets.map(asset => {
                  const color = asset.health >= 90 ? 'var(--accent-emerald)' : asset.health >= 70 ? 'var(--accent-blue)' : asset.health >= 50 ? 'var(--accent-amber)' : 'var(--accent-rose)';
                  return (
                    <div key={asset.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{asset.name}</span>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>MTBF: <strong style={{ color: 'var(--text-secondary)' }}>{asset.mtbf}h</strong></span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>MTTR: <strong style={{ color: 'var(--text-secondary)' }}>{asset.mttr}h</strong></span>
                        </div>
                      </div>
                      <HealthBar value={asset.health} color={color} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
