import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration to SaaS...');

  // 1. Create or find the Legacy Organization
  let legacyOrg = await prisma.organization.findFirst({
    where: { name: 'Legacy Organization' },
  });

  if (!legacyOrg) {
    console.log('Creating Legacy Organization...');
    legacyOrg = await prisma.organization.create({
      data: {
        name: 'Legacy Organization',
        slug: 'legacy-organization',
      },
    });
  } else {
    console.log('Legacy Organization already exists.');
  }

  const orgId = legacyOrg.id;

  // 2. Assign all existing users to this organization (unless Super Admin)
  const usersUpdated = await prisma.user.updateMany({
    where: {
      organizationId: null,
      role: { not: 'SUPER_ADMIN' },
    },
    data: {
      organizationId: orgId,
    },
  });
  console.log(`Updated ${usersUpdated.count} users.`);

  // 3. Assign all other entities to this organization where null
  const modelsToUpdate = [
    'project',
    'dailyLog',
    'task',
    'mark',
    'mistake',
    'message',
    'question',
    'reply',
    'daySession',
    'auditLog',
    'systemSetting',
    'contentFlag',
  ] as const;

  for (const modelName of modelsToUpdate) {
    const model = (prisma as any)[modelName];
    if (model) {
      try {
        const result = await model.updateMany({
          where: { organizationId: null },
          data: { organizationId: orgId },
        });
        console.log(`Updated ${result.count} records in ${modelName}.`);
      } catch (e) {
        console.error(`Failed to update ${modelName}:`, e);
      }
    }
  }

  console.log('Migration completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
