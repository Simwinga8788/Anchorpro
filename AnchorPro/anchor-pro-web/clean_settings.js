const fs = require('fs');

let settings = fs.readFileSync('src/app/dashboard/settings/page.tsx', 'utf8');

// Remove departments from tab list
settings = settings.replace(
  "{ id: 'departments',  icon: <Users size={15} />,     label: 'Departments' },",
  ""
);

// Remove the departments case entirely using regex.
// Find `case 'departments': return (` up to the `</SectionCard>` or next `case`
settings = settings.replace(/case 'departments': return \([\s\S]*?<\/SectionCard>\s*\)\s*;/g, '');

// Clean up unused variables
settings = settings.replace(/const \[departments, setDepartments\] = useState<any\[\]>\(\[\]\);/, '');
settings = settings.replace(/const \[newDeptName, setNewDeptName\] = useState\(''\);/, '');
settings = settings.replace(/const \[savingDept, setSavingDept\] = useState\(false\);/, '');
settings = settings.replace(/departmentsApi\.getAll\(\)\.then\(setDepartments\)\.catch\(\(\) => setDepartments\(\[\]\)\);/, '');

// Clean up the handleAddDepartment and handleDeleteDepartment
settings = settings.replace(/const handleAddDepartment = async \(\) => \{[\s\S]*?finally \{ setSavingDept\(false\); \}\s*\};/g, '');
settings = settings.replace(/const handleDeleteDepartment = async \(id: number\) => \{[\s\S]*?show\('Department removed'\);\s*\};/g, '');

fs.writeFileSync('src/app/dashboard/settings/page.tsx', settings);
