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

// src/db/prisma.ts
replaceInFile('src/db/prisma.ts', [
  { from: 'args.where = { ...args.where, organizationId };', to: 'args.where = { ...(args.where || {}), organizationId };' },
  { from: 'args = args || {};', to: 'args = (args || {}) as any;' }
]);

// change-password
replaceInFile('app/api/auth/change-password/route.ts', [
  { from: 'mustChangePassword: false,\n    });', to: 'mustChangePassword: false,\n      organizationId: dbUser.organizationId,\n    });' }
]);

// content-flags
replaceInFile('app/api/content-flags/route.ts', [
  { from: 'status: \'PENDING\',\n        },', to: 'status: \'PENDING\',\n          organizationId: user.organizationId!,\n        },' }
]);

// logs/[id]/review
replaceInFile('app/api/logs/[id]/review/route.ts', [
  { from: 'date: new Date().toISOString(),\n        }', to: 'date: new Date().toISOString(),\n          organizationId: user.organizationId!,\n        }' },
  { from: 'resolved: false,\n        }', to: 'resolved: false,\n          organizationId: user.organizationId!,\n        }' }
]);

// logs
replaceInFile('app/api/logs/route.ts', [
  { from: 'status: \'DRAFT\',\n      },', to: 'status: \'DRAFT\',\n        organizationId: user.organizationId!,\n      },' }
]);

// messages
replaceInFile('app/api/messages/route.ts', [
  { from: 'content: body.content,\n      }', to: 'content: body.content,\n        organizationId: user.organizationId!,\n      }' }
]);

// questions/[id]/replies
replaceInFile('app/api/questions/[id]/replies/route.ts', [
  { from: 'content: body.content,\n      }', to: 'content: body.content,\n        organizationId: user.organizationId!,\n      }' }
]);

// questions
replaceInFile('app/api/questions/route.ts', [
  { from: 'content: body.content,\n      }', to: 'content: body.content,\n        organizationId: user.organizationId!,\n      }' }
]);

// tasks/[id]/review
replaceInFile('app/api/tasks/[id]/review/route.ts', [
  { from: 'date: new Date().toISOString(),\n        }', to: 'date: new Date().toISOString(),\n          organizationId: user.organizationId!,\n        }' }
]);

// system-settings/[key]
replaceInFile('app/api/superadmin/system-settings/[key]/route.ts', [
  { from: 'where: { key }', to: 'where: { organizationId_key: { organizationId: user.organizationId as string, key } }' },
  { from: 'where: { key }', to: 'where: { organizationId_key: { organizationId: user.organizationId as string, key } }' },
  { from: 'updatedBy: user.id,\n      }', to: 'updatedBy: user.id,\n        organizationId: user.organizationId as string,\n      }' }
]);

// system-settings
replaceInFile('app/api/superadmin/system-settings/route.ts', [
  { from: 'where: { key }', to: 'where: { organizationId_key: { organizationId: user.organizationId as string, key } }' },
  { from: 'where: { key }', to: 'where: { organizationId_key: { organizationId: user.organizationId as string, key } }' },
  { from: 'updatedBy: user.id,\n        }', to: 'updatedBy: user.id,\n          organizationId: user.organizationId as string,\n        }' }
]);

console.log('Fixed TS files');
