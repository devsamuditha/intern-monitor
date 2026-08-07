import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [
  'app/api/questions/route.ts',
  'app/api/messages/route.ts',
  'app/api/logs/route.ts'
];

files.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Clean up any previous messed up attempts (like let user: any;\n  try { let user: any;)
  content = content.replace(/let user: any;\s*let user: any;/g, 'let user: any;');
  
  // Replace the remaining ones
  content = content.replace(/try\s*\{\s*(?:const\s+)?user\s*=\s*await\s+withAuth\(request\);\s*\}/g, 'let user: any;\n  try {\n    user = await withAuth(request);\n  }');
  content = content.replace(/try\s*\{\s*await\s+withAuth\(request\);\s*\}/g, 'let user: any;\n  try {\n    user = await withAuth(request);\n  }');
  
  fs.writeFileSync(fullPath, content);
});
console.log('Fixed overlapping');
