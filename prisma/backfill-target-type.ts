import { getPrisma } from "../src/db/prisma.js";

async function backfillTargetType() {
  const prisma = getPrisma();
  const logs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { targetType: null },
        { targetType: "" },
      ],
    },
  });

  let updated = 0;
  for (const log of logs) {
    let targetType: string | null = null;
    if (log.details) {
      try {
        const parsed = JSON.parse(log.details);
        if (parsed && typeof parsed === "object" && parsed.targetType) {
          targetType = String(parsed.targetType);
        }
      } catch {
        // ignore parse errors
      }
    }

    if (targetType) {
      await prisma.auditLog.update({
        where: { id: log.id },
        data: { targetType },
      });
      updated++;
    }
  }

  console.log(`Backfill complete. Updated ${updated} of ${logs.length} audit log rows.`);
}

backfillTargetType()
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  });
