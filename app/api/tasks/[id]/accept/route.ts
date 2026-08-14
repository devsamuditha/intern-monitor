import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/_lib/withAuth";
import { getPrisma } from "@/src/db/prisma";
import { mapTask } from "@/app/api/_lib/mappers";
import { AcceptTaskSchema } from "@/app/api/_lib/validation";
import { scopeToOrganization } from "@/app/api/_lib/tenant";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let user;
  try {
    user = await withAuth(request);
  } catch (err: any) {
    const status = err.message.includes("Forbidden") ? 403 : err.message.includes("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }

  try {
    AcceptTaskSchema.parse(await request.json());
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const { id } = await params;

  try {
    const prisma = getPrisma();
    const existing = await prisma.task.findFirst({
      where: { id, ...scopeToOrganization({}, user) },
      select: { id: true, assignedToId: true, assignedTechLeadIds: true, pendingAcceptance: true },
    });
    if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });
    const isAssignedTechLead = existing.assignedTechLeadIds?.includes(user.id);
    const isAssignedTo = existing.assignedToId === user.id;
    if (!isAssignedTechLead && !isAssignedTo) {
      return NextResponse.json({ error: "Forbidden: Only the assigned tech lead can accept this task." }, { status: 403 });
    }
    if (!existing.pendingAcceptance) {
      return NextResponse.json({ error: "This task is no longer pending acceptance." }, { status: 400 });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        pendingAcceptance: false,
        acceptedAt: new Date(),
      },
      select: {
        id: true, organizationId: true, assignedToId: true, assignedById: true,
        title: true, description: true, dueDate: true, priority: true,
        status: true, completedAt: true, score: true, comment: true,
        blockers: true, prLink: true, createdAt: true, selfScore: true,
        selfComment: true, completedDescription: true, pendingAcceptance: true,
        acceptedAt: true, assignedTechLeadIds: true,
      },
    });

    return NextResponse.json(mapTask(updated));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
