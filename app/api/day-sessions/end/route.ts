import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapDaySession } from "@/app/api/_lib/mappers";
import { validateBody } from "@/app/api/_lib/validation";
import { EndDaySchema } from "@/app/api/_lib/validation";
import { getRelativeDateStr } from "@/app/api/_lib/mappers";
import { getISTTimeString, getISTDate } from '../../../../src/utils/time';
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
    body = await validateBody(EndDaySchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { intern_id, end_journal } = body;

  try {
    const prisma: any = getPrisma();
    const todayStr = getRelativeDateStr(0);

    const existing = await prisma.daySession.findFirst({
      where: scopeToOrganization({ internId: intern_id, date: todayStr }, user),
    });

    if (!existing) {
      return NextResponse.json({ error: "No active day session found for today" }, { status: 404 });
    }

    const ist = getISTDate();
    const istMinutes = ist.getHours() * 60 + ist.getMinutes();
    
    if (istMinutes < 17 * 60 && !existing.earlyExitApproved) {
      return NextResponse.json({ error: "Cannot end day before 5:00 PM without Tech Lead approval." }, { status: 403 });
    }

    // Check if a DailyLog was submitted today after 4:30 PM (16:30 -> 16 * 60 + 30)
    // For simplicity, we just check if they submitted any log today (which satisfies 'hasLogToday' in frontend).
    // Or we could strictly enforce 4:30 - 5:00 PM submission if we check the DailyLog createdAt.
    // For now, if it's 5:15 PM and they didn't manually end day, this endpoint might be called by auto-logout. 
    // Let's rely on the frontend passing `end_journal` or just check `DailyLog`.
    // We will query if there is any DailyLog for today.
    
    const todaysLog = await prisma.dailyLog.findFirst({
      where: { internId: intern_id, date: todayStr },
      orderBy: { createdAt: 'desc' }
    });

    let missedFinalJournal = false;
    if (!todaysLog) {
      missedFinalJournal = true; // No log submitted at all
    } else {
      // Get the creation time of the log in IST
      const logUtc = todaysLog.createdAt;
      const logIst = new Date(logUtc.getTime() + 5.5 * 3600000);
      const logIstMinutes = logIst.getUTCHours() * 60 + logIst.getUTCMinutes();
      
      // If it's a regular end-of-day (not early exit), log should be after 4:30 PM (16 * 60 + 30 = 990 minutes)
      if (!existing.earlyExitApproved && logIstMinutes < 990) {
        missedFinalJournal = true;
      }
    }

    const timeStr = getISTTimeString();

    const updated = await prisma.daySession.update({
      where: { id: existing.id },
      data: {
        endedAt: timeStr,
        status: "completed",
        endJournal: end_journal || null,
        missedFinalJournal: missedFinalJournal,
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
