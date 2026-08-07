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
  content = content.replace(/let user:\s*any;\s*let user:\s*any;/g, 'let user: any;');
  fs.writeFileSync(fullPath, content);
});
console.log('Fixed double declarations');
