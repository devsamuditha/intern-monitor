import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapAuditLog } from "@/app/api/_lib/mappers";

export async function GET(request: NextRequest) {
  try {
    await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  try {
    const prisma = getPrisma();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const summary = await prisma.$queryRaw`
      SELECT "userId" as "actorId", u.name as "actorName", COUNT(*) as count
      FROM "AuditLog"
      JOIN "User" u ON "AuditLog"."userId" = u.id
      WHERE "AuditLog"."timestamp" >= ${oneWeekAgo}
      GROUP BY "AuditLog"."userId", u.name
      ORDER BY count DESC
      LIMIT 10
    `;

    return NextResponse.json(summary);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
