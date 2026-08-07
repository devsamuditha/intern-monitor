import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapDailyLog } from "@/app/api/_lib/mappers";
import { validateBody } from "@/app/api/_lib/validation";
import { ReviewLogSchema } from "@/app/api/_lib/validation";
import { getRelativeDateStr } from "@/app/api/_lib/mappers";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let user: any;
  try {
    user = await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  let body;
  try {
    body = await validateBody(ReviewLogSchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { id } = await params;
  const { reviewer_id, score, comment, mistakesFlagged } = body;

  try {
    const prisma = getPrisma();
    const log = await prisma.dailyLog.findUnique({ where: { id } });
    if (!log) return NextResponse.json({ error: "Daily log not found" }, { status: 404 });

    const updatedLog = await prisma.dailyLog.update({
      where: { id },
      data: { status: "reviewed" },
    });

    const todayStr = getRelativeDateStr(0);

    if (score !== undefined) {
      await prisma.mark.create({
        data: {
          internId: log.internId,
          givenById: reviewer_id,
          relatedLogId: log.id,
          score: Number(score),
          comment: body.comment || null,
          date: new Date().toISOString(),
          organizationId: user.organizationId as string,
        },
      });
    }

    if (mistakesFlagged && Array.isArray(mistakesFlagged)) {
      for (const m of mistakesFlagged) {
        await prisma.mistake.create({
          data: {
            internId: log.internId,
            flaggedById: reviewer_id,
            relatedLogId: log.id,
            note: m.note,
            severity: String(m.severity).toUpperCase() as any,
            date: new Date().toISOString(),
            resolved: false,
            organizationId: user.organizationId as string,
          },
        });
      }
    }

    return NextResponse.json({ success: true, log: mapDailyLog(updatedLog) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}