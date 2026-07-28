import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapDaySession } from "@/app/api/_lib/mappers";
import { getRelativeDateStr } from "@/app/api/_lib/mappers";

export async function GET(request: NextRequest) {
  try {
    await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  const { intern_id } = Object.fromEntries(request.nextUrl.searchParams);

  try {
    const prisma: any = getPrisma();
    const todayStr = getRelativeDateStr(0);
    const whereClause: any = { date: todayStr };
    if (intern_id) {
      whereClause.internId = String(intern_id);
    }
    const dbSessions = await prisma.daySession.findMany({ where: whereClause });
    return NextResponse.json(dbSessions.map(mapDaySession));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
