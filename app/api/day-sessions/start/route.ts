import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapDaySession } from "@/app/api/_lib/mappers";
import { validateBody } from "@/app/api/_lib/validation";
import { StartDaySchema } from "@/app/api/_lib/validation";
import { getRelativeDateStr } from "@/app/api/_lib/mappers";
import { getISTTimeString } from '../../../../src/utils/time';

export async function POST(request: NextRequest) {
  try {
    await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  let body;
  try {
    body = await validateBody(StartDaySchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { intern_id, today_project, today_plan, questions, git_link } = body;

  try {
    const prisma: any = getPrisma();
    const todayStr = getRelativeDateStr(0);

    const existing = await prisma.daySession.findFirst({
      where: { internId: intern_id, date: todayStr },
    });

    if (existing) {
      const updated = await prisma.daySession.update({
        where: { id: existing.id },
        data: {
          todayProject: today_project || existing.todayProject,
          todayPlan: today_plan || existing.todayPlan,
          questions: questions || existing.questions,
          gitLink: git_link || existing.gitLink,
        },
      });
      return NextResponse.json(mapDaySession(updated));
    }

    const timeStr = getISTTimeString();

    const created = await prisma.daySession.create({
      data: {
        internId: intern_id,
        date: todayStr,
        startedAt: timeStr,
        status: "active",
        todayProject: today_project || null,
        todayPlan: today_plan || null,
        questions: questions || null,
        gitLink: git_link || null,
      },
    });

    try {
      await prisma.user.update({
        where: { id: intern_id },
        data: { isActive: true },
      });
    } catch (_) {}

    return NextResponse.json(mapDaySession(created));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
