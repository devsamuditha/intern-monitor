import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const replaceInFile = (filePath, replacements) => {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  for (const { from, to } of replacements) {
    // replace all occurrences
    content = content.split(from).join(to);
  }
  fs.writeFileSync(fullPath, content);
};

const filesWithAuth = [
  'app/api/messages/route.ts', 
  'app/api/logs/route.ts', 
  'app/api/logs/[id]/review/route.ts', 
  'app/api/questions/[id]/replies/route.ts', 
  'app/api/questions/route.ts', 
  'app/api/tasks/[id]/review/route.ts'
];

filesWithAuth.forEach(file => {
  replaceInFile(file, [
    { from: 'try {\n    await withAuth(request);\n  }', to: 'let user: any;\n  try {\n    user = await withAuth(request);\n  }' },
    { from: 'try {\n    const user = await withAuth(request);\n  }', to: 'let user: any;\n  try {\n    user = await withAuth(request);\n  }' },
    { from: 'let user;\n  try {\n    user = await withAuth(request);\n  }', to: 'let user: any;\n  try {\n    user = await withAuth(request);\n  }' }
  ]);
});

console.log('Fixed auth scopes');
