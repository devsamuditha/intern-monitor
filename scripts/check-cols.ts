import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  const cols = await prisma.$queryRaw`
    SELECT column_name FROM information_schema.columns WHERE table_name = 'ContentFlag' ORDER BY ordinal_position
  `;
  console.log("ContentFlag columns:", (cols as any[]).map((c) => c.column_name));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
