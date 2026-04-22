'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Download, TrendingUp, Clock, CheckCircle2, Calendar, Mail, Zap, Play, Trash2, Plus, FileSpreadsheet, Eye } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { dashboardApi, reportsApi } from '@/lib/api';
import SlideOver from '@/components/SlideOver';

const colorMap: Record<string, string> = {
  'Preventive': '#3b82f6', 'Corrective': '#f59e0b', 'Emergency': '#f43f5e', 'Inspection': '#10b981', 'Default': '#8b5cf6'
};

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [saving, setSaving] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [pos, setPOs] = useState<any[]>([]);
  const [scheduled, setScheduled] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '', type: 0, cronSchedule: 'Monthly', recipients: '', departmentId: '', isEnabled: true
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([dashboardApi.getJobCards(), dashboardApi.getPurchaseOrders(), reportsApi.getScheduled()])
      .then(([jData, pData, sData]) => {
        setJobs(jData || []);
        setPOs(pData || []);
        setScheduled(sData || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const totalSpend = pos.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const completedJobs = jobs.filter(j => j.status === 3);
  const onTimeRate = jobs.length > 0 ? Math.round((completedJobs.length / jobs.length) * 100) : 0;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = months.map((m, idx) => {
    const done = jobs.filter(j => j.status === 3 && new Date(j.createdAt).getMonth() === idx).length;
    const fail = jobs.filter(j => j.priority === 3 && j.status !== 3 && new Date(j.createdAt).getMonth() === idx).length;
    return { month: m, done, fail };
  }).filter(m => m.done > 0 || m.fail > 0 || m.month === months[new Date().getMonth()]);

  const typeDistribution = jobs.reduce((acc: any, job) => {
    const typeName = job.jobType?.name || 'Uncategorized';
    acc[typeName] = (acc[typeName] || 0) + 1;
    return acc;
  }, {});
  const typeShare = Object.keys(typeDistribution).map(k => ({
    name: k, value: Math.round((typeDistribution[k] / jobs.length) * 100) || 0,
    color: Object.keys(colorMap).find(c => k.includes(c)) ? colorMap[Object.keys(colorMap).find(c => k.includes(c))!] : colorMap['Default']
  }));

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await reportsApi.saveScheduled({
        name: formData.name,
        type: formData.type,
        cronSchedule: formData.cronSchedule,
        recipients: formData.recipients,
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
        isEnabled: formData.isEnabled,
      });
      setShowSchedule(false);
      setFormData({ name: '', type: 0, cronSchedule: 'Monthly', recipients: '', departmentId: '', isEnabled: true });
      loadData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRunReport = async (id: number) => {
    try {
      const res = await reportsApi.runReport(id);
      alert(res.message || 'Report triggered successfully');
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this scheduled report?')) return;
    try {
      await reportsApi.deleteScheduled(id);
      loadData();
    } catch (err: any) { alert(err.message); }
  };

  const reportTypeLabels: Record<number, string> = { 0: 'Maintenance Summary', 1: 'Procurement Summary', 2: 'Departmental Audit' };

  return (
    <div>
      <SlideOver open={showSchedule} onClose={() => setShowSchedule(false)} title="Schedule Intelligence Report" subtitle="Automate data distribution and organizational auditing.">
        <form onSubmit={handleSchedule} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-field">
            <label className="form-label">Report Name</label>
            <input className="form-input" required placeholder="e.g. Monthly Maintenance Audit" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="form-field">
            <label className="form-label">Report Type</label>
            <select className="form-select" value={formData.type} onChange={e => setFormData({...formData, type: parseInt(e.target.value)})}>
              <option value={0}>Monthly Maintenance Summary</option>
              <option value={1}>Procurement & Spend Snapshot</option>
              <option value={2}>Cross-Departmental Audit</option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Frequency</label>
              <select className="form-select" value={formData.cronSchedule} onChange={e => setFormData({...formData, cronSchedule: e.target.value})}>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Department Scope</label>
              <select className="form-select" value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})}>
                <option value="">Entire Organization</option>
              </select>
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Recipient Emails (comma-separated)</label>
            <textarea className="form-textarea" required placeholder="manager@company.com" value={formData.recipients} onChange={e => setFormData({...formData, recipients: e.target.value})} />
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowSchedule(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? 'Saving...' : 'Enable Scheduler'}</button>
          </div>
        </form>
      </SlideOver>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Reports & Intelligence</h1>
          <p className="page-subtitle">Processing metrics from {jobs.length} jobs, {pos.length} POs, {scheduled.length} scheduled reports.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowSchedule(true)}><Calendar size={14}/> Schedule Report</button>
          <a href={reportsApi.downloadExcelUrl('0')} className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}><Download size={14}/> Download Excel</a>
        </div>
      </div>

      <div className="stats-grid-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Jobs Tracked', value: jobs.length, change: 'Live DB', color: 'var(--accent-blue)', icon: <CheckCircle2 size={16}/> },
          { label: 'Completion Rate', value: `${onTimeRate}%`, change: 'Based on actuals', color: 'var(--accent-emerald)', icon: <TrendingUp size={16}/> },
          { label: 'Procurement Volume', value: `K ${totalSpend.toLocaleString()}`, change: 'Active PO Value', color: 'var(--accent-amber)', icon: <Zap size={16}/> },
          { label: 'Scheduled Reports', value: scheduled.length, change: 'Automated', color: 'var(--accent-violet)', icon: <Mail size={16}/> },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className="stat-icon" style={{ background: s.color+'20', marginBottom: 0 }}>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
              <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-muted)' }}>{s.change}</div>
            </div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ fontSize: 24, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="stats-grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="section-header">
            <div><div className="section-title">Operational Excellence</div><div className="section-sub">Monthly throughput vs Overdue trend</div></div>
          </div>
          <div style={{ padding: '20px 0 10px' }}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} margin={{ left: -10, right: 10 }}>
                <XAxis dataKey="month" tick={{ fill: '#6b6b6b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b6b6b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="done" fill="var(--accent-blue)" radius={[4,4,0,0]} barSize={30} name="Completed" />
                <Bar dataKey="fail" fill="var(--accent-rose)" radius={[4,4,0,0]} barSize={20} name="Critical Backlog" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="section-header">
            <div><div className="section-title">Work Breakdown</div><div className="section-sub">Relative distribution by type</div></div>
          </div>
          <div style={{ padding: '16px 0 10px' }}>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={typeShare} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {typeShare.map((entry, index) => <Cell key={index} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`]} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} formatter={(val) => <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Scheduled Reports Table */}
      <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="section-title" style={{ fontSize: 14 }}>Scheduled Reports</div>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowSchedule(true)}><Plus size={13}/> New</button>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Type</th><th>Frequency</th><th>Recipients</th><th>Next Run</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {scheduled.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No scheduled reports. Click "Schedule Report" to automate your first one.</td></tr>
            ) : scheduled.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</td>
                <td><span className="badge badge-blue">{reportTypeLabels[r.type] || r.type}</span></td>
                <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{r.cronSchedule}</td>
                <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.recipients}</td>
                <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{r.nextRun ? new Date(r.nextRun).toLocaleDateString() : '—'}</td>
                <td><span className={`badge ${r.isEnabled ? 'badge-green' : 'badge-muted'}`}>{r.isEnabled ? 'Active' : 'Disabled'}</span></td>
                <td style={{ textAlign: 'right', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button className="btn btn-secondary btn-sm" title="Run Now" onClick={() => handleRunReport(r.id)}><Play size={12}/></button>
                  <button className="btn btn-secondary btn-sm" title="Delete" onClick={() => handleDelete(r.id)}><Trash2 size={12}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Download Section */}
      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        {[
          { label: 'Maintenance Summary', type: '0', icon: <FileSpreadsheet size={18}/> },
          { label: 'Procurement Report', type: '1', icon: <FileSpreadsheet size={18}/> },
          { label: 'Departmental Audit', type: '2', icon: <FileSpreadsheet size={18}/> },
        ].map(r => (
          <div key={r.type} className="card" style={{ padding: 20, textAlign: 'center' }}>
            <div style={{ color: 'var(--accent-blue)', marginBottom: 12 }}>{r.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{r.label}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <a href={reportsApi.downloadExcelUrl(r.type)} className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}><Download size={12}/> Excel</a>
              <a href={reportsApi.previewHtmlUrl(r.type)} target="_blank" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}><Eye size={12}/> Preview</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
