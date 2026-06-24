const fs = require('fs');

let hr = fs.readFileSync('src/app/dashboard/hr/page.tsx', 'utf8');
let team = fs.readFileSync('team_backup.tsx', 'utf8');

// Update hr tabs
hr = hr.replace(
  "type Tab = 'employees' | 'contracts' | 'payroll';",
  "type Tab = 'team' | 'departments' | 'employees' | 'contracts' | 'payroll';"
);

hr = hr.replace(
  "const [activeTab, setActiveTab] = useState<Tab>('employees');",
  "const [activeTab, setActiveTab] = useState<Tab>('team');"
);

hr = hr.replace(
  "label: 'Employees',    icon: <Users size={13} /> },",
  "label: 'Employee Profiles',    icon: <UserCog size={13} /> },"
);

hr = hr.replace(
  "{ key: 'employees', label: 'Employee Profiles'",
  "{ key: 'team', label: 'Team Directory', icon: <Users size={13} /> },\n          { key: 'departments', label: 'Departments', icon: <Users size={13} /> },\n          { key: 'employees', label: 'Employee Profiles'"
);

hr = hr.replace(
  "{activeTab === 'employees' && <EmployeesTab />}",
  "{activeTab === 'team' && <TeamDirectoryTab />}\n      {activeTab === 'departments' && <DepartmentsTab />}\n      {activeTab === 'employees' && <EmployeesTab />}"
);

// add imports
if (!hr.includes('import { usersApi }')) {
  hr = hr.replace("import { hrApi, departmentsApi } from '@/lib/api';", "import { hrApi, departmentsApi, usersApi } from '@/lib/api';");
}
if (!hr.includes('Trash2')) {
  hr = hr.replace(
    "import { Users, FileText, DollarSign, Search, CheckCircle2, ChevronRight, Download, Upload, Plus, Pencil } from 'lucide-react';",
    "import { Users, FileText, DollarSign, Search, CheckCircle2, ChevronRight, Download, Upload, Plus, Pencil, Trash2, UserCog, Clock, MoreHorizontal, Star, Hash, UserX, UserCheck, X, Loader2 } from 'lucide-react';"
  );
}

// Convert team page to tab
let teamTab = team.substring(team.indexOf('export default function TeamPage() {'));
teamTab = teamTab.replace('export default function TeamPage() {', 'function TeamDirectoryTab() {');

// Remove the page header exactly
const headerToRemove = `      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Team Registry</h1>
          <p className="page-subtitle">{loading ? 'Loading...' : \`\${team.length} members on the platform\`}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
          <Plus size={14} /> Add Member
        </button>
      </div>`;

teamTab = teamTab.replace(headerToRemove, `
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setShowInvite(true)}>
          <Plus size={14} /> Add Member
        </button>
      </div>
`);

hr += '\n// ─── Team Directory Tab ───────────────────────────────────────────────────\n' + teamTab;

// Add departments tab
const deptTab = `
// ─── Departments Tab ──────────────────────────────────────────────────────────
function DepartmentsTab() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [newDeptName, setNewDeptName] = useState('');
  const [savingDept, setSavingDept] = useState(false);

  useEffect(() => {
    departmentsApi.getAll().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  const handleAddDepartment = async () => {
    if (!newDeptName.trim()) return;
    setSavingDept(true);
    try {
      await departmentsApi.create({ name: newDeptName.trim() });
      setNewDeptName('');
      departmentsApi.getAll().then(setDepartments).catch(() => {});
      alert('Department added');
    } catch (e: any) { alert(e.message || 'Failed'); }
    finally { setSavingDept(false); }
  };

  const handleDeleteDepartment = async (id: number) => {
    if (!confirm('Delete this department?')) return;
    await departmentsApi.delete(id);
    setDepartments(d => d.filter((x: any) => x.id !== id));
    alert('Department removed');
  };

  return (
    <div className="card-elevated" style={{ padding: '24px', maxWidth: 600 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Departments</h3>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Organise your team members and job cards by department</p>
      
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input className="form-input" style={{ flex: 1 }} placeholder="e.g. Electrical, Mechanical, HVAC..."
          value={newDeptName} onChange={e => setNewDeptName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAddDepartment(); }} />
        <button className="btn btn-primary btn-sm" onClick={handleAddDepartment} disabled={savingDept || !newDeptName.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {savingDept ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={13} />} Add
        </button>
      </div>

      {departments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
          No departments yet. Add one above to get started.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {departments.map((d: any) => (
            <div key={d.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '11px 16px', background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)',
              borderRadius: 8, transition: 'border-color 0.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-blue)' }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{d.name}</span>
              </div>
              <button onClick={() => handleDeleteDepartment(d.id)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 4, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-rose)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
`;

hr += '\n' + deptTab;

fs.writeFileSync('src/app/dashboard/hr/page.tsx', hr);
