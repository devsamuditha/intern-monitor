import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapTask } from "@/app/api/_lib/mappers";
import { validateBody } from "@/app/api/_lib/validation";
import { ScoreTaskSchema } from "@/app/api/_lib/validation";
import { getRelativeDateStr } from "@/app/api/_lib/mappers";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  let body;
  try {
    body = await validateBody(ScoreTaskSchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { id } = await params;
  const { reviewer_id, score, comment } = body;

  try {
    const prisma = getPrisma();
    const todayStr = getRelativeDateStr(0);

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        score: Number(score),
        comment: comment || null,
      },
    });

    await prisma.mark.create({
      data: {
        internId: updatedTask.assignedToId,
        givenById: reviewer_id,
        relatedTaskId: updatedTask.id,
        score: Number(score),
        comment: comment || null,
        date: todayStr,
      },
    });

    return NextResponse.json(mapTask(updatedTask));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}