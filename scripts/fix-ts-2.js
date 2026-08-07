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
    content = content.replace(from, to);
  }
  fs.writeFileSync(fullPath, content);
};

// 1. prisma.ts
replaceInFile('src/db/prisma.ts', [
  { from: 'args = (args || {}) as any;\n             args.where = { ...(args.where || {}), organizationId };\n          }\n          return query(args);', 
    to: 'const anyArgs = (args || {}) as any;\n             anyArgs.where = { ...(anyArgs.where || {}), organizationId };\n             return query(anyArgs);\n          }\n          return query(args);' }
]);

// 2. withAuth in messages, logs, replies, questions, tasks
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
    { from: 'await withAuth(request);', to: 'const user = await withAuth(request);' }
  ]);
});

// 2b. Some have it in try-catch without let
filesWithAuth.forEach(file => {
  replaceInFile(file, [
    { from: 'try {\n    const user = await withAuth(request);\n  }', to: 'let user;\n  try {\n    user = await withAuth(request);\n  }' }
  ]);
});


// 3. change-password/route.ts
replaceInFile('app/api/auth/change-password/route.ts', [
  { from: 'userId: dbUser.id,', to: 'userId: user.id,' },
  { from: 'role: dbUser.role,', to: 'role: user.role,' },
  { from: 'organizationId: dbUser.organizationId as string,', to: 'organizationId: user.organizationId as string,' }
]);

// 4. logs/[id]/review/route.ts mistake severity
replaceInFile('app/api/logs/[id]/review/route.ts', [
  { from: 'severity: m.severity,', to: 'severity: String(m.severity).toUpperCase() as any,' }
]);

// 5. logs/route.ts githubUrl & date fallback
replaceInFile('app/api/logs/route.ts', [
  { from: 'githubUrl: body.githubUrl,', to: 'githubUrl: github_url,' },
  { from: 'date: body.date,', to: 'date: todayStr,' }
]);

// 6. messages/route.ts toId
replaceInFile('app/api/messages/route.ts', [
  { from: 'toId: body.toId,', to: 'toId: body.to_id,' }
]);

console.log('Fixed TS files 2');
