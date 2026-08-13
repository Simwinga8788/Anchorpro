const fs = require('fs');
const files = [
  'src/app/dashboard/contracts/[id]/print/page.tsx',
  'src/app/dashboard/invoices/[id]/print/page.tsx',
  'src/app/dashboard/jobs/[id]/page.tsx',
  'src/app/dashboard/jobs/[id]/print-invoice/page.tsx',
  'src/app/dashboard/jobs/[id]/print-quotation/page.tsx',
  'src/app/dashboard/procurement/[id]/print-po/page.tsx',
  'src/app/dashboard/quotations/[id]/print/page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('import { use } from')) { continue; }
  
  // 1. Add 'use' to react import or add new import
  if (content.includes("import { useState, useEffect } from 'react'")) {
    content = content.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect, use } from 'react';");
  } else if (content.includes("import { useEffect, useState } from 'react'")) {
    content = content.replace("import { useEffect, useState } from 'react';", "import { useEffect, useState, use } from 'react';");
  } else if (content.includes("import { useState } from 'react'")) {
    content = content.replace("import { useState } from 'react';", "import { useState, use } from 'react';");
  } else if (content.includes("import { useEffect } from 'react'")) {
    content = content.replace("import { useEffect } from 'react';", "import { useEffect, use } from 'react';");
  } else {
    // just add it below 'use client'
    content = content.replace("'use client';", "'use client';\nimport { use } from 'react';");
  }

  // 2. Change signature
  content = content.replace(/params }: \{ params: \{ id: string \} \}/g, 'params }: { params: Promise<{ id: string }> }');
  
  // 3. Replace params.id usage with use(params).id
  // We need to inject `const resolvedParams = use(params);` before `params.id`
  if (content.includes('const id = Number(params.id);')) {
    content = content.replace('const id = Number(params.id);', 'const resolvedParams = use(params);\n  const id = Number(resolvedParams.id);');
  } else if (content.includes('const id = params.id;')) {
    content = content.replace('const id = params.id;', 'const resolvedParams = use(params);\n  const id = resolvedParams.id;');
  }

  fs.writeFileSync(file, content);
  console.log('Fixed', file);
}
