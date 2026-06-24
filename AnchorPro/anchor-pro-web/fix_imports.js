const fs = require('fs');
let hr = fs.readFileSync('src/app/dashboard/hr/page.tsx', 'utf8');

hr = hr.replace(/import \{([\s\S]*?)\} from 'lucide-react';/, "import { $1, UserCog, Trash2, Star, MoreHorizontal, Loader2, Hash, UserX, UserCheck, Pencil } from 'lucide-react';");

// Use \s* to match any whitespace
hr = hr.replace(/import\s*\{\s*useState,\s*useEffect\s*\}\s*from\s*'react';/, "import { useState, useEffect, useRef } from 'react';");

hr = hr.replace(/<CheckCircle2/g, "<CheckCircle");

fs.writeFileSync('src/app/dashboard/hr/page.tsx', hr);
