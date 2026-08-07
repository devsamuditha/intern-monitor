import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "SystemSetting" DROP CONSTRAINT "SystemSetting_key_key";');
    console.log('Constraint dropped');
  } catch (e) {
    console.log('Error or already dropped:', e);
  }
  
  await prisma.$disconnect();
}

main();
