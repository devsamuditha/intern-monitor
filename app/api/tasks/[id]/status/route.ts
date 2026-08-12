import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapTask } from "@/app/api/_lib/mappers";
import { validateBody } from "@/app/api/_lib/validation";
import { TaskStatusSchema } from "@/app/api/_lib/validation";
import { getRelativeDateStr } from "@/app/api/_lib/mappers";
import { isValidGithubUrl } from "@/app/api/_lib/mappers";
import { scopeToOrganization } from "@/app/api/_lib/tenant";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  let body;
  try {
    body = await validateBody(TaskStatusSchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { id } = await params;
  const { status, blockers, pr_link, completed_description, self_score, self_comment } = body;

  const validStatuses = ["todo", "in_progress", "done", "TODO", "IN_PROGRESS", "DONE"];
  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status transition. Allowed values: todo, in_progress, done" }, { status: 400 });
  }

  if (pr_link && !isValidGithubUrl(pr_link)) {
    return NextResponse.json({ error: "Invalid PR link. Must be a valid GitHub URL (https://github.com/...)" }, { status: 400 });
  }

  try {
    const prisma = getPrisma();
    const existing = await prisma.task.findFirst({
      where: { id, ...scopeToOrganization({}, user) },
      select: { id: true, prLink: true },
    });
    if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const todayStr = getRelativeDateStr(0);
    const normalizedStatus = String(status).toUpperCase();

    const finalPrLink = pr_link !== undefined ? pr_link : (existing as any).prLink;
    if (normalizedStatus === "DONE" && finalPrLink && !isValidGithubUrl(finalPrLink)) {
      return NextResponse.json({ error: "To mark a task as Done, please provide a valid GitHub PR URL." }, { status: 400 });
    }

    const updateData: any = {
      status: normalizedStatus as any,
      startedAt: normalizedStatus === "IN_PROGRESS" ? new Date().toISOString() : undefined,
      completedAt: normalizedStatus === "DONE" ? todayStr : null,
    };

    if (blockers !== undefined) updateData.blockers = blockers;
    if (pr_link !== undefined) updateData.prLink = pr_link;
    if (completed_description !== undefined) updateData.completedDescription = completed_description;
    if (self_score !== undefined) updateData.selfScore = self_score;
    if (self_comment !== undefined) updateData.selfComment = self_comment;

    const updated = await prisma.task.update({
      where: { id, ...scopeToOrganization({}, user) },
      data: updateData,
    });

    return NextResponse.json(mapTask(updated));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}