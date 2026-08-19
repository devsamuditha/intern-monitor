import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapDaySession } from "@/app/api/_lib/mappers";
import { scopeToOrganization } from "@/app/api/_lib/tenant";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let user;
  try {
    user = await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  const { intern_id, limit } = Object.fromEntries(request.nextUrl.searchParams);

  try {
    const prisma: any = getPrisma();
    const whereClause: any = scopeToOrganization({}, user);
    if (intern_id) {
      whereClause.internId = String(intern_id);
    }

    const limitNum = limit ? parseInt(limit, 10) : 30;
    const safeLimit = Math.min(Math.max(limitNum, 1), 100);

    const dbSessions = await prisma.daySession.findMany({
      where: whereClause,
      select: {
        id: true, internId: true, date: true, startedAt: true, endedAt: true,
        status: true, todayProject: true, todayPlan: true, questions: true,
        gitLink: true, endJournal: true, organizationId: true,
        earlyExitRequested: true, earlyExitReason: true, earlyExitApproved: true,
        missedFinalJournal: true,
      },
      orderBy: { createdAt: "desc" },
      take: safeLimit,
    });

    return NextResponse.json(dbSessions.map(mapDaySession));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
