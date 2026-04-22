'use client';

import { useState, useEffect } from 'react';
import { Activity, Cpu, Database, Clock, Server, TrendingUp, DollarSign, Users, Package } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { intelligenceApi } from '@/lib/api';

function HealthBar({ value, color = '#3b82f6' }: { value: number; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(value, 100)}%`, height: '100%', borderRadius: 3, background: color, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', minWidth: 32, textAlign: 'right' }}>{value.toFixed(1)}%</span>
    </div>
  );
}

export default function IntelligencePage() {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [profitability, setProfitability] = useState<any[]>([]);
  const [techUtils, setTechUtils] = useState<any[]>([]);
  const [assetPerf, setAssetPerf] = useState<any[]>([]);
  const [invConsumption, setInvConsumption] = useState<any[]>([]);
  const [executive, setExecutive] = useState<any>(null);

  const loadData = (period: number) => {
    setLoading(true);
    Promise.all([
      intelligenceApi.getProfitability(period),
      intelligenceApi.getTechUtilization(period),
      intelligenceApi.getAssetPerformance(period),
      intelligenceApi.getInventoryConsumption(period),
      intelligenceApi.getExecutiveSummary(),
    ])
      .then(([prof, tech, asset, inv, exec]) => {
        setProfitability(prof || []);
        setTechUtils(tech || []);
        setAssetPerf(asset || []);
        setInvConsumption(inv || []);
        setExecutive(exec);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(days); }, [days]);

  const totalRevenue = profitability.reduce((a, c) => a + (c.revenue || 0), 0);
  const totalProfit = profitability.reduce((a, c) => a + (c.profit || 0), 0);
  const avgMargin = profitability.length > 0 ? profitability.reduce((a, c) => a + (c.marginPercent || 0), 0) / profitability.length : 0;

  // Radar data from real metrics
  const avgUtil = techUtils.length > 0 ? techUtils.reduce((a, c) => a + Number(c.utilizationPercent || 0), 0) / techUtils.length : 0;
  const avgMTTR = assetPerf.length > 0 ? assetPerf.reduce((a, c) => a + (c.mttr || 0), 0) / assetPerf.length : 0;
  const radarData = [
    { metric: 'Profit Margin',   value: Math.min(avgMargin, 100) },
    { metric: 'Tech Utilization', value: Math.min(avgUtil, 100) },
    { metric: 'Asset Uptime',    value: assetPerf.length > 0 ? Math.max(0, 100 - assetPerf.reduce((a, c) => a + (c.downtimePercent || 0), 0) / assetPerf.length) : 100 },
    { metric: 'MTTR Score',      value: avgMTTR > 0 ? Math.max(0, 100 - avgMTTR * 5) : 100 },
    { metric: 'Parts Efficiency', value: invConsumption.length > 0 ? Math.min(100, 100 - invConsumption.length * 2) : 100 },
    { metric: 'Completion Rate',  value: executive?.overdueJobsCount > 0 ? Math.max(0, 100 - executive.overdueJobsCount * 10) : 100 },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Intelligence Center</h1>
          <p className="page-subtitle">Live analytics from {profitability.length} jobs, {techUtils.length} technicians, {assetPerf.length} assets.</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[7, 14, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)} className={`btn btn-sm ${days === d ? 'btn-primary' : 'btn-secondary'}`}>{d}d</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>Querying Intelligence Pipelines...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="stats-grid-4" style={{ marginBottom: 20 }}>
            {[
              { label: 'Revenue (Period)', value: `K ${totalRevenue.toLocaleString(undefined, {minimumFractionDigits:0})}`, sub: `${profitability.length} completed jobs`, color: 'var(--accent-emerald)', icon: <DollarSign size={16}/> },
              { label: 'Gross Profit', value: `K ${totalProfit.toLocaleString(undefined, {minimumFractionDigits:0})}`, sub: `${avgMargin.toFixed(1)}% avg margin`, color: 'var(--accent-blue)', icon: <TrendingUp size={16}/> },
              { label: 'Avg MTTR (Fleet)', value: `${avgMTTR.toFixed(1)}h`, sub: `Across ${assetPerf.length} assets`, color: 'var(--accent-amber)', icon: <Cpu size={16}/> },
              { label: 'Active / Overdue', value: `${executive?.activeJobsCount ?? 0} / ${executive?.overdueJobsCount ?? 0}`, sub: `${executive?.avgCompletionTimeHours?.toFixed(1) ?? 0}h avg completion`, color: 'var(--accent-rose)', icon: <Server size={16}/> },
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
            {/* Radar */}
            <div className="card">
              <div className="section-header">
                <div><div className="section-title">Operational Health Radar</div><div className="section-sub">Live multi-dimensional scoring</div></div>
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

            {/* Top Profitable Jobs */}
            <div className="card">
              <div className="section-header">
                <div><div className="section-title">Job Profitability Ranking</div><div className="section-sub">Top {Math.min(profitability.length, 6)} by gross profit</div></div>
              </div>
              <div style={{ padding: '10px 16px' }}>
                {profitability.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No completed jobs in this period.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={profitability.slice(0, 6)} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <XAxis type="number" tick={{ fill: '#6b6b6b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `K${v.toLocaleString()}`} />
                      <YAxis type="category" dataKey="jobNumber" tick={{ fill: '#94a3b8', fontSize: 11 }} width={90} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`K ${v.toLocaleString()}`]} />
                      <Bar dataKey="profit" radius={[0, 4, 4, 0]} barSize={16}>
                        {profitability.slice(0, 6).map((entry, i) => (
                          <Cell key={i} fill={entry.profit >= 0 ? '#10b981' : '#f43f5e'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="stats-grid-2" style={{ marginBottom: 20 }}>
            {/* Technician Utilization */}
            <div className="card">
              <div className="section-header">
                <div><div className="section-title">Technician Utilization</div><div className="section-sub">Efficiency vs 8h shift standard</div></div>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {techUtils.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No technician data available.</div>
                ) : techUtils.map(tech => {
                  const util = Number(tech.utilizationPercent || 0);
                  const color = util >= 80 ? 'var(--accent-emerald)' : util >= 50 ? 'var(--accent-blue)' : util >= 30 ? 'var(--accent-amber)' : 'var(--accent-rose)';
                  return (
                    <div key={tech.technicianId}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{tech.technicianName}</span>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Jobs: <strong style={{ color: 'var(--text-secondary)' }}>{tech.totalJobs}</strong></span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Hours: <strong style={{ color: 'var(--text-secondary)' }}>{tech.hoursWorked?.toFixed(1)}</strong></span>
                        </div>
                      </div>
                      <HealthBar value={util} color={color} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Asset Performance */}
            <div className="card">
              <div className="section-header">
                <div><div className="section-title">Asset Performance</div><div className="section-sub">Downtime %, MTTR, and failure count</div></div>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {assetPerf.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No asset performance data.</div>
                ) : assetPerf.slice(0, 5).map(asset => {
                  const downtime = asset.downtimePercent || 0;
                  const uptime = Math.max(0, 100 - downtime);
                  const color = uptime >= 95 ? 'var(--accent-emerald)' : uptime >= 80 ? 'var(--accent-blue)' : uptime >= 60 ? 'var(--accent-amber)' : 'var(--accent-rose)';
                  return (
                    <div key={asset.equipmentId}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{asset.equipmentName}</span>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>MTTR: <strong style={{ color: 'var(--text-secondary)' }}>{asset.mttr?.toFixed(1)}h</strong></span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Failures: <strong style={{ color: 'var(--accent-rose)' }}>{asset.failureCount}</strong></span>
                        </div>
                      </div>
                      <HealthBar value={uptime} color={color} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Inventory Consumption */}
          {invConsumption.length > 0 && (
            <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={15} style={{ color: 'var(--accent-amber)' }} />
                <div className="section-title" style={{ fontSize: 14 }}>Parts Consumption Intelligence</div>
              </div>
              <table className="data-table">
                <thead>
                  <tr><th>Part Name</th><th>Qty Used</th><th>Total Cost</th><th>Avg Unit Cost</th><th>Jobs Impacted</th></tr>
                </thead>
                <tbody>
                  {invConsumption.slice(0, 8).map((item, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.partName}</td>
                      <td>{item.quantityUsed}</td>
                      <td style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>K {item.totalConsumptionCost?.toLocaleString()}</td>
                      <td>K {item.avgUnitCost?.toFixed(2)}</td>
                      <td><span className="badge badge-blue">{item.jobsImpacted} jobs</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
