const fs = require('fs');

let hr = fs.readFileSync('src/app/dashboard/hr/page.tsx', 'utf8');
let team = fs.readFileSync('team_backup.tsx', 'utf8');

// 1. Merge Team Management tabs into hr
hr = hr.replace(
  "type Tab = 'employees' | 'contracts' | 'payroll';",
  "type Tab = 'employees' | 'contracts' | 'payroll' | 'team' | 'departments';"
);

hr = hr.replace(
  "{ key: 'employees', label: 'Employees', icon: <Users size={16} /> },",
  "{ key: 'team', label: 'Team Directory', icon: <Users size={16} /> },\n          { key: 'departments', label: 'Departments', icon: <Users size={16} /> },\n          { key: 'employees', label: 'Employee Profiles', icon: <UserCog size={16} /> },"
);

const teamMatch = team.match(/const renderContent = \(\) => \{\s*switch \(activeTab\) \{([\s\S]*?)default:/);
if (teamMatch && teamMatch[1]) {
  hr = hr.replace(
    "switch (activeTab) {\n      case 'employees': return renderEmployees();",
    "switch (activeTab) {\n" + teamMatch[1] + "      case 'employees': return renderEmployees();"
  );
}

const renderTeamDirMatch = team.match(/const renderTeamDirectory = \(\) => \{[\s\S]*?\};(?=\s*const renderRoles)/);
if (renderTeamDirMatch && renderTeamDirMatch[0]) {
  let teamDirCode = renderTeamDirMatch[0];
  teamDirCode = teamDirCode.replace(/import .*?;\n/g, ""); // remove inner imports
  hr = hr.replace("const renderEmployees = () => (", teamDirCode + "\n\n  const renderEmployees = () => (");
}

const renderDeptsMatch = team.match(/const renderDepartments = \(\) => \{[\s\S]*?\};(?=\s*const renderContent)/);
if (renderDeptsMatch && renderDeptsMatch[0]) {
  let deptsCode = renderDeptsMatch[0];
  hr = hr.replace("const renderEmployees = () => (", deptsCode + "\n\n  const renderEmployees = () => (");
}

// 2. Fix imports
hr = hr.replace(
  "import { useState, useEffect } from 'react';",
  "import { useState, useEffect, useRef } from 'react';"
);

hr = hr.replace(
  "  Calendar, TrendingUp, Eye, Download\n} from 'lucide-react';",
  "  Calendar, TrendingUp, Eye, Download,\n  UserCog, Trash2, Star, MoreHorizontal, Loader2, Hash, UserX, UserCheck, Pencil\n} from 'lucide-react';"
);

// 3. Fix CheckCircle2
hr = hr.replace(/<CheckCircle2/g, "<CheckCircle");

fs.writeFileSync('src/app/dashboard/hr/page.tsx', hr);
