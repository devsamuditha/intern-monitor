import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapDaySession } from "@/app/api/_lib/mappers";
import { validateBody } from "@/app/api/_lib/validation";
import { EndDaySchema } from "@/app/api/_lib/validation";
import { getRelativeDateStr } from "@/app/api/_lib/mappers";

export async function POST(request: NextRequest) {
  try {
    await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  let body;
  try {
    body = await validateBody(EndDaySchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { intern_id, end_journal } = body;

  try {
    const prisma: any = getPrisma();
    const todayStr = getRelativeDateStr(0);

    const existing = await prisma.daySession.findFirst({
      where: { internId: intern_id, date: todayStr },
    });

    if (!existing) {
      return NextResponse.json({ error: "No active day session found for today" }, { status: 404 });
    }

    const timeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    const updated = await prisma.daySession.update({
      where: { id: existing.id },
      data: {
        endedAt: timeStr,
        status: "completed",
        endJournal: end_journal || null,
      },
    });

    try {
      await prisma.user.update({
        where: { id: intern_id },
        data: { isActive: false },
      });
    } catch (_) {}

    return NextResponse.json(mapDaySession(updated));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
