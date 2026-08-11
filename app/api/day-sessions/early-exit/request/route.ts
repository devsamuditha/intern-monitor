import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapDaySession, getRelativeDateStr } from "@/app/api/_lib/mappers";
import { scopeToOrganization } from "@/app/api/_lib/tenant";

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  let body;
  try {
    body = await request.json();
  } catch (err: any) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { intern_id, reason } = body;

  if (!intern_id || !reason) {
    return NextResponse.json({ error: "intern_id and reason are required" }, { status: 400 });
  }

  try {
    const prisma: any = getPrisma();
    const todayStr = getRelativeDateStr(0);

    const existing = await prisma.daySession.findFirst({
      where: scopeToOrganization({ internId: intern_id, date: todayStr }, user),
    });

    if (!existing) {
      return NextResponse.json({ error: "No active day session found for today" }, { status: 404 });
    }

    const updated = await prisma.daySession.update({
      where: { id: existing.id },
      data: {
        earlyExitRequested: true,
        earlyExitReason: reason,
      },
    });

    return NextResponse.json(mapDaySession(updated));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
