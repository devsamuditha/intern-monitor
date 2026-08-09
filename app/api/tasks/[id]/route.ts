import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapTask } from "@/app/api/_lib/mappers";
import { validateBody } from "@/app/api/_lib/validation";
import { UpdateTaskSchema, TaskStatusSchema } from "@/app/api/_lib/validation";
import { getRelativeDateStr } from "@/app/api/_lib/mappers";
import { isValidGithubUrl } from "@/app/api/_lib/mappers";
import { scopeToOrganization } from "@/app/api/_lib/tenant";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  let body;
  try {
    body = await validateBody(UpdateTaskSchema)(request);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { id } = await params;
  const { title, description, due_date, priority, status, blockers, pr_link } = body;

  if (pr_link && !isValidGithubUrl(pr_link)) {
    return NextResponse.json({ error: "Invalid PR link. Must be a valid GitHub URL (https://github.com/...)" }, { status: 400 });
  }

  try {
    const prisma = getPrisma();
    const existing = await prisma.task.findFirst({
      where: { id, ...scopeToOrganization({}, user) },
      select: { id: true, organizationId: true, prLink: true },
    });
    if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const todayStr = getRelativeDateStr(0);
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (due_date !== undefined) updateData.dueDate = due_date;
    if (priority !== undefined) updateData.priority = String(priority).toUpperCase();
    if (blockers !== undefined) updateData.blockers = blockers;
    if (pr_link !== undefined) updateData.prLink = pr_link;
    if (status !== undefined) {
      const normalizedStatus = String(status).toUpperCase();
      updateData.status = normalizedStatus;
      updateData.completedAt = normalizedStatus === "DONE" ? todayStr : null;
    }

    const updated = await prisma.task.update({
      where: { id, ...scopeToOrganization({}, user) },
      data: updateData,
      select: { id: true, organizationId: true, assignedToId: true, assignedById: true, title: true, description: true, dueDate: true, priority: true, status: true, completedAt: true, score: true, comment: true, blockers: true, prLink: true, createdAt: true },
    });

    return NextResponse.json(mapTask(updated));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  const { id } = await params;
  try {
    const prisma = getPrisma();
    const existing = await prisma.task.findFirst({
      where: { id, ...scopeToOrganization({}, user) },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}